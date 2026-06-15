import { TEAMS } from "@/lib/teams";
import type { ApiTeamsResponse } from "@/lib/api-types";

export const dynamic = "force-static";

export function GET(): Response {
  const teams = Object.values(TEAMS).sort((a, b) =>
    a.name.localeCompare(b.name, "pt-BR")
  );
  return Response.json({ teams } satisfies ApiTeamsResponse);
}
