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
