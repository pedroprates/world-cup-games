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
