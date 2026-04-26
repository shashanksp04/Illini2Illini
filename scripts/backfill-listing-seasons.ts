import type { Prisma, Season } from "@prisma/client";

import { normalizeSeasons, parseTitleSeasons } from "@/lib/listings/seasons";
import { prisma } from "@/lib/prisma";

type ListingRow = {
  id: string;
  title: string;
  start_date: Date;
  end_date: Date;
  seasons: Season[];
};

function toUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function utcDate(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day));
}

function overlapsRange(start: Date, end: Date, rangeStart: Date, rangeEnd: Date): boolean {
  return start <= rangeEnd && end >= rangeStart;
}

function isExactSummerOnlyWindow(start: Date, end: Date): boolean {
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  return (
    sameYear &&
    start.getUTCMonth() === 4 &&
    start.getUTCDate() === 15 &&
    end.getUTCMonth() === 7 &&
    end.getUTCDate() === 15
  );
}

function monthDayDistance(aMonth: number, aDay: number, bMonth: number, bDay: number): number {
  const baseYear = 2001;
  const a = Date.UTC(baseYear, aMonth - 1, aDay);
  const b = Date.UTC(baseYear, bMonth - 1, bDay);
  return Math.abs(Math.round((a - b) / 86_400_000));
}

function isNearMonthDay(date: Date, month: number, day: number, toleranceDays = 1): boolean {
  return monthDayDistance(date.getUTCMonth() + 1, date.getUTCDate(), month, day) <= toleranceDays;
}

function getManualOverride(start: Date, end: Date): Season[] | null {
  const manualOverrides: Array<{
    startMonth: number;
    startDay: number;
    endMonth: number;
    endDay: number;
    seasons: Season[];
  }> = [
    { startMonth: 5, startDay: 16, endMonth: 8, endDay: 6, seasons: ["SUMMER"] },
    { startMonth: 4, startDay: 30, endMonth: 7, endDay: 30, seasons: ["SUMMER"] },
    { startMonth: 5, startDay: 9, endMonth: 7, endDay: 30, seasons: ["SUMMER"] },
    { startMonth: 5, startDay: 17, endMonth: 8, endDay: 4, seasons: ["SUMMER"] },
    { startMonth: 3, startDay: 23, endMonth: 8, endDay: 2, seasons: ["SPRING", "SUMMER"] },
    { startMonth: 1, startDay: 31, endMonth: 8, endDay: 2, seasons: ["SPRING", "SUMMER"] },
    { startMonth: 8, startDay: 17, endMonth: 7, endDay: 30, seasons: ["FULL_YEAR"] },
  ];

  for (const override of manualOverrides) {
    if (
      isNearMonthDay(start, override.startMonth, override.startDay, 1) &&
      isNearMonthDay(end, override.endMonth, override.endDay, 1)
    ) {
      return override.seasons;
    }
  }

  return null;
}

function deriveSeasonsFromDates(startDate: Date, endDate: Date): Season[] {
  const start = toUtcDateOnly(startDate);
  const end = toUtcDateOnly(endDate);
  if (isExactSummerOnlyWindow(start, end)) {
    return ["SUMMER"];
  }

  const seasons = new Set<Season>();
  for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year += 1) {
    const springStart = utcDate(year, 0, 1);
    const springEnd = utcDate(year, 4, 14);
    const summerStart = utcDate(year, 4, 15);
    const summerEnd = utcDate(year, 7, 15);
    const fallStart = utcDate(year, 7, 1);
    const fallEnd = utcDate(year, 11, 31);

    if (overlapsRange(start, end, springStart, springEnd)) {
      seasons.add("SPRING");
    }
    if (overlapsRange(start, end, summerStart, summerEnd)) {
      seasons.add("SUMMER");
    }
    if (overlapsRange(start, end, fallStart, fallEnd)) {
      seasons.add("FALL");
    }
  }

  return normalizeSeasons(Array.from(seasons));
}

function deriveSeasons(listing: ListingRow): Season[] {
  const start = toUtcDateOnly(listing.start_date);
  const end = toUtcDateOnly(listing.end_date);

  const manual = getManualOverride(start, end);
  if (manual) {
    return normalizeSeasons(manual);
  }

  const titleSeasons = parseTitleSeasons(listing.title ?? "");
  if (titleSeasons.length > 0) {
    return normalizeSeasons(titleSeasons);
  }

  return deriveSeasonsFromDates(start, end);
}

function hasSameSeasons(current: Season[], next: Season[]): boolean {
  if (current.length !== next.length) return false;
  const currentSet = new Set(current);
  return next.every((season) => currentSet.has(season));
}

async function main() {
  const shouldApply = process.argv.includes("--apply");
  const includeNonEmpty = process.argv.includes("--include-nonempty");

  const where: Prisma.ListingWhereInput = includeNonEmpty ? {} : { seasons: { isEmpty: true } };

  const listings = (await prisma.listing.findMany({
    where,
    select: {
      id: true,
      title: true,
      start_date: true,
      end_date: true,
      seasons: true,
    },
    orderBy: { created_at: "asc" },
  })) as ListingRow[];

  const updates = listings
    .map((listing) => {
      const computedSeasons = deriveSeasons(listing);
      return {
        ...listing,
        computedSeasons,
        changed: !hasSameSeasons(listing.seasons, computedSeasons),
      };
    })
    .filter((row) => row.changed);

  const preview = updates.slice(0, 20);
  console.log(
    `Mode=${shouldApply ? "APPLY" : "DRY_RUN"} include_nonempty=${includeNonEmpty} scanned=${listings.length} changed=${updates.length}`
  );
  for (const row of preview) {
    const oldSeasons = row.seasons.length > 0 ? row.seasons.join(",") : "<empty>";
    const newSeasons = row.computedSeasons.length > 0 ? row.computedSeasons.join(",") : "<empty>";
    console.log(`${row.id} "${row.title}" ${oldSeasons} -> ${newSeasons}`);
  }
  if (updates.length > preview.length) {
    console.log(`...and ${updates.length - preview.length} more`);
  }

  if (!shouldApply) {
    console.log("Dry run complete. Re-run with --apply to persist updates.");
    return;
  }

  let updatedCount = 0;
  for (const row of updates) {
    await prisma.listing.update({
      where: { id: row.id },
      data: { seasons: row.computedSeasons },
    });
    updatedCount += 1;
  }

  console.log(`Applied updates: ${updatedCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
