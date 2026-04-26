import { NextResponse } from "next/server";

import { AuthError, requireNotBanned, requireProfileComplete, requireVerified } from "@/lib/auth/helpers";
import {
  createListing,
  type CreateListingPayload,
  getPublicListings,
  getVerifiedListings,
  ListingError,
  type ListingFilters,
  type ListingOwner,
  type VerifiedViewer,
} from "@/lib/listings/helpers";
import { normalizeSeasonInput, parseSeasonArrayInput } from "@/lib/listings/seasons";
import { prisma } from "@/lib/prisma";

function parseBoolean(value: string | null): boolean | undefined | "invalid" {
  if (value == null) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return "invalid";
}

function parseNumber(value: string | null): number | undefined | "invalid" {
  if (value == null) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n)) return "invalid";
  return n;
}

function parseDate(value: string | null): Date | undefined | "invalid" {
  if (value == null) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "invalid";
  return d;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    const minRent = parseNumber(params.get("min_rent"));
    const maxRent = parseNumber(params.get("max_rent"));
    const startDate = parseDate(params.get("start_date"));
    const endDate = parseDate(params.get("end_date"));
    const furnished = parseBoolean(params.get("furnished"));
    const utilitiesIncluded = parseBoolean(params.get("utilities_included"));
    const totalBedrooms = parseNumber(params.get("total_bedrooms"));
    const totalBathrooms = parseNumber(params.get("total_bathrooms"));
    const pageNum = parseNumber(params.get("page"));
    const pageSizeNum = parseNumber(params.get("page_size"));
    const sort = params.get("sort") ?? undefined;
    const seasonValues = params
      .getAll("season")
      .flatMap((value) => value.split(","))
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const parsedSeasons = normalizeSeasonInput(seasonValues);

    if (
      minRent === "invalid" ||
      maxRent === "invalid" ||
      startDate === "invalid" ||
      endDate === "invalid" ||
      furnished === "invalid" ||
      utilitiesIncluded === "invalid" ||
      totalBedrooms === "invalid" ||
      totalBathrooms === "invalid" ||
      pageNum === "invalid" ||
      pageSizeNum === "invalid" ||
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

    if (sort && sort !== "newest" && sort !== "price_asc") {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "VALIDATION_ERROR", message: "Invalid sort value." },
        },
        { status: 400 }
      );
    }

    const basePage = typeof pageNum === "number" && pageNum > 0 ? pageNum : 1;
    const basePageSize =
      typeof pageSizeNum === "number" && pageSizeNum > 0 ? Math.min(pageSizeNum, 100) : 20;
    const effectivePageSize = basePageSize + 1;

    const includeTakenParam = params.get("include_taken");
    const includeTaken = includeTakenParam === "true";

    let isVerified = false;
    let viewer: VerifiedViewer | null = null;
    try {
      const { authUserId } = await requireVerified();
      const domainUser = await prisma.user.findUnique({
        where: { auth_user_id: authUserId },
        select: { id: true, role: true, is_banned: true },
      });
      if (domainUser) {
        viewer = {
          id: domainUser.id,
          role: domainUser.role,
          is_banned: domainUser.is_banned,
        };
      }
      isVerified = true;
    } catch (err) {
      if (!(err instanceof AuthError)) {
        return NextResponse.json(
          {
            ok: false,
            error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
          },
          { status: 500 }
        );
      }
      isVerified = false;
    }

    const filters: ListingFilters = {
      min_rent: minRent as number | undefined,
      max_rent: maxRent as number | undefined,
      start_date: startDate as Date | undefined,
      end_date: endDate as Date | undefined,
      room_type: (params.get("room_type") ?? undefined) as any,
      furnished: furnished as boolean | undefined,
      utilities_included: utilitiesIncluded as boolean | undefined,
      lease_type: (params.get("lease_type") ?? undefined) as any,
      total_bedrooms: totalBedrooms as number | undefined,
      total_bathrooms: totalBathrooms as number | undefined,
      keyword: params.get("keyword") ?? undefined,
      seasons: parsedSeasons.length > 0 ? parsedSeasons : undefined,
      sort: sort as any,
      page: basePage,
      page_size: effectivePageSize,
      include_taken: isVerified && viewer?.role === "ADMIN" && includeTaken ? true : undefined,
    };

    const listings = isVerified && viewer
      ? await getVerifiedListings(filters, viewer)
      : await getPublicListings(filters);

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

export async function POST(request: Request) {
  try {
    const { authUserId } = await requireVerified();
    await requireNotBanned(authUserId);
    const domainUser = await requireProfileComplete(authUserId);

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid JSON body." } },
        { status: 400 }
      );
    }

    const seasonParse = parseSeasonArrayInput(body.seasons);
    if (!seasonParse.valid) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid season values." } },
        { status: 400 }
      );
    }

    const payload: CreateListingPayload = {
      title: String(body.title ?? ""),
      monthly_rent: Number(body.monthly_rent),
      lease_type: body.lease_type,
      start_date: new Date(body.start_date),
      end_date: new Date(body.end_date),
      exact_address: String(body.exact_address ?? ""),
      nearby_landmark: String(body.nearby_landmark ?? ""),
      total_bedrooms: Number(body.total_bedrooms),
      total_bathrooms: Number(body.total_bathrooms),
      room_type: body.room_type,
      furnished: Boolean(body.furnished),
      utilities_included: Boolean(body.utilities_included),
      open_to_negotiation: Boolean(body.open_to_negotiation),
      gender_preference: body.gender_preference,
      description: String(body.description ?? ""),
      seasons: seasonParse.seasons,
    };

    if (
      Number.isNaN(payload.monthly_rent) ||
      Number.isNaN(payload.total_bedrooms) ||
      Number.isNaN(payload.total_bathrooms) ||
      Number.isNaN(payload.start_date.getTime()) ||
      Number.isNaN(payload.end_date.getTime())
    ) {
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: "Invalid numeric or date fields." } },
        { status: 400 }
      );
    }

    const listingOwner: ListingOwner = { id: domainUser.id };
    const listing = await createListing(listingOwner, payload);

    return NextResponse.json(
      { ok: true, data: { listing_id: listing.id } },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    if (err instanceof ListingError) {
      return NextResponse.json(
        { ok: false, error: { code: err.code, message: err.message } },
        { status: err.status }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        error: { code: "SERVER_ERROR", message: "Something went wrong. Please try again." },
      },
      { status: 500 }
    );
  }
}

