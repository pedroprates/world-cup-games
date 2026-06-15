import fs from "fs/promises";
import path from "path";
import { TEAMS } from "../lib/teams";
import { BROADCASTERS_MAP } from "../lib/broadcasters";
import type { Fixture } from "../lib/types";

export async function validateFixtures(fixtures: Fixture[]): Promise<void> {
  // Unique ids
  const ids = fixtures.map(f => f.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) throw new Error(`Duplicate fixture ids: ${dupes.join(", ")}`);

  // Team codes resolve
  for (const f of fixtures) {
    if (!TEAMS[f.home]) throw new Error(`Unknown home team "${f.home}" in fixture ${f.id}`);
    if (!TEAMS[f.away]) throw new Error(`Unknown away team "${f.away}" in fixture ${f.id}`);
  }

  // Broadcaster ids resolve (skip empty arrays — those are allowed)
  for (const f of fixtures) {
    for (const id of f.broadcasterIds) {
      if (!BROADCASTERS_MAP[id])
        throw new Error(`Unknown broadcaster id "${id}" in fixture ${f.id}`);
    }
  }

  // Valid ISO dates
  for (const f of fixtures) {
    const d = new Date(f.kickoff);
    if (isNaN(d.getTime()))
      throw new Error(`Invalid kickoff date "${f.kickoff}" in fixture ${f.id}`);
  }
}

// CLI usage: tsx scripts/validate-fixtures.ts
const FIXTURES_PATH = path.join(process.cwd(), "data", "fixtures.json");
fs.readFile(FIXTURES_PATH, "utf-8")
  .then(raw => validateFixtures(JSON.parse(raw)))
  .then(() => { console.log("✓ All fixtures valid"); })
  .catch(e => { console.error("✗ Validation failed:", e.message); process.exit(1); });
