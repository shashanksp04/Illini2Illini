import { Prisma, type Season } from "@prisma/client";

import { classifyRedditTitleSeasons } from "@/lib/listings/seasons";
import { prisma } from "@/lib/prisma";

type RedditRow = {
  id: string;
  title: string;
  seasons: Season[];
};

function hasSameSeasons(current: Season[], next: Season[]): boolean {
  if (current.length !== next.length) return false;
  const currentSet = new Set(current);
  return next.every((season) => currentSet.has(season));
}

async function main() {
  const shouldApply = process.argv.includes("--apply");
  const includeNonEmpty = process.argv.includes("--include-nonempty");

  const whereSql = includeNonEmpty
    ? Prisma.sql``
    : Prisma.sql`WHERE cardinality(seasons) = 0`;

  const rows = await prisma.$queryRaw<RedditRow[]>(Prisma.sql`
    SELECT id, title, seasons
    FROM reddit_listings
    ${whereSql}
    ORDER BY source_created_at DESC
  `);

  const updates = rows
    .map((row) => {
      const parsed = classifyRedditTitleSeasons(row.title ?? "");
      const computed = parsed.length > 0 ? parsed : row.seasons;
      return {
        ...row,
        computed,
        changed: !hasSameSeasons(row.seasons, computed),
      };
    })
    .filter((row) => row.changed);

  const preview = updates.slice(0, 30);
  console.log(
    `Mode=${shouldApply ? "APPLY" : "DRY_RUN"} include_nonempty=${includeNonEmpty} scanned=${rows.length} changed=${updates.length}`
  );
  for (const row of preview) {
    const oldSeasons = row.seasons.length > 0 ? row.seasons.join(",") : "<empty>";
    const newSeasons = row.computed.length > 0 ? row.computed.join(",") : "<empty>";
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
    const seasonsSql =
      row.computed.length > 0
        ? Prisma.sql`ARRAY[${Prisma.join(
            row.computed.map((season) => Prisma.sql`${season}::"Season"`)
          )}]::"Season"[]`
        : Prisma.sql`ARRAY[]::"Season"[]`;
    await prisma.$executeRaw(Prisma.sql`
      UPDATE reddit_listings
      SET seasons = ${seasonsSql}
      WHERE id = ${row.id}::uuid
    `);
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
