# World Cup Backend — Plan 3: Client Integration + Validation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the client to consume the API, replace `channels: string[]` with `broadcasters: Broadcaster[]` throughout, surface broadcaster logos in all card components, add the "Sem transmissão confirmada" fallback, and validate data integrity.

**Architecture:** Keep `app/page.tsx` as `"use client"`. Replace the synchronous `buildSchedule(FIXTURES)` import with a `useEffect` that calls `fetchGames()` and stores `ApiGame[]` in state. Delete `lib/games.ts` (replaced by `lib/schedule.ts`). Update `EnrichedGame` to carry full `Broadcaster[]` objects instead of string names. Update all 5 display components.

**Prerequisites:** Plans 1 and 2 complete. All 4 API endpoints respond correctly. `npx tsc --noEmit` passes.

**Plan sequence:** This is Plan 3 of 3. After this plan the feature is complete.

---

### Task 1: Create `lib/client/api.ts` (spec D1)

**Files:**
- Create: `lib/client/api.ts`

Typed fetch wrappers. All use relative URLs (safe in `useEffect`, always runs in the browser). Throw on non-2xx so callers get a rejected promise they can handle.

- [ ] **Step 1: Write `lib/client/api.ts`**

```ts
import type {
  ApiGamesResponse,
  ApiGameResponse,
  ApiTeamsResponse,
  ApiBroadcastersResponse,
} from "@/lib/api-types";
import type { TeamCode } from "@/lib/types";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export function fetchGames(params?: {
  group?: string;
  date?: string;
  team?: TeamCode;
}): Promise<ApiGamesResponse> {
  const sp = new URLSearchParams();
  if (params?.group) sp.set("group", params.group);
  if (params?.date) sp.set("date", params.date);
  if (params?.team) sp.set("team", params.team);
  const q = sp.toString();
  return apiFetch<ApiGamesResponse>(`/api/games${q ? `?${q}` : ""}`);
}

export function fetchGame(id: string): Promise<ApiGameResponse> {
  return apiFetch<ApiGameResponse>(`/api/games/${encodeURIComponent(id)}`);
}

export function fetchTeams(): Promise<ApiTeamsResponse> {
  return apiFetch<ApiTeamsResponse>("/api/teams");
}

export function fetchBroadcasters(): Promise<ApiBroadcastersResponse> {
  return apiFetch<ApiBroadcastersResponse>("/api/broadcasters");
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

### Task 2: Update `lib/types.ts` `EnrichedGame` + create `lib/schedule.ts` (spec D2)

`EnrichedGame` currently holds `channels: string[]` and `channelsShort: string[]`. Replace these with `broadcasters: Broadcaster[]` and `broadcastersShort: Broadcaster[]`. Then create `lib/schedule.ts` which accepts `ApiGame[]` instead of reading FIXTURES directly.

**Files:**
- Modify: `lib/types.ts`
- Create: `lib/schedule.ts`
- Delete: `lib/games.ts`

- [ ] **Step 1: Update `EnrichedGame` in `lib/types.ts`**

Replace the `EnrichedGame` interface:

```ts
export interface EnrichedGame {
  id: string;
  home: Team;
  away: Team;
  kickoff: Date;
  city: string;
  venue: string;
  group: string;
  broadcasters: Broadcaster[];      // full objects (was channels: string[])
  broadcastersShort: Broadcaster[]; // first 2 (was channelsShort: string[])
  timeLabel: string;
  dayLabel: string;
  isLive: boolean;
  isPreferred: boolean;
  showPrefBadge: boolean;
}
```

- [ ] **Step 2: Create `lib/schedule.ts`**

```ts
import { dayKey, formatFullDayLabel, formatTime, isLiveNow } from "./format";
import type { ApiGame } from "./api-types";
import type { DayGroup, EnrichedGame, TeamCode } from "./types";

interface BuildArgs {
  now: Date;
  games: ApiGame[];
  preferred: TeamCode;
  filter: TeamCode | "";
}

interface BuildResult {
  next: EnrichedGame | null;
  today: EnrichedGame[];
  upcoming: DayGroup[];
}

const LIVE_WINDOW_MS = 105 * 60 * 1000;

