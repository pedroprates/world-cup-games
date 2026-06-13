# World Cup Backend — Plan 1: Foundations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish all shared types, broadcaster data, 48-team roster, SVG logos, and the complete 72-game group-stage fixture list that every subsequent plan depends on.

**Architecture:** Data-first. All downstream plans (API, client wiring) depend on these foundations being correct. TypeScript strict mode means any type mismatch surfaces at `tsc --noEmit`. Task ordering: create `lib/broadcasters.ts` first (Task 1), then update `lib/types.ts` (Task 2, imports Broadcaster), then extend teams (Task 3) and fixtures (Task 5). Tasks 1–4 can all be done in parallel; Task 5 must follow Task 2.

**Tech Stack:** TypeScript 5 strict, `flagcdn.com` for flag SVGs, hand-crafted SVG placeholder logos for broadcasters.

**Plan sequence:** This is Plan 1 of 3. Plans 2 and 3 both require this plan to be complete and `npx tsc --noEmit` to pass before starting.

---

### Task 1: Create `lib/broadcasters.ts` (spec A3)

**Files:**
- Create: `lib/broadcasters.ts`

- [ ] **Step 1: Write `lib/broadcasters.ts`**

```ts
import type { Broadcaster } from "./types";

export const BROADCASTERS: Broadcaster[] = [
  { id: "globo",     name: "Globo",     logo: "/broadcasters/globo.svg"     },
  { id: "sportv",    name: "SporTV",    logo: "/broadcasters/sportv.svg"    },
  { id: "caze-tv",   name: "Cazé TV",   logo: "/broadcasters/caze-tv.svg"   },
  { id: "globoplay", name: "Globoplay", logo: "/broadcasters/globoplay.svg" },
  { id: "ge-tv",     name: "GE TV",     logo: "/broadcasters/ge-tv.svg"     },
];

export const BROADCASTERS_MAP: Record<string, Broadcaster> = Object.fromEntries(
  BROADCASTERS.map(b => [b.id, b])
);
```

> This file imports `Broadcaster` from `./types`. That interface is added in Task 2. TypeScript will flag it until then — continue to the next tasks; the final `tsc --noEmit` at the end of the plan confirms everything compiles together.

---

### Task 2: Create `lib/api-types.ts` + update `lib/types.ts` and `lib/games.ts` (spec A1 + A2)

**Files:**
- Create: `lib/api-types.ts`
- Modify: `lib/types.ts`
- Modify: `lib/games.ts`

- [ ] **Step 1: Create `lib/api-types.ts`**

```ts
import type { Broadcaster, Team } from "./types";

export interface ApiGame {
  id: string;
  home: Team;
  away: Team;
  kickoff: string;          // ISO string — Date is not JSON-serializable
  city: string;
  venue: string;
  group: string;
  broadcasters: Broadcaster[];
}

export interface ApiGamesResponse       { games: ApiGame[] }
export interface ApiGameResponse        { game: ApiGame }
export interface ApiTeamsResponse       { teams: Team[] }
export interface ApiBroadcastersResponse { broadcasters: Broadcaster[] }
```

- [ ] **Step 2: Add `Broadcaster` interface and update `Fixture` in `lib/types.ts`**

Add `Broadcaster` before `Fixture`, and replace `channels: string[]` with `broadcasterIds: string[]`:

