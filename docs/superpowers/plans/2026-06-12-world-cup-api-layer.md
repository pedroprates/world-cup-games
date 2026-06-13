# World Cup Backend — Plan 2: API Layer + Sync Infrastructure

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all 4 Next.js Route Handlers, the shared enrichment helper, the one-time seed script that creates `data/fixtures.json`, and the daily sync script for knockout-stage fixtures.

**Architecture:** Route Handlers live in `app/api/`. Games endpoints use `revalidate = 3600` (ISR — file changes reflected within 1 hour without rebuild). Teams and broadcasters are `force-static` (never change at runtime). All games routes read from `data/fixtures.json` via `fs.readFile`. The seed script (E1) must run before the games routes can be tested — it creates the JSON file from `lib/fixtures.ts`.

**Prerequisites:** Plan 1 complete. `npx tsc --noEmit` passes. `lib/fixtures.ts` has 72 entries.

**Tech Stack:** Next.js 16 Route Handlers, Node.js `fs/promises`, `tsx` (dev dependency for scripts), `football-data.org` free API for sync.

**Plan sequence:** This is Plan 2 of 3. Plan 3 (Client Integration) depends on the API endpoints working.

---

### Task 1: Create `lib/api/enrich.ts` (spec C1)

**Files:**
- Create: `lib/api/enrich.ts`

Pure server-only helpers. `enrichGame` joins a `Fixture` with its full team objects and broadcaster records. `filterGames` applies the three optional query-param filters before enrichment.

- [ ] **Step 1: Write `lib/api/enrich.ts`**

```ts
import { TEAMS } from "../teams";
import { BROADCASTERS_MAP } from "../broadcasters";
import { dayKey } from "../format";
import type { Fixture, TeamCode } from "../types";
import type { ApiGame } from "../api-types";

export function enrichGame(fixture: Fixture): ApiGame {
  return {
    id: fixture.id,
    home: TEAMS[fixture.home],
    away: TEAMS[fixture.away],
    kickoff: fixture.kickoff,
    city: fixture.city,
    venue: fixture.venue,
    group: fixture.group,
    broadcasters: fixture.broadcasterIds
      .map(id => BROADCASTERS_MAP[id])
      .filter(Boolean),
  };
}

export function filterGames(
  fixtures: Fixture[],
  params: { group?: string | null; date?: string | null; team?: string | null }
): Fixture[] {
  let result = fixtures;
  if (params.group) {
    result = result.filter(f => f.group === params.group);
  }
  if (params.date) {
    const target = params.date;
    result = result.filter(f => dayKey(new Date(f.kickoff)) === target);
  }
  if (params.team) {
    const t = params.team as TeamCode;
    result = result.filter(f => f.home === t || f.away === t);
  }
  return result;
}
```

> `dayKey` uses `Intl.DateTimeFormat` with `America/Sao_Paulo` timezone. It is safe to call server-side — Node.js ships full ICU data in Next.js deployments.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

### Task 2: Create static route handlers — teams and broadcasters (spec C4, C5)

These two routes have no runtime data dependency (no `data/fixtures.json`), so build and test them first.

**Files:**
- Create: `app/api/teams/route.ts`
- Create: `app/api/broadcasters/route.ts`

- [ ] **Step 1: Write `app/api/teams/route.ts`**

```ts
import { TEAMS } from "@/lib/teams";
import type { ApiTeamsResponse } from "@/lib/api-types";

export const dynamic = "force-static";

export function GET(): Response {
  const teams = Object.values(TEAMS).sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  );
  return Response.json({ teams } satisfies ApiTeamsResponse);
}
```

- [ ] **Step 2: Write `app/api/broadcasters/route.ts`**

```ts
import { BROADCASTERS } from "@/lib/broadcasters";
import type { ApiBroadcastersResponse } from "@/lib/api-types";

export const dynamic = "force-static";

export function GET(): Response {
  return Response.json({ broadcasters: BROADCASTERS } satisfies ApiBroadcastersResponse);
}
```

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Smoke test (start dev server first)**

Open a second terminal and run `npm run dev`. Then in the original terminal:

```bash
curl -s http://localhost:3000/api/teams | node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log('Teams:', d.teams?.length ?? 'ERROR', d.error ?? '');
"
curl -s http://localhost:3000/api/broadcasters | node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log('Broadcasters:', d.broadcasters?.length ?? 'ERROR', d.error ?? '');
"
```

Expected: `Teams: 48` and `Broadcasters: 5`.

---

### Task 3: Seed `data/fixtures.json` (spec E1)

The games Route Handlers read from `data/fixtures.json`. This script creates the initial file from the static `lib/fixtures.ts` data. The output file is committed to the repo so it's present in all environments (including CI).

**Files:**
- Create: `scripts/seed-fixtures.ts`
- Create (generated): `data/fixtures.json`
- Modify: `package.json`

- [ ] **Step 1: Add `tsx` as dev dependency**

```bash
npm install -D tsx
```

- [ ] **Step 2: Write `scripts/seed-fixtures.ts`**

