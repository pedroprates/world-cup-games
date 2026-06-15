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
