import { FIXTURES } from "./fixtures";
import { TEAMS } from "./teams";
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
    return {
      id: f.id,
      home,
      away,
      kickoff,
      city: f.city,
      venue: f.venue,
      group: f.group,
      channels: f.channels,
      channelsShort: f.channels.slice(0, 2),
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
    let group = groupsMap.get(k);
    if (!group) {
      group = { key: k, label: g.dayLabel, games: [] };
      groupsMap.set(k, group);
    }
    group.games.push(g);
  }

  return { next, today, upcoming: Array.from(groupsMap.values()) };
};