```ts
import fs from "fs/promises";
import path from "path";
import { FIXTURES } from "../lib/fixtures";

const OUTPUT = path.join(process.cwd(), "data", "fixtures.json");

async function seed() {
  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, JSON.stringify(FIXTURES, null, 2));
  console.log(`Seeded ${FIXTURES.length} fixtures → ${OUTPUT}`);
}

seed().catch(e => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Add `seed` script to `package.json`**

In the `"scripts"` object, add after `"start"`:

```json
"seed": "tsx scripts/seed-fixtures.ts"
```

- [ ] **Step 4: Run the seed script**

```bash
npm run seed
```

Expected: `Seeded 72 fixtures → .../data/fixtures.json`

- [ ] **Step 5: Verify the output file**

```bash
node -e "const f = require('./data/fixtures.json'); console.log('Fixtures in JSON:', f.length)"
```

Expected: `Fixtures in JSON: 72`

- [ ] **Step 6: Commit seed script and generated JSON**

```bash
git add scripts/seed-fixtures.ts data/fixtures.json package.json package-lock.json
git commit -m "feat(scripts): add seed script; commit initial data/fixtures.json"
```

---

### Task 4: Create `app/api/games/route.ts` (spec C2)

**Files:**
- Create: `app/api/games/route.ts`

Reads from `data/fixtures.json`, applies optional filters, returns enriched games. Query params: `?group` (string), `?date` (YYYY-MM-DD in BRT), `?team` (TeamCode). Invalid params return 400.

- [ ] **Step 1: Write `app/api/games/route.ts`**

```ts
import fs from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { TEAMS } from "@/lib/teams";
import { enrichGame, filterGames } from "@/lib/api/enrich";
import type { Fixture } from "@/lib/types";
import type { ApiGamesResponse } from "@/lib/api-types";

export const revalidate = 3600;

const FIXTURES_PATH = path.join(process.cwd(), "data", "fixtures.json");

export async function GET(request: NextRequest): Promise<Response> {
  const sp = request.nextUrl.searchParams;
  const group = sp.get("group");
  const date = sp.get("date");
  const team = sp.get("team");

  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Invalid date format. Use YYYY-MM-DD" }, { status: 400 });
  }
  if (team && !Object.prototype.hasOwnProperty.call(TEAMS, team)) {
    return Response.json({ error: "Invalid team code" }, { status: 400 });
  }

  const raw = await fs.readFile(FIXTURES_PATH, "utf-8");
  const fixtures: Fixture[] = JSON.parse(raw);
  const filtered = filterGames(fixtures, { group, date, team });

  return Response.json({ games: filtered.map(enrichGame) } satisfies ApiGamesResponse);
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Smoke test**

```bash
# All games
curl -s "http://localhost:3000/api/games" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Total games:', d.games?.length)"
# Filter by group
curl -s "http://localhost:3000/api/games?group=Grupo+G" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Grupo G:', d.games?.length, '(expected 6)')"
# Filter by team
curl -s "http://localhost:3000/api/games?team=BRA" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('BRA games:', d.games?.length, '(expected 3)')"
# Filter by date (Brasília day-key)
curl -s "http://localhost:3000/api/games?date=2026-06-12" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Jun 12 games:', d.games?.length, '(expected 1)')"
# 400 on bad date
curl -s "http://localhost:3000/api/games?date=12-06-2026" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Bad date error:', d.error)"
# 400 on bad team
curl -s "http://localhost:3000/api/games?team=ZZZ" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Bad team error:', d.error)"
```

Expected:
- `Total games: 72`
- `Grupo G: 6 (expected 6)` — group name must match exactly including accent, e.g. `Grupo+G`
- `BRA games: 3 (expected 3)`
- `Jun 12 games: 1 (expected 1)`
- `Bad date error: "Invalid date format. Use YYYY-MM-DD"`
- `Bad team error: "Invalid team code"`

---

### Task 5: Create `app/api/games/[id]/route.ts` (spec C3)

**Files:**
- Create: `app/api/games/[id]/route.ts`

Returns a single game by id or 404. Must `await ctx.params` — this is a breaking change in Next.js 15+ that causes runtime errors if skipped.

- [ ] **Step 1: Create the dynamic segment directory**

```bash
mkdir -p "app/api/games/[id]"
```

- [ ] **Step 2: Write `app/api/games/[id]/route.ts`**

```ts
import fs from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";
import { enrichGame } from "@/lib/api/enrich";
import type { Fixture } from "@/lib/types";
import type { ApiGameResponse } from "@/lib/api-types";

export const revalidate = 3600;

const FIXTURES_PATH = path.join(process.cwd(), "data", "fixtures.json");

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await ctx.params;

  const raw = await fs.readFile(FIXTURES_PATH, "utf-8");
  const fixtures: Fixture[] = JSON.parse(raw);
  const fixture = fixtures.find(f => f.id === id);

  if (!fixture) {
    return Response.json({ error: "Game not found" }, { status: 404 });
  }

  return Response.json({ game: enrichGame(fixture) } satisfies ApiGameResponse);
}
```

- [ ] **Step 3: Smoke test**