```ts
export type TeamCode =
  | "BRA" | "CRO" | "ARG" | "MEX" | "CAN" | "FRA" | "GER" | "ENG"
  | "ESP" | "POR" | "NED" | "JPN" | "MAR" | "SEN" | "URU" | "COL"
  | "KOR" | "BEL" | "USA" | "GHA" | "CMR" | "ECU" | "NGA" | "ITA"
  // UEFA
  | "SUI" | "AUT" | "DEN" | "SRB" | "TUR" | "ROU" | "UKR"
  // CONMEBOL
  | "VEN" | "PAR"
  // CONCACAF
  | "PAN" | "HON" | "JAM"
  // CAF
  | "EGY" | "CIV" | "COD" | "RSA"
  // AFC
  | "KSA" | "IRN" | "AUS" | "IRQ" | "JOR" | "QAT" | "UZB"
  // OFC
  | "NZL";

export interface Team {
  code: TeamCode;
  name: string;
  shortName: string;
  flag: string;
}

export interface Broadcaster {
  id: string;   // "globo" | "sportv" | "caze-tv" | "globoplay" | "ge-tv"
  name: string; // display name
  logo: string; // path: "/broadcasters/globo.svg"
}

export interface Fixture {
  id: string;
  home: TeamCode;
  away: TeamCode;
  kickoff: string;        // ISO 8601 with offset, e.g. "2026-06-12T22:00:00-03:00"
  city: string;
  venue: string;
  group: string;
  broadcasterIds: string[];
}

export interface EnrichedGame {
  id: string;
  home: Team;
  away: Team;
  kickoff: Date;
  city: string;
  venue: string;
  group: string;
  channels: string[];      // resolved broadcaster names (kept for current components)
  channelsShort: string[]; // first 2 only
  timeLabel: string;
  dayLabel: string;
  isLive: boolean;
  isPreferred: boolean;
  showPrefBadge: boolean;
}

export interface DayGroup {
  key: string;
  label: string;
  games: EnrichedGame[];
}

export interface CountdownState {
  live: boolean;
  d: string;
  h: string;
  m: string;
  s: string;
  line: string;
  showDays: boolean;
}

export type HeroStyle = "classic" | "editorial" | "ticket";
```

> `EnrichedGame` keeps `channels: string[]` for now so existing components don't break. Plan 3 replaces them with `broadcasters: Broadcaster[]` when it updates all components.

- [ ] **Step 3: Update `lib/games.ts` to use `broadcasterIds`**

`Fixture.channels` is gone. Import `BROADCASTERS_MAP` and resolve names from `broadcasterIds`. Replace the full file:

