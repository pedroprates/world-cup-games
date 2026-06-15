import fs from "fs/promises";
import path from "path";
import type { Fixture, TeamCode } from "../lib/types";
import { validateFixtures } from "./validate-fixtures";

const FIXTURES_PATH = path.join(process.cwd(), "data", "fixtures.json");
const WC_CODE = "WC"; // football-data.org competition code for FIFA World Cup

// Maps football-data.org TLA codes to our TeamCode. Only WC 2026 qualifiers.
const TLA_MAP: Record<string, TeamCode> = {
  // Group A
  MEX: "MEX", RSA: "RSA", KOR: "KOR", CZE: "CZE",
  // Group B
  CAN: "CAN", BIH: "BIH", QAT: "QAT", SUI: "SUI",
  // Group C
  BRA: "BRA", MAR: "MAR", HAI: "HAI", SCO: "SCO",
  // Group D
  USA: "USA", PAR: "PAR", AUS: "AUS", TUR: "TUR",
  // Group E
  GER: "GER", CUW: "CUW", CIV: "CIV", ECU: "ECU",
  // Group F
  NED: "NED", JPN: "JPN", SWE: "SWE", TUN: "TUN",
  // Group G
  BEL: "BEL", EGY: "EGY", IRN: "IRN", NZL: "NZL",
  // Group H
  ESP: "ESP", CPV: "CPV", KSA: "KSA", URU: "URU",
  // Group I
  FRA: "FRA", SEN: "SEN", IRQ: "IRQ", NOR: "NOR",
  // Group J
  ARG: "ARG", ALG: "ALG", AUT: "AUT", JOR: "JOR",
  // Group K
  POR: "POR", COD: "COD", UZB: "UZB", COL: "COL",
  // Group L
  ENG: "ENG", CRO: "CRO", GHA: "GHA", PAN: "PAN",
};

interface FDOMatch {
  id: number;
  utcDate: string;
  stage: string;
  group?: string | null;
  venue?: string;
  homeTeam: { tla: string | null };
  awayTeam: { tla: string | null };
}

async function fetchMatches(): Promise<FDOMatch[]> {
  const key = process.env.FOOTBALL_DATA_API_KEY;
  if (!key) throw new Error("FOOTBALL_DATA_API_KEY not set. See .env.local.example");

  const res = await fetch(
    `https://api.football-data.org/v4/competitions/${WC_CODE}/matches`,
    { headers: { "X-Auth-Token": key } }
  );
  if (!res.ok) throw new Error(`football-data.org error: ${res.status} ${res.statusText}`);

  const body = await res.json();
  return body.matches as FDOMatch[];
}

async function sync() {
  const raw = await fs.readFile(FIXTURES_PATH, "utf-8");
  const existing: Fixture[] = JSON.parse(raw);
  const existingIds = new Set(existing.map(f => f.id));

  const matches = await fetchMatches();
  const added: Fixture[] = [];
  const skipped: string[] = [];

  for (const m of matches) {
    // Skip if either team is still TBD (knockout bracket not yet resolved)
    const homeTla = m.homeTeam.tla;
    const awayTla = m.awayTeam.tla;
    if (!homeTla || !awayTla) continue;

    const home = TLA_MAP[homeTla];
    const away = TLA_MAP[awayTla];
    if (!home || !away) {
      skipped.push(`${homeTla} vs ${awayTla}: no mapping in TLA_MAP`);
      continue;
    }

    const dateStr = m.utcDate.slice(0, 10);
    const id = `${home}-${away}-${dateStr}`;
    if (existingIds.has(id)) continue;

    added.push({
      id,
      home,
      away,
      kickoff: m.utcDate,
      city: "TBC",
      venue: m.venue ?? "TBC",
      group: m.group ?? m.stage,
      broadcasterIds: [], // requires manual assignment after sync
    });
  }

  const merged = [...existing, ...added];
  await validateFixtures(merged);   // exits with code 1 on failure
  await fs.writeFile(FIXTURES_PATH, JSON.stringify(merged, null, 2));

  const empty = merged.filter(f => f.broadcasterIds.length === 0).length;
  console.log(`Already present: ${existing.length}`);
  console.log(`New fixtures added: ${added.length}`);
  if (skipped.length) console.log(`Skipped (unknown team code): ${skipped.join(", ")}`);
  console.log(`Fixtures needing broadcaster assignment: ${empty}`);
}

sync().catch(e => { console.error(e.message); process.exit(1); });
