import type { Broadcaster } from "./types";

export const BROADCASTERS: Broadcaster[] = [
  { id: "globo",     name: "Globo",     logo: "/broadcasters/globo.svg"     },
  { id: "sportv",    name: "SporTV",    logo: "/broadcasters/sportv.svg"    },
  { id: "caze-tv",   name: "Cazé TV",   logo: "/broadcasters/caze-tv.svg"   },
  { id: "globoplay", name: "Globoplay", logo: "/broadcasters/globoplay.svg" },
  { id: "ge-tv",     name: "GE TV",     logo: "/broadcasters/ge-tv.svg"     },
];

export const BROADCASTERS_MAP: Record<string, Broadcaster> = Object.fromEntries(
  BROADCASTERS.map(b => [b.id, b])
);
