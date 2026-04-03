/**
 * Daily Reddit JSON import CLI.
 * Usage: npx tsx tools/reddit-import/src/import.ts [--file path] [--log-dir path] [--no-log-file]
 */

import { readFileSync } from "fs";
import path from "path";

import type { RedditJsonRow } from "@/lib/reddit-import/import-rows";
import { importRedditListingRows } from "@/lib/reddit-import/import-rows";
import { prisma } from "@/lib/prisma";

import { RunLogger } from "./logger";

function parseArgs(argv: string[]) {
  let file: string | null = null;
  let logDir: string | null = null;
  let noLogFile = false;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file" && argv[i + 1]) {
      file = argv[++i];
    } else if (a === "--log-dir" && argv[i + 1]) {
      logDir = argv[++i];
    } else if (a === "--no-log-file") {
      noLogFile = true;
    }
  }

  const defaultJson = path.join(process.cwd(), "tools", "reddit-import", "json", "latest.json");
  const resolvedFile = file ?? defaultJson;
  const resolvedLogDir = noLogFile ? null : logDir ?? path.join(process.cwd(), "tools", "reddit-import", "logs");

  return { file: resolvedFile, logDir: resolvedLogDir };
}

async function main() {
  const { file, logDir } = parseArgs(process.argv);
  const logger = new RunLogger(logDir);

  logger.info(`Reading ${file}`);
  const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;
  if (!Array.isArray(raw)) {
    throw new Error("Expected JSON array of listing objects");
  }

  const rows = raw as RedditJsonRow[];
  logger.info(`Parsed ${rows.length} row(s)`);

  const summary = await importRedditListingRows(rows, file, { dedupeInFile: true });

  for (const r of summary.results) {
    const extra = r.detail ? ` ${r.detail}` : "";
    logger.info(`${r.outcome.padEnd(32, " ")} external_id=${r.external_id}${extra}`);
  }

  logger.info("---");
  logger.info(
    `Summary: inserted=${summary.inserted} skipped_already_in_database=${summary.skipped_already_in_database} skipped_duplicate_in_file=${summary.skipped_duplicate_in_file} errors=${summary.errors} rows_with_exclude_true=${summary.rows_with_exclude_true} duration_ms=${summary.duration_ms}`
  );
  logger.info(`Input: ${summary.input_path}`);
  const logPath = logger.getLogFilePath();
  if (logPath) {
    logger.info(`Log file: ${logPath}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
