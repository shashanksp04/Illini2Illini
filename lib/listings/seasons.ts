import type { Season } from "@prisma/client";

export const SEASON_OPTIONS: readonly Season[] = ["SPRING", "SUMMER", "FALL", "FULL_YEAR"] as const;

export const SEASON_LABELS: Record<Season, string> = {
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
  FULL_YEAR: "Full Year",
};

export function isSeason(value: unknown): value is Season {
  return typeof value === "string" && (SEASON_OPTIONS as readonly string[]).includes(value);
}

export function normalizeSeasons(seasons: Season[]): Season[] {
  const seasonSet = new Set(seasons);
  if (seasonSet.has("SPRING") && seasonSet.has("SUMMER") && seasonSet.has("FALL")) {
    return ["FULL_YEAR"];
  }
  return Array.from(seasonSet);
}

export function normalizeSeasonInput(value: unknown): Season[] {
  if (!Array.isArray(value)) return [];
  const deduped = new Set<Season>();
  for (const entry of value) {
    if (isSeason(entry)) {
      deduped.add(entry);
    }
  }
  return normalizeSeasons(Array.from(deduped));
}

export function parseSeasonArrayInput(value: unknown): { seasons: Season[]; valid: boolean } {
  if (value == null) {
    return { seasons: [], valid: true };
  }
  if (!Array.isArray(value)) {
    return { seasons: [], valid: false };
  }
  const allValid = value.every((entry) => isSeason(entry));
  if (!allValid) {
    return { seasons: [], valid: false };
  }
  return { seasons: normalizeSeasonInput(value), valid: true };
}

export function parseTitleSeasons(title: string): Season[] {
  const normalizedTitle = title.toLowerCase();
  const seasons: Season[] = [];

  if (/\bspring\b/.test(normalizedTitle)) seasons.push("SPRING");
  if (/\bsummer\b/.test(normalizedTitle)) seasons.push("SUMMER");
  if (/\bfall\b/.test(normalizedTitle)) seasons.push("FALL");
  if (/\bfull[\s-_]?year\b/.test(normalizedTitle)) seasons.push("FULL_YEAR");

  return normalizeSeasons(seasons);
}

export function classifyRedditTitleSeasons(title: string): Season[] {
  const normalizedTitle = title.toLowerCase();
  const hasFullWord = /\bfull\b/.test(normalizedTitle);
  const hasEntireYear = /\bentire\s+year\b/.test(normalizedTitle);
  const hasFallSpringPattern =
    /\bfall\b[\s'0-9-_/]*\bspring\b/.test(normalizedTitle) ||
    /\bspring\b[\s'0-9-_/]*\bfall\b/.test(normalizedTitle);

  if (hasFullWord || hasEntireYear || hasFallSpringPattern) {
    return ["FULL_YEAR"];
  }

  const seasons: Season[] = [];
  if (/\bspring\b/.test(normalizedTitle)) seasons.push("SPRING");
  if (/\bsummer\b/.test(normalizedTitle)) seasons.push("SUMMER");
  if (/\bfall\b/.test(normalizedTitle)) seasons.push("FALL");

  return normalizeSeasons(seasons);
}