```ts
import { FIXTURES } from "./fixtures";
import { TEAMS } from "./teams";
import { BROADCASTERS_MAP } from "./broadcasters";
import {
  dayKey,
  formatFullDayLabel,
  formatTime,
  isLiveNow,
} from "./format";
import type { DayGroup, EnrichedGame, TeamCode } from "./types";

interface BuildArgs {
  now: Date;
  preferred: TeamCode;
  filter: TeamCode | "";
}

interface BuildResult {
  next: EnrichedGame | null;
  today: EnrichedGame[];
  upcoming: DayGroup[];
}

const LIVE_WINDOW_MS = 105 * 60 * 1000;

export const buildSchedule = ({ now, preferred, filter }: BuildArgs): BuildResult => {
  const enriched: EnrichedGame[] = FIXTURES.map((f) => {
    const kickoff = new Date(f.kickoff);
    const home = TEAMS[f.home];
    const away = TEAMS[f.away];
    const isPreferred = f.home === preferred || f.away === preferred;
    const isLive = isLiveNow(kickoff, now);
    const channels = f.broadcasterIds.map(id => BROADCASTERS_MAP[id]?.name ?? id);
    return {
      id: f.id,
      home,
      away,
      kickoff,
      city: f.city,
      venue: f.venue,
      group: f.group,
      channels,
      channelsShort: channels.slice(0, 2),
      timeLabel: formatTime(kickoff),
      dayLabel: formatFullDayLabel(kickoff, now),
      isLive,
      isPreferred,
      showPrefBadge: isPreferred && !isLive,
    };
  });

  const filtered = filter
    ? enriched.filter((g) => g.home.code === filter || g.away.code === filter)
    : enriched;

  const upcoming = filtered
    .filter((g) => g.kickoff.getTime() > now.getTime() - LIVE_WINDOW_MS)
    .sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());

  const next = upcoming[0] ?? null;
  if (!next) return { next: null, today: [], upcoming: [] };

  const nextKey = dayKey(next.kickoff);
  const today = upcoming.filter((g) => g !== next && dayKey(g.kickoff) === nextKey);
  const laterFlat = upcoming.filter((g) => dayKey(g.kickoff) !== nextKey);

  const groupsMap = new Map<string, DayGroup>();
  for (const g of laterFlat) {
    const k = dayKey(g.kickoff);
    let grp = groupsMap.get(k);
    if (!grp) {
      grp = { key: k, label: g.dayLabel, games: [] };
      groupsMap.set(k, grp);
    }
    grp.games.push(g);
  }

  return { next, today, upcoming: Array.from(groupsMap.values()) };
};
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors. If you see `Property 'channels' does not exist on type 'Fixture'`, `lib/games.ts` still has the old reference — re-save the file above.

---

### Task 3: Add 24 missing teams (spec A4)

**Files:**
- Modify: `lib/teams.ts`

The `TeamCode` union was already updated in Task 2. Now add the team data to `TEAMS`.

- [ ] **Step 1: Append 24 team entries to the `TEAMS` record in `lib/teams.ts`**

Add inside the `TEAMS` object after the `ITA:` entry:

```ts
  // UEFA
  SUI: { code: "SUI", name: "Suíça",          shortName: "Suíça",         flag: "ch"  },
  AUT: { code: "AUT", name: "Áustria",         shortName: "Áustria",       flag: "at"  },
  DEN: { code: "DEN", name: "Dinamarca",       shortName: "Dinamarca",     flag: "dk"  },
  SRB: { code: "SRB", name: "Sérvia",          shortName: "Sérvia",        flag: "rs"  },
  TUR: { code: "TUR", name: "Turquia",         shortName: "Turquia",       flag: "tr"  },
  ROU: { code: "ROU", name: "Romênia",         shortName: "Romênia",       flag: "ro"  },
  UKR: { code: "UKR", name: "Ucrânia",         shortName: "Ucrânia",       flag: "ua"  },
  // CONMEBOL
  VEN: { code: "VEN", name: "Venezuela",       shortName: "Venezuela",     flag: "ve"  },
  PAR: { code: "PAR", name: "Paraguai",        shortName: "Paraguai",      flag: "py"  },
  // CONCACAF
  PAN: { code: "PAN", name: "Panamá",          shortName: "Panamá",        flag: "pa"  },
  HON: { code: "HON", name: "Honduras",        shortName: "Honduras",      flag: "hn"  },
  JAM: { code: "JAM", name: "Jamaica",         shortName: "Jamaica",       flag: "jm"  },
  // CAF
  EGY: { code: "EGY", name: "Egito",           shortName: "Egito",         flag: "eg"  },
  CIV: { code: "CIV", name: "Costa do Marfim", shortName: "C. do Marfim",  flag: "ci"  },
  COD: { code: "COD", name: "Congo (RD)",       shortName: "R.D. Congo",    flag: "cd"  },
  RSA: { code: "RSA", name: "África do Sul",    shortName: "África do Sul", flag: "za"  },
  // AFC
  KSA: { code: "KSA", name: "Arábia Saudita",  shortName: "Arábia Saudita",flag: "sa"  },
  IRN: { code: "IRN", name: "Irã",              shortName: "Irã",           flag: "ir"  },
  AUS: { code: "AUS", name: "Austrália",        shortName: "Austrália",     flag: "au"  },
  IRQ: { code: "IRQ", name: "Iraque",           shortName: "Iraque",        flag: "iq"  },
  JOR: { code: "JOR", name: "Jordânia",         shortName: "Jordânia",      flag: "jo"  },
  QAT: { code: "QAT", name: "Catar",            shortName: "Catar",         flag: "qa"  },
  UZB: { code: "UZB", name: "Uzbequistão",      shortName: "Uzbequistão",   flag: "uz"  },
  // OFC
  NZL: { code: "NZL", name: "Nova Zelândia",   shortName: "N. Zelândia",   flag: "nz"  },
