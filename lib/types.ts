export type TeamCode =
  // Grupo A
  | "MEX" | "RSA" | "KOR" | "CZE"
  // Grupo B
  | "CAN" | "BIH" | "QAT" | "SUI"
  // Grupo C
  | "BRA" | "MAR" | "HAI" | "SCO"
  // Grupo D
  | "USA" | "PAR" | "AUS" | "TUR"
  // Grupo E
  | "GER" | "CUW" | "CIV" | "ECU"
  // Grupo F
  | "NED" | "JPN" | "SWE" | "TUN"
  // Grupo G
  | "BEL" | "EGY" | "IRN" | "NZL"
  // Grupo H
  | "ESP" | "CPV" | "KSA" | "URU"
  // Grupo I
  | "FRA" | "SEN" | "IRQ" | "NOR"
  // Grupo J
  | "ARG" | "ALG" | "AUT" | "JOR"
  // Grupo K
  | "POR" | "COD" | "UZB" | "COL"
  // Grupo L
  | "ENG" | "CRO" | "GHA" | "PAN";

export interface Team {
  code: TeamCode;
  name: string;
  shortName: string;
  flag: string;
}

export interface Broadcaster {
  id: string;   // "globo" | "sportv" | "caze-tv" | "globoplay" | "ge-tv"
  name: string; // display name
  logo: string; // path: "/broadcasters/globo.svg"
}

export interface Fixture {
  id: string;
  home: TeamCode;
  away: TeamCode;
  kickoff: string;        // ISO 8601 with offset, e.g. "2026-06-12T22:00:00-03:00"
  city: string;
  venue: string;
  group: string;
  broadcasterIds: string[];
}

export interface EnrichedGame {
  id: string;
  home: Team;
  away: Team;
  kickoff: Date;
  city: string;
  venue: string;
  group: string;
  broadcasters: Broadcaster[];      // full objects (was channels: string[])
  broadcastersShort: Broadcaster[]; // first 2 (was channelsShort: string[])
  timeLabel: string;
  dayLabel: string;
  isLive: boolean;
  isPreferred: boolean;
  showPrefBadge: boolean;
}

export interface DayGroup {
  key: string;
  label: string;
  games: EnrichedGame[];
}

export interface CountdownState {
  live: boolean;
  d: string;
  h: string;
  m: string;
  s: string;
  line: string;
  showDays: boolean;
}

export type HeroStyle = "classic" | "editorial" | "ticket";
