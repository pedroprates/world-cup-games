export type TeamCode =
  | "BRA"
  | "CRO"
  | "ARG"
  | "MEX"
  | "CAN"
  | "FRA"
  | "GER"
  | "ENG"
  | "ESP"
  | "POR"
  | "NED"
  | "JPN"
  | "MAR"
  | "SEN"
  | "URU"
  | "COL"
  | "KOR"
  | "BEL"
  | "USA"
  | "GHA"
  | "CMR"
  | "ECU"
  | "NGA"
  | "ITA";

export interface Team {
  code: TeamCode;
  name: string;
  shortName: string;
  flag: string;
}

export interface Fixture {
  id: string;
  home: TeamCode;
  away: TeamCode;
  kickoff: string;
  city: string;
  venue: string;
  group: string;
  channels: string[];
}

export interface EnrichedGame {
  id: string;
  home: Team;
  away: Team;
  kickoff: Date;
  city: string;
  venue: string;
  group: string;
  channels: string[];
  channelsShort: string[];
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