```

> **Verify team codes:** Cross-check against the official FIFA 2026 qualified teams list. Some codes above are educated guesses — any team that didn't qualify must be removed from `TeamCode` in `lib/types.ts` and from `lib/teams.ts`. Any team that qualified with a different FIFA code must be corrected.

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors. Common failure: a `TeamCode` in `lib/fixtures.ts` that isn't in the `TEAMS` record — add the missing entry or correct the code.

---

### Task 4: Create SVG broadcaster logos (spec A5)

**Files:**
- Create: `public/broadcasters/globo.svg`
- Create: `public/broadcasters/sportv.svg`
- Create: `public/broadcasters/caze-tv.svg`
- Create: `public/broadcasters/globoplay.svg`
- Create: `public/broadcasters/ge-tv.svg`

> These are minimal placeholder SVGs for development. Replace with real brand assets before production. The spec prohibits hotlinking from broadcaster CDNs.

- [ ] **Step 1: Create the directory**

```bash
mkdir -p public/broadcasters
```

- [ ] **Step 2: Create `public/broadcasters/globo.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
  <rect width="120" height="40" rx="6" fill="#00B34E"/>
  <text x="60" y="27" font-family="Arial,sans-serif" font-size="18" font-weight="bold"
        fill="white" text-anchor="middle">Globo</text>
</svg>
```

- [ ] **Step 3: Create `public/broadcasters/sportv.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
  <rect width="120" height="40" rx="6" fill="#E30613"/>
  <text x="60" y="27" font-family="Arial,sans-serif" font-size="16" font-weight="bold"
        fill="white" text-anchor="middle">SporTV</text>
</svg>
```

- [ ] **Step 4: Create `public/broadcasters/caze-tv.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
  <rect width="120" height="40" rx="6" fill="#FF5500"/>
  <text x="60" y="27" font-family="Arial,sans-serif" font-size="15" font-weight="bold"
        fill="white" text-anchor="middle">Cazé TV</text>
</svg>
```

- [ ] **Step 5: Create `public/broadcasters/globoplay.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
  <rect width="120" height="40" rx="6" fill="#171C21"/>
  <text x="60" y="27" font-family="Arial,sans-serif" font-size="14" font-weight="bold"
        fill="#00B34E" text-anchor="middle">globoplay</text>
</svg>
```

- [ ] **Step 6: Create `public/broadcasters/ge-tv.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40">
  <rect width="120" height="40" rx="6" fill="#0076FF"/>
  <text x="60" y="27" font-family="Arial,sans-serif" font-size="18" font-weight="bold"
        fill="white" text-anchor="middle">GE TV</text>
</svg>
```

- [ ] **Step 7: Verify files**

```bash
ls public/broadcasters/
```

Expected: `caze-tv.svg  ge-tv.svg  globo.svg  globoplay.svg  sportv.svg`

---

### Task 5: Compile full 72-game group-stage fixture list (spec B1)

**Files:**
- Modify: `lib/fixtures.ts`

The existing 14 fixtures use `channels: string[]` (now invalid) and have group assignment inconsistencies (e.g. `BRA-MEX` is listed in Grupo G but `MEX-CAN` is in Grupo A — a team can only be in one group). Replace the entire file with the correct 72-game list using `broadcasterIds`.

**Source for the correct schedule:** https://www.fifa.com/fifaplus/en/tournaments/mens/worldcup/canadamexicousa2026  
The WC 2026 group stage started 2026-06-11 so the full schedule is public.

**Broadcaster assignment guide:**
- Brazil games (either side): `["globo", "sportv", "caze-tv"]`
- Top-profile matches (Argentina, France, England, Spain, Portugal, Germany vs. major opponents): `["globo", "sportv"]`
- Standard group games: `["sportv"]` or `["sportv", "globoplay"]`
- Games without confirmed rights: `[]` — the UI will show "Sem transmissão confirmada" fallback (Plan 3)

**Fixture id format:** `"{HOME}-{AWAY}-YYYY-MM-DD"` using FIFA three-letter codes, date in Brasília timezone.  
**Kickoff format:** `"YYYY-MM-DDTHH:MM:SS-03:00"` (all times in BRT, UTC−3).

- [ ] **Step 1: Replace `lib/fixtures.ts`**

Start with the 14 existing games converted to the new format, then fill in the remaining 58 from the official FIFA schedule:

```ts
import type { Fixture } from "./types";

