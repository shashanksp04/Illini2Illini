import { NextResponse } from "next/server";

import { getRedditListingsMinimal } from "@/lib/reddit-listings/helpers";
import { normalizeSeasonInput } from "@/lib/listings/seasons";

function parseNumber(value: string | null): number | undefined | "invalid" {
  if (value == null) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return "invalid";
  return n;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;
    const pageNum = parseNumber(params.get("page"));
    const pageSizeNum = parseNumber(params.get("page_size"));

    if (pageNum === "invalid" || pageSizeNum === "invalid") {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid query parameter value." },
        },
        { status: 400 }
      );
    }

    const basePage = typeof pageNum === "number" && pageNum > 0 ? pageNum : 1;
    const basePageSize =
      typeof pageSizeNum === "number" && pageSizeNum > 0 ? Math.min(pageSizeNum, 100) : 20;

    const minRent = parseNumber(params.get("min_rent"));
    const maxRent = parseNumber(params.get("max_rent"));
    const totalBedrooms = parseNumber(params.get("total_bedrooms"));
    const seasonValues = params
      .getAll("season")
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const parsedSeasons = normalizeSeasonInput(seasonValues);

    if (
      minRent === "invalid" ||
      maxRent === "invalid" ||
      totalBedrooms === "invalid" ||
      parsedSeasons.length !== seasonValues.length
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid query parameter value." },
        },
        { status: 400 }
      );
    }

    if (
      typeof minRent === "number" &&
      typeof maxRent === "number" &&
      minRent > maxRent
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Minimum rent cannot be greater than maximum rent.",
          },
        },
        { status: 400 }
      );
    }

    if (
      typeof totalBedrooms === "number" &&
      (!Number.isInteger(totalBedrooms) || totalBedrooms < 1 || totalBedrooms > 5)
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid total_bedrooms value." },
        },
        { status: 400 }
      );
    }

    const listings = await getRedditListingsMinimal({
      page: basePage,
      pageSize: basePageSize,
      ...(typeof minRent === "number" ? { min_rent: minRent } : {}),
      ...(typeof maxRent === "number" ? { max_rent: maxRent } : {}),
      ...(typeof totalBedrooms === "number" ? { total_bedrooms: totalBedrooms } : {}),
      ...(parsedSeasons.length > 0 ? { seasons: parsedSeasons } : {}),
    });

    const items = listings.slice(0, basePageSize);
    const has_more = listings.length > basePageSize;

    return NextResponse.json(
      { ok: true, data: { items, page: basePage, has_more } },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      },
      { status: 500 }
    );
  }
}