export const buildSchedule = ({ now, games, preferred, filter }: BuildArgs): BuildResult => {
  const enriched: EnrichedGame[] = games.map((g) => {
    const kickoff = new Date(g.kickoff);
    const isPreferred = g.home.code === preferred || g.away.code === preferred;
    const isLive = isLiveNow(kickoff, now);
    return {
      id: g.id,
      home: g.home,
      away: g.away,
      kickoff,
      city: g.city,
      venue: g.venue,
      group: g.group,
      broadcasters: g.broadcasters,
      broadcastersShort: g.broadcasters.slice(0, 2),
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

- [ ] **Step 3: Delete `lib/games.ts`**

```bash
rm lib/games.ts
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: TypeScript will report errors because `app/page.tsx` still imports from `@/lib/games`. Fix those in Task 3 immediately below.

---

### Task 3: Update `app/page.tsx` (spec D3)

**Files:**
- Modify: `app/page.tsx`

Replace the synchronous `buildSchedule` call with a `useEffect` that fetches from the API. Add lightweight loading state.

- [ ] **Step 1: Rewrite `app/page.tsx`**

```ts
"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { TopControls } from "@/components/TopControls";
import { HeroSwitcher } from "@/components/HeroSwitcher";
import { HeroClassic } from "@/components/HeroClassic";
import { HeroEditorial } from "@/components/HeroEditorial";
import { HeroTicket } from "@/components/HeroTicket";
import { TodaySection } from "@/components/TodaySection";
import { UpcomingSection } from "@/components/UpcomingSection";
import { TEAMS } from "@/lib/teams";
import { fetchGames } from "@/lib/client/api";
import { buildSchedule } from "@/lib/schedule";
import {
  computeCountdown,
  dayKey,
  formatDayMonth,
  formatTime,
} from "@/lib/format";
import type { ApiGame } from "@/lib/api-types";
import type { HeroStyle, TeamCode } from "@/lib/types";

const FALLBACK_NOW = new Date("2026-06-12T12:00:00-03:00");

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<Date>(FALLBACK_NOW);
  const [preferred, setPreferred] = useState<TeamCode>("BRA");
  const [filter, setFilter] = useState<TeamCode | "">("");
  const [heroStyle, setHeroStyle] = useState<HeroStyle>("classic");
  const [games, setGames] = useState<ApiGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHydrated(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    fetchGames()
      .then(({ games: g }) => { setGames(g); setLoading(false); })
      .catch(() => setLoading(false));
    return () => clearInterval(id);
  }, []);

  const schedule = useMemo(
    () => buildSchedule({ now, games, preferred, filter }),
    [now, games, preferred, filter],
  );

  const countdown = useMemo(
    () => (schedule.next ? computeCountdown(schedule.next.kickoff, now) : null),
    [schedule.next, now],
  );

  const todayTitle = useMemo(() => {
    if (!schedule.next) return "";
    const isToday = dayKey(schedule.next.kickoff) === dayKey(now);
    return isToday
      ? `Ainda hoje · ${formatDayMonth(schedule.next.kickoff)}`
      : schedule.next.dayLabel;
  }, [schedule.next, now]);

  const filterActive = filter !== "";
  const filterName = filter ? TEAMS[filter].name : "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <span className="text-sm text-mute-2">Carregando jogos…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-6 pb-[90px] pt-10 text-ink">
      <div className="mx-auto max-w-[1080px]">
        <Header nowLabel={hydrated ? formatTime(now) : null} />

        <TopControls
          preferred={preferred}
          filter={filter}
          onPreferredChange={setPreferred}
          onFilterChange={setFilter}
        />

        <section className="mt-[30px]">
          <div className="mb-3.5 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-block h-2 w-2 rounded-full bg-clay" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-mute-2">
                Próximo jogo
              </span>
              {schedule.next?.isPreferred && (
                <span className="rounded-full border border-clay-border bg-clay-bg px-2.5 py-[3px] text-[11px] font-semibold text-clay-deep">
                  Sua seleção
                </span>
              )}
            </div>
            <HeroSwitcher value={heroStyle} onChange={setHeroStyle} />
          </div>

          {schedule.next && countdown ? (
            <>
              {heroStyle === "classic" && (
                <HeroClassic game={schedule.next} cd={countdown} hydrated={hydrated} />
              )}
              {heroStyle === "editorial" && (
                <HeroEditorial game={schedule.next} cd={countdown} hydrated={hydrated} />
              )}
              {heroStyle === "ticket" && (
                <HeroTicket game={schedule.next} cd={countdown} hydrated={hydrated} />
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-bone-soft bg-paper p-12 text-center">
              <span className="font-display text-[22px] text-mute-2">
                Nenhum jogo encontrado
                {filterActive ? ` para ${filterName}` : ""}
              </span>
              {filterActive && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setFilter("")}
                    className="cursor-pointer rounded-[10px] border-none bg-clay px-5 py-[11px] text-sm font-semibold text-[#FBF4EF]"
                  >
                    Ver todos os jogos
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <TodaySection title={todayTitle} games={schedule.today} />
        <UpcomingSection groups={schedule.upcoming} />

        <footer className="mt-12 text-center">
          <span className="text-xs text-mute-3">
            Horários no fuso de Brasília · sujeitos a alteração
          </span>
        </footer>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: Errors about `channels` / `channelsShort` in all 5 components — fix those in Tasks 4 and 5.

---

### Task 4: Update Hero components (spec D4 + D5)

Replace `game.channels` / `game.channelsShort` with `game.broadcasters` / `game.broadcastersShort`. Add broadcaster logo `<img>` alongside the name. Add "Sem transmissão confirmada" fallback when `broadcasters` is empty.

**Files:**
- Modify: `components/HeroClassic.tsx`
- Modify: `components/HeroEditorial.tsx`
- Modify: `components/HeroTicket.tsx`

The broadcaster pill pattern used in all three (replace every `channels` block):

```tsx
{/* broadcaster pills with logo + fallback */}
{game.broadcasters.length > 0 ? (
  game.broadcasters.map((b) => (
    <span
      key={b.id}
      className="inline-flex items-center gap-1.5 rounded-lg border border-clay-border bg-clay-bg px-2.5 py-1 text-[13px] font-semibold text-clay-deep"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={b.logo} alt="" width={14} height={14} className="h-[14px] w-[14px] object-contain" />
      {b.name}
    </span>
  ))
) : (
  <span className="rounded-lg border border-bone-2 bg-paper px-2.5 py-1 text-[13px] text-mute">
    Sem transmissão confirmada
  </span>
)}
```

- [ ] **Step 1: Update `components/HeroClassic.tsx`**

In the "Onde assistir" section (around line 86–98), replace the `game.channels.map(...)` block with:

```tsx
        <div className="flex flex-col items-center gap-[7px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
            Onde assistir
          </span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {game.broadcasters.length > 0 ? (
              game.broadcasters.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-clay-border bg-clay-bg px-2.5 py-1 text-[13px] font-semibold text-clay-deep"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.logo} alt="" width={14} height={14} className="h-[14px] w-[14px] object-contain" />
                  {b.name}
                </span>
              ))
            ) : (
              <span className="rounded-lg border border-bone-2 bg-paper px-2.5 py-1 text-[13px] text-mute">
                Sem transmissão confirmada
              </span>
            )}
          </div>
        </div>
```

- [ ] **Step 2: Update `components/HeroEditorial.tsx`**

In the right panel "Onde assistir" section (around line 83–96), replace the `game.channels.map(...)` block with:

```tsx
        <div className="flex flex-col gap-[9px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
            Onde assistir
          </span>
          <div className="flex flex-wrap gap-1.5">
            {game.broadcasters.length > 0 ? (
              game.broadcasters.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-clay-border bg-clay-bg-soft px-2.5 py-1 text-[13px] font-semibold text-clay-deep"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.logo} alt="" width={14} height={14} className="h-[14px] w-[14px] object-contain" />
                  {b.name}
                </span>
              ))
            ) : (
              <span className="rounded-lg border border-bone-2 bg-paper px-2.5 py-1 text-[13px] text-mute">
                Sem transmissão confirmada
              </span>
            )}
          </div>
        </div>
```

- [ ] **Step 3: Update `components/HeroTicket.tsx`**

In the stub section "Onde assistir" (around line 95–110), replace the `game.channels.map(...)` block with:

```tsx
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-mute-3">
            Onde assistir
          </span>
          <div className="flex flex-wrap gap-1.5">
            {game.broadcasters.length > 0 ? (
              game.broadcasters.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-clay-border bg-clay-bg-soft px-2.5 py-1 text-[13px] font-semibold text-clay-deep"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.logo} alt="" width={14} height={14} className="h-[14px] w-[14px] object-contain" />
                  {b.name}
                </span>
              ))
            ) : (
              <span className="rounded-lg border border-bone-2 bg-paper px-2.5 py-1 text-[13px] text-mute">
                Sem transmissão confirmada
              </span>
            )}
          </div>
        </div>
```

- [ ] **Step 4: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: Errors only in `TodaySection.tsx` and `UpcomingSection.tsx` — fixed in Task 5.

---

### Task 5: Update `TodaySection` and `UpcomingSection` (spec D4 + D5)

**Files:**
- Modify: `components/TodaySection.tsx`
- Modify: `components/UpcomingSection.tsx`

- [ ] **Step 1: Update `components/TodaySection.tsx`**

In `TodayCard` (bottom of the component), replace the `game.channels.map(...)` block (around line 61–70) with:

```tsx
        <div className="flex flex-wrap justify-end gap-1.5">
          {game.broadcasters.length > 0 ? (
            game.broadcasters.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 rounded-[7px] border border-clay-border bg-clay-bg px-2 py-[3px] text-xs font-semibold text-clay-deep"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logo} alt="" width={12} height={12} className="h-3 w-3 object-contain" />
                {b.name}
              </span>
            ))
          ) : (
            <span className="rounded-[7px] border border-bone-2 bg-paper px-2 py-[3px] text-xs text-mute">
              Sem transmissão
            </span>
          )}
        </div>
```

> In `TodayCard`, use all `game.broadcasters` (no truncation). The card has enough space.

- [ ] **Step 2: Update `components/UpcomingSection.tsx`**

In `UpcomingRow`, replace the `game.channelsShort.map(...)` block (around line 82–90) with:

```tsx
        <div className="flex gap-1.5">
          {game.broadcastersShort.length > 0 ? (
            game.broadcastersShort.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 rounded-[7px] border border-clay-border bg-clay-bg px-2 py-[3px] text-xs font-semibold text-clay-deep"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logo} alt="" width={12} height={12} className="h-3 w-3 object-contain" />
                {b.name}
              </span>
            ))
          ) : (
            <span className="rounded-[7px] border border-bone-2 bg-paper px-2 py-[3px] text-xs text-mute">
              Sem TV
            </span>
          )}
        </div>
```

> `game.broadcastersShort` is already limited to 2 items (set in `lib/schedule.ts`).

- [ ] **Step 3: Final TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. If you still see `channels` or `channelsShort` errors, search for any remaining references:

```bash
grep -r "\.channels" components/ app/ lib/ --include="*.tsx" --include="*.ts"
grep -r "channelsShort" components/ app/ lib/ --include="*.tsx" --include="*.ts"
```

Any remaining hits must be updated to `.broadcasters` / `.broadcastersShort`.

- [ ] **Step 4: Commit client integration**

```bash
git add app/page.tsx components/ lib/client/ lib/schedule.ts lib/types.ts
git rm lib/games.ts
git commit -m "feat(client): wire fetchGames, refactor buildSchedule, broadcaster logos in all components"
```

---

### Task 6: Create `scripts/validate-fixtures.ts` + update sync script (spec F1)

**Files:**
- Create: `scripts/validate-fixtures.ts`
- Modify: `scripts/sync-fixtures.ts`
- Modify: `package.json`

The validate script asserts data integrity: unique ids, all team codes in `TEAMS`, all broadcaster ids in `BROADCASTERS_MAP`, all kickoffs are valid ISO dates. The sync script calls it after every merge.

- [ ] **Step 1: Write `scripts/validate-fixtures.ts`**

```ts
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
```

- [ ] **Step 2: Add validate call to `scripts/sync-fixtures.ts`**

Add this import at the top of `scripts/sync-fixtures.ts` (after existing imports):

```ts
import { validateFixtures } from "./validate-fixtures";
```

And add this call at the end of `sync()`, before the final `console.log` lines:

```ts
  await validateFixtures(merged);
```

So the end of `sync()` looks like:

```ts
  const merged = [...existing, ...added];
  await validateFixtures(merged);   // exits with code 1 on failure
  await fs.writeFile(FIXTURES_PATH, JSON.stringify(merged, null, 2));

  const empty = merged.filter(f => f.broadcasterIds.length === 0).length;
  console.log(`Already present: ${existing.length}`);
  console.log(`New fixtures added: ${added.length}`);
  if (skipped.length) console.log(`Skipped (unknown team code): ${skipped.join(", ")}`);
  console.log(`Fixtures needing broadcaster assignment: ${empty}`);
```

- [ ] **Step 3: Add `validate` script to `package.json`**

```json
"validate": "tsx scripts/validate-fixtures.ts"
```

- [ ] **Step 4: Run the validate script against the current fixtures**

```bash
npm run validate
```

Expected: `✓ All fixtures valid`. If it exits with error, fix the reported fixture in `data/fixtures.json`.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate-fixtures.ts scripts/sync-fixtures.ts package.json
git commit -m "feat(scripts): add validate-fixtures script; call from sync"
```

---

### Task 7: Smoke test all endpoints and verify UI (spec F2)

- [ ] **Step 1: Verify all 4 endpoints**

With `npm run dev` running:

```bash
# All games with full data shape
curl -s "http://localhost:3000/api/games" | node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const g = d.games[0];
console.log('Count:', d.games.length);
console.log('First game id:', g.id);
console.log('home team:', g.home.name, '| flag:', g.home.flag);
console.log('broadcasters:', g.broadcasters.map(b => b.name).join(', '));
"

# Game by id — broadcaster logos included
curl -s "http://localhost:3000/api/games/BRA-CRO-2026-06-12" | node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log('BRA-CRO broadcasters:', d.game.broadcasters.map(b => b.logo).join(', '));
"

# Teams sorted
curl -s "http://localhost:3000/api/teams" | node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log('Teams:', d.teams.length, '| First:', d.teams[0].name);
"

# Broadcasters
curl -s "http://localhost:3000/api/broadcasters" | node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
console.log('Broadcasters:', d.broadcasters.map(b => b.id).join(', '));
"
```

Expected:
- `Count: 72`, first game has `home.name` and `broadcasters` array
- BRA-CRO broadcaster logos are `/broadcasters/globo.svg`, `/broadcasters/sportv.svg`, `/broadcasters/caze-tv.svg`
- `Teams: 48 | First:` (some team alphabetically first in Portuguese)
- `Broadcasters: globo, sportv, caze-tv, globoplay, ge-tv`

- [ ] **Step 2: Verify the UI renders correctly**

Open http://localhost:3000 in a browser. Check:
1. The hero card loads (may flash a brief "Carregando jogos…" before games appear)
2. Broadcaster logos appear in the "Onde assistir" section (small `<img>` + name in each pill)
3. Switch between classic / editorial / ticket hero — broadcaster logos show in all three
4. A game with `broadcasterIds: []` shows "Sem transmissão confirmada" (or create one temporarily in `data/fixtures.json` to test the fallback)
5. The filter chip works — select a team, games narrow correctly
6. Today/upcoming sections show broadcaster pills

---

### Task 8: Dry-run the sync script (spec F3)

- [ ] **Step 1: Set up the API key**

Create `.env.local` (not committed):

```bash
echo "FOOTBALL_DATA_API_KEY=your_actual_key_here" >> .env.local
```

- [ ] **Step 2: Run sync in dry-run mode (inspect output only)**

```bash
npm run sync
```

Expected output:
- `Already present: 72`
- `New fixtures added: N` (0 during group stage; will increase as knockout round matchups become known)
- If any skipped TLA codes appear, add mappings to `TLA_MAP` in `scripts/sync-fixtures.ts`
- Validation must pass (line `✓ All fixtures valid` from `validateFixtures`)
- `data/fixtures.json` is unchanged if N = 0

- [ ] **Step 3: Verify `data/fixtures.json` is still valid after sync**

```bash
npm run validate
```

Expected: `✓ All fixtures valid`

---

### Plan 3 Completion Check

- [ ] `npx tsc --noEmit` passes with 0 errors
- [ ] `lib/games.ts` deleted; `lib/schedule.ts` and `lib/client/api.ts` created
- [ ] All 5 display components use `game.broadcasters` / `game.broadcastersShort`
- [ ] "Sem transmissão confirmada" fallback renders when `broadcasters` is empty
- [ ] Broadcaster logos (`<img>`) appear in all 3 hero variants and both card sections
- [ ] `npm run validate` exits 0
- [ ] `npm run sync` runs without error and logs correct counts
- [ ] UI loads, games appear, filter works, countdown ticks

- [ ] **Final commit**

```bash
git add .
git commit -m "feat: complete world cup backend — API layer, broadcaster logos, sync script"
```

**Feature complete.** All 4 API endpoints serve data from `data/fixtures.json`. The client fetches and renders broadcaster logos. The sync script handles knockout-stage fixture updates daily.
