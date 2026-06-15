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