```bash
curl -s "http://localhost:3000/api/games/BRA-CRO-2026-06-12" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('Game id:', d.game?.id, '| BRA:', d.game?.home?.name)"
curl -s "http://localhost:3000/api/games/does-not-exist" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('404 error:', d.error)"
```

Expected:
- `Game id: BRA-CRO-2026-06-12 | BRA: Brasil`
- `404 error: Game not found`

- [ ] **Step 4: Commit all API routes**

```bash
git add app/api/ lib/api/
git commit -m "feat(api): add 4 route handlers (games, games/[id], teams, broadcasters)"
```

---

### Task 6: Create fixture sync script (spec E2, E3, E4)

The sync script fetches upcoming fixtures from `football-data.org` and merges only new ones into `data/fixtures.json`. It never overwrites existing records — this preserves manually-curated `broadcasterIds`.

**Files:**
- Create: `scripts/sync-fixtures.ts`
- Create: `.env.local.example`
- Modify: `package.json`

**API key:** Register at https://www.football-data.org/client/register (free tier, 10 req/min). Set the key in `.env.local` (never commit the real key).

- [ ] **Step 1: Create `.env.local.example`**

```bash
# Get a free API key at https://www.football-data.org/client/register
FOOTBALL_DATA_API_KEY=your_api_key_here
```

- [ ] **Step 2: Write `scripts/sync-fixtures.ts`**

```ts
import fs from "fs/promises";
import path from "path";
import type { Fixture, TeamCode } from "../lib/types";

const FIXTURES_PATH = path.join(process.cwd(), "data", "fixtures.json");
const WC_CODE = "WC"; // football-data.org competition code for FIFA World Cup

// Maps football-data.org TLA codes to our TeamCode. Extend if sync returns unknown codes.
const TLA_MAP: Record<string, TeamCode> = {
  ENG: "ENG", BRA: "BRA", ARG: "ARG", FRA: "FRA", GER: "GER",
  ESP: "ESP", POR: "POR", NED: "NED", BEL: "BEL", ITA: "ITA",
  CRO: "CRO", MEX: "MEX", CAN: "CAN", USA: "USA", JPN: "JPN",
  KOR: "KOR", MAR: "MAR", SEN: "SEN", URU: "URU", COL: "COL",
  GHA: "GHA", CMR: "CMR", ECU: "ECU", NGA: "NGA", SUI: "SUI",
  AUT: "AUT", DEN: "DEN", SRB: "SRB", TUR: "TUR", ROU: "ROU",
  UKR: "UKR", VEN: "VEN", PAR: "PAR", PAN: "PAN", HON: "HON",
  JAM: "JAM", EGY: "EGY", CIV: "CIV", COD: "COD", RSA: "RSA",
  KSA: "KSA", IRN: "IRN", AUS: "AUS", IRQ: "IRQ", JOR: "JOR",
  QAT: "QAT", UZB: "UZB", NZL: "NZL",
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
  await fs.writeFile(FIXTURES_PATH, JSON.stringify(merged, null, 2));

  const empty = merged.filter(f => f.broadcasterIds.length === 0).length;
  console.log(`Already present: ${existing.length}`);
  console.log(`New fixtures added: ${added.length}`);
  if (skipped.length) console.log(`Skipped (unknown team code): ${skipped.join(", ")}`);
  console.log(`Fixtures needing broadcaster assignment: ${empty}`);
}

sync().catch(e => { console.error(e.message); process.exit(1); });
```

- [ ] **Step 3: Add `sync` script to `package.json`**

```json
"sync": "tsx scripts/sync-fixtures.ts"
```

- [ ] **Step 4: Commit sync infrastructure**

```bash
git add scripts/sync-fixtures.ts .env.local.example package.json
git commit -m "feat(sync): add knockout fixture sync script and env template"
```

---

### Plan 2 Completion Check

Before moving to Plan 3, verify:

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `GET /api/games` → 72 games (JSON array)
- [ ] `GET /api/games?group=Grupo+G` → 6 games
- [ ] `GET /api/games?team=BRA` → 3 games
- [ ] `GET /api/games?date=2026-06-12` → 1 game
- [ ] `GET /api/games?date=bad` → `{ "error": "Invalid date format..." }` HTTP 400
- [ ] `GET /api/games?team=ZZZ` → `{ "error": "Invalid team code" }` HTTP 400
- [ ] `GET /api/games/BRA-CRO-2026-06-12` → game object with `home.name: "Brasil"`
- [ ] `GET /api/games/nonexistent` → `{ "error": "Game not found" }` HTTP 404
- [ ] `GET /api/teams` → 48 teams sorted alphabetically
- [ ] `GET /api/broadcasters` → 5 broadcasters
- [ ] `data/fixtures.json` committed to repo
- [ ] `scripts/sync-fixtures.ts` and `.env.local.example` committed

**Deployment note:** `scripts/sync-fixtures.ts` writes to `data/fixtures.json` on the local filesystem. This works on a persistent server (VPS/container) but NOT on serverless platforms (Vercel, Netlify). On serverless, the sync script must instead commit to the repo and trigger a redeploy. Decide and document this before production deployment.

**Next:** Plan 3 — Client Integration + Validation
