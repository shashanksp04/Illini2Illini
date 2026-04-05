/**
 * Legacy entrypoint — same logic as `npm run reddit-import`.
 * Usage: npx tsx scripts/import-reddit-listings.ts [path-to.json] [--update-fields]
 * Default: docs/reddit-related/reddit_listings.json
 */

import { readFileSync } from "fs";
import path from "path";

import type { RedditJsonRow } from "@/lib/reddit-import/import-rows";
import { importRedditListingRows } from "@/lib/reddit-import/import-rows";
import { prisma } from "@/lib/prisma";

async function main() {
  const defaultPath = path.join(process.cwd(), "docs/reddit-related/reddit_listings.json");
  const updateFields = process.argv.includes("--update-fields");
  const positional = process.argv.slice(2).filter((a) => a !== "--update-fields");
  const file = positional[0] ?? defaultPath;
  const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Expected JSON array");
  }

  const summary = await importRedditListingRows(raw as RedditJsonRow[], file, {
    dedupeInFile: true,
    updateExisting: updateFields,
  });

  for (const r of summary.results) {
    const extra = r.detail ? ` ${r.detail}` : "";
    console.log(`${r.outcome.padEnd(32, " ")} external_id=${r.external_id}${extra}`);
  }
  console.log("---");
  console.log(
    `Summary: inserted=${summary.inserted} updated=${summary.updated} skipped_already_in_database=${summary.skipped_already_in_database} skipped_duplicate_in_file=${summary.skipped_duplicate_in_file} errors=${summary.errors} rows_with_exclude_true=${summary.rows_with_exclude_true} duration_ms=${summary.duration_ms}`
  );
  console.log(`Input: ${summary.input_path}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