export const FIXTURES: Fixture[] = [
  // ── Matchday 1 (sample — 14 converted from existing data) ───────────────────
  {
    id: "BRA-CRO-2026-06-12",
    home: "BRA", away: "CRO",
    kickoff: "2026-06-12T22:00:00-03:00",
    city: "Los Angeles", venue: "SoFi Stadium",
    group: "Grupo G",
    broadcasterIds: ["globo", "sportv", "caze-tv"],
  },
  {
    id: "FRA-SEN-2026-06-13",
    home: "FRA", away: "SEN",
    kickoff: "2026-06-13T13:00:00-03:00",
    city: "Atlanta", venue: "Mercedes-Benz Stadium",
    group: "Grupo D",
    broadcasterIds: ["sportv", "globoplay"],
  },
  {
    id: "MEX-CAN-2026-06-13",
    home: "MEX", away: "CAN",
    kickoff: "2026-06-13T16:00:00-03:00",
    city: "Cidade do México", venue: "Estádio Azteca",
    group: "Grupo A",
    broadcasterIds: ["sportv"],
  },
  {
    id: "USA-GHA-2026-06-13",
    home: "USA", away: "GHA",
    kickoff: "2026-06-13T20:00:00-03:00",
    city: "San Francisco", venue: "Levi's Stadium",
    group: "Grupo K",
    broadcasterIds: ["sportv", "caze-tv"],
  },
  {
    id: "ARG-MAR-2026-06-14",
    home: "ARG", away: "MAR",
    kickoff: "2026-06-14T13:00:00-03:00",
    city: "Dallas", venue: "AT&T Stadium",
    group: "Grupo C",
    broadcasterIds: ["globo", "sportv"],
  },
  {
    id: "ENG-JPN-2026-06-14",
    home: "ENG", away: "JPN",
    kickoff: "2026-06-14T16:00:00-03:00",
    city: "Nova York", venue: "MetLife Stadium",
    group: "Grupo F",
    broadcasterIds: ["sportv", "caze-tv"],
  },
  {
    id: "ESP-URU-2026-06-14",
    home: "ESP", away: "URU",
    kickoff: "2026-06-14T20:00:00-03:00",
    city: "Miami", venue: "Hard Rock Stadium",
    group: "Grupo H",
    broadcasterIds: ["sportv", "globoplay"],
  },
  {
    id: "GER-KOR-2026-06-15",
    home: "GER", away: "KOR",
    kickoff: "2026-06-15T13:00:00-03:00",
    city: "Filadélfia", venue: "Lincoln Financial Field",
    group: "Grupo E",
    broadcasterIds: ["sportv"],
  },
  {
    id: "POR-CMR-2026-06-15",
    home: "POR", away: "CMR",
    kickoff: "2026-06-15T16:00:00-03:00",
    city: "Houston", venue: "NRG Stadium",
    group: "Grupo I",
    broadcasterIds: ["globo", "sportv"],
  },
  {
    id: "NED-ECU-2026-06-15",
    home: "NED", away: "ECU",
    kickoff: "2026-06-15T20:00:00-03:00",
    city: "Kansas City", venue: "Arrowhead Stadium",
    group: "Grupo B",
    broadcasterIds: ["sportv", "globoplay"],
  },
  {
    id: "BEL-COL-2026-06-16",
    home: "BEL", away: "COL",
    kickoff: "2026-06-16T16:00:00-03:00",
    city: "Seattle", venue: "Lumen Field",
    group: "Grupo J",
    broadcasterIds: ["sportv"],
  },
  {
    id: "ITA-NGA-2026-06-16",
    home: "ITA", away: "NGA",
    kickoff: "2026-06-16T20:00:00-03:00",
    city: "Boston", venue: "Gillette Stadium",
    group: "Grupo L",
    broadcasterIds: ["sportv"],
  },
  // ── ADD remaining 60 fixtures here from the official FIFA schedule ───────────
  // Each group must have exactly 6 games (all 4C2 pairings across 3 matchdays).
  // 12 groups × 6 games = 72 total.
  // Verify: group assignments are consistent (each TeamCode appears in exactly 1 group).
];
```

> The 12 existing group names in the data above (Grupo A through Grupo L) must be verified against the actual draw. Any group with fewer than 6 entries is incomplete.

- [ ] **Step 2: Verify fixture count (must be 72)**

```bash
node -e "const f = require('./lib/fixtures'); console.log('Count:', f.FIXTURES.length)"
```

Expected: `Count: 72`

- [ ] **Step 3: Verify no duplicate ids**

```bash
node -e "
const { FIXTURES } = require('./lib/fixtures');
const ids = FIXTURES.map(x => x.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
console.log(dupes.length ? 'DUPLICATES: ' + dupes.join(', ') : 'No duplicates');
"
```

Expected: `No duplicates`

- [ ] **Step 4: Verify each group has exactly 6 games**

```bash
node -e "
const { FIXTURES } = require('./lib/fixtures');
const groups = {};
for (const f of FIXTURES) groups[f.group] = (groups[f.group] || 0) + 1;
for (const [g, n] of Object.entries(groups)) console.log(g + ':', n, n !== 6 ? '← WRONG' : '');
console.log('Total groups:', Object.keys(groups).length, '(expected 12)');
"
```

Expected: Each grupo shows `6`, total groups is `12`.

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors. If a `TeamCode` in a new fixture isn't in the union, add it to `lib/types.ts` (Task 2) and `lib/teams.ts` (Task 3).

---

### Task 6: Verify all 48 flag URLs (spec B2)

- [ ] **Step 1: Check all flag CDN URLs return 200**

```bash
node -e "
const { TEAMS } = require('./lib/teams');
const https = require('https');
const codes = Object.values(TEAMS).map(t => t.flag);
let done = 0; const errors = [];
codes.forEach(code => {
  https.get('https://flagcdn.com/' + code + '.svg', res => {
    if (res.statusCode !== 200) errors.push(code + ': HTTP ' + res.statusCode);
    if (++done === codes.length)
      console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'All ' + done + ' flags OK');
  }).on('error', e => { errors.push(code + ': ' + e.message); if (++done === codes.length) console.log('ERRORS:', errors); });
});
"
```

Expected: `All 48 flags OK`. If any fail, fix the `flag` ISO code in `lib/teams.ts`. Special cases: England uses `gb-eng`, Scotland would use `gb-sct`, Wales `gb-wls`.

---

### Plan 1 Completion Check

Before moving to Plan 2, confirm:

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `lib/fixtures.ts` has exactly 72 entries with no duplicate ids
- [ ] Each of 12 groups has exactly 6 fixtures
- [ ] All 48 flag URLs return HTTP 200
- [ ] 5 SVG files exist in `public/broadcasters/`
- [ ] `lib/broadcasters.ts` and `lib/api-types.ts` created
- [ ] `lib/types.ts` has `Broadcaster` interface, 48-item `TeamCode` union, `Fixture.broadcasterIds`
- [ ] `lib/teams.ts` has all 48 team entries
- [ ] `npm run dev` starts without errors and the UI still renders

- [ ] **Commit all foundations**

```bash
git add lib/types.ts lib/fixtures.ts lib/teams.ts lib/broadcasters.ts lib/api-types.ts lib/games.ts public/broadcasters/
git commit -m "feat(foundations): types, 48 teams, broadcaster data, 72-game fixture list"
```

**Next:** Plan 2 — API Layer + Sync Infrastructure
