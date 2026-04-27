import type { ExternalListingSource, GenderPreference, LeaseType, RoomType, Season } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { normalizeSeasonInput } from "@/lib/listings/seasons";

/** JSON row shape (docs/reddit-related/reddit_listings.json). */
export type RedditJsonRow = {
  external_id: string;
  source: string;
  title: string;
  description: string;
  monthly_rent: number | null;
  lease_type: LeaseType | null;
  start_date: string | null;
  end_date: string | null;
  room_type: RoomType | null;
  furnished: boolean | null;
  utilities_included: boolean | null;
  open_to_negotiation: boolean | null;
  gender_preference: GenderPreference | null;
  nearby_landmark: string | null;
  total_bedrooms: number | null;
  total_bathrooms: number | null;
  exact_address: string | null;
  external_url: string;
  created_at: string;
  raw_text: string | null;
  exclude: boolean;
  images?: string[];
  seasons?: Season[];
};

export type ImportRecordOutcome =
  | "inserted"
  | "updated"
  | "skipped_already_in_database"
  | "skipped_duplicate_in_file"
  | "error";

export type ImportRecordResult = {
  external_id: string;
  outcome: ImportRecordOutcome;
  detail?: string;
};

export type ImportRunSummary = {
  input_path: string;
  total_rows_in_file: number;
  inserted: number;
  /** Existing rows refreshed from JSON when `updateExisting` is true. */
  updated: number;
  /** `external_id` already in DB; row not modified. */
  skipped_already_in_database: number;
  skipped_duplicate_in_file: number;
  errors: number;
  /** New inserts where exclude=true. */
  rows_with_exclude_true: number;
  duration_ms: number;
  results: ImportRecordResult[];
};

function parseDateOnly(value: string | null): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function parseSource(value: string): ExternalListingSource {
  if (value === "REDDIT") return "REDDIT";
  throw new Error(`Unknown source: ${value}`);
}

export function redditJsonRowToPrismaData(row: RedditJsonRow) {
  const parsedSeasons = normalizeSeasonInput(row.seasons);
  return {
    external_id: row.external_id,
    source: parseSource(row.source),
    title: row.title,
    description: row.description,
    monthly_rent: row.monthly_rent,
    lease_type: row.lease_type,
    start_date: parseDateOnly(row.start_date),
    end_date: parseDateOnly(row.end_date),
    room_type: row.room_type,
    furnished: row.furnished,
    utilities_included: row.utilities_included,
    open_to_negotiation: row.open_to_negotiation,
    gender_preference: row.gender_preference,
    nearby_landmark: row.nearby_landmark,
    total_bedrooms: row.total_bedrooms,
    total_bathrooms: row.total_bathrooms,
    exact_address: row.exact_address,
    external_url: row.external_url,
    source_created_at: new Date(row.created_at),
    raw_text: row.raw_text,
    image_urls: Array.isArray(row.images) ? row.images.filter((u) => typeof u === "string" && u.length > 0) : [],
    seasons: parsedSeasons,
    exclude: row.exclude,
  };
}

/**
 * Inserts new Reddit listings. If `external_id` already exists, the row is skipped unless
 * `updateExisting` is true, in which case the row is updated from JSON (same mapping as insert).
 * First occurrence of each `external_id` in the file wins; later duplicates: skipped_duplicate_in_file.
 */
export async function importRedditListingRows(
  rows: RedditJsonRow[],
  inputPath: string,
  options: { dedupeInFile?: boolean; updateExisting?: boolean } = {}
): Promise<ImportRunSummary> {
  const start = Date.now();
  const dedupeInFile = options.dedupeInFile !== false;
  const updateExisting = options.updateExisting === true;
  const seen = new Set<string>();
  const results: ImportRecordResult[] = [];

  let inserted = 0;
  let updated = 0;
  let skipped_already_in_database = 0;
  let skipped_duplicate_in_file = 0;
  let errors = 0;
  let rows_with_exclude_true = 0;

  for (const row of rows) {
    const rawId = row.external_id != null ? String(row.external_id).trim() : "";
    if (!rawId) {
      errors += 1;
      results.push({
        external_id: "(missing)",
        outcome: "error",
        detail: "missing external_id",
      });
      continue;
    }

    if (dedupeInFile && seen.has(rawId)) {
      skipped_duplicate_in_file += 1;
      results.push({
        external_id: rawId,
        outcome: "skipped_duplicate_in_file",
        detail: "later duplicate in same file (first occurrence kept)",
      });
      continue;
    }
    if (dedupeInFile) seen.add(rawId);

    const rowNorm: RedditJsonRow = { ...row, external_id: rawId };

    try {
      const data = redditJsonRowToPrismaData(rowNorm);
      const existing = await prisma.redditListing.findUnique({
        where: { external_id: rawId },
        select: { id: true },
      });

      if (existing) {
        if (updateExisting) {
          const { external_id: _omit, ...updateData } = data;
          await prisma.redditListing.update({
            where: { external_id: rawId },
            data: updateData,
          });
          updated += 1;
          results.push({
            external_id: rawId,
            outcome: "updated",
            detail: rowNorm.exclude ? "exclude=true" : undefined,
          });
        } else {
          skipped_already_in_database += 1;
          results.push({
            external_id: rawId,
            outcome: "skipped_already_in_database",
            detail: "already in database (not updated)",
          });
        }
      } else {
        await prisma.redditListing.create({ data });
        inserted += 1;
        if (rowNorm.exclude) rows_with_exclude_true += 1;
        results.push({
          external_id: rawId,
          outcome: "inserted",
          detail: rowNorm.exclude ? "exclude=true" : undefined,
        });
      }
    } catch (e) {
      errors += 1;
      results.push({
        external_id: rawId,
        outcome: "error",
        detail: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const duration_ms = Date.now() - start;

  return {
    input_path: inputPath,
    total_rows_in_file: rows.length,
    inserted,
    updated,
    skipped_already_in_database,
    skipped_duplicate_in_file,
    errors,
    rows_with_exclude_true,
    duration_ms,
    results,
  };
}
