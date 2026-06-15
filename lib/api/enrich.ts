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
