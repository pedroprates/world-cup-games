import { BROADCASTERS } from "@/lib/broadcasters";
import type { ApiBroadcastersResponse } from "@/lib/api-types";

export const dynamic = "force-static";

export function GET(): Response {
  return Response.json({ broadcasters: BROADCASTERS } satisfies ApiBroadcastersResponse);
}
