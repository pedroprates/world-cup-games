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

export interface ApiGamesResponse        { games: ApiGame[] }
export interface ApiGameResponse         { game: ApiGame }
export interface ApiTeamsResponse        { teams: Team[] }
export interface ApiBroadcastersResponse { broadcasters: Broadcaster[] }
