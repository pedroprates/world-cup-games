import type { Team, TeamCode } from "./types";

export const TEAMS: Record<TeamCode, Team> = {
  BRA: { code: "BRA", name: "Brasil", shortName: "Brasil", flag: "br" },
  CRO: { code: "CRO", name: "Croácia", shortName: "Croácia", flag: "hr" },
  ARG: { code: "ARG", name: "Argentina", shortName: "Argentina", flag: "ar" },
  MEX: { code: "MEX", name: "México", shortName: "México", flag: "mx" },
  CAN: { code: "CAN", name: "Canadá", shortName: "Canadá", flag: "ca" },
  FRA: { code: "FRA", name: "França", shortName: "França", flag: "fr" },
  GER: { code: "GER", name: "Alemanha", shortName: "Alemanha", flag: "de" },
  ENG: { code: "ENG", name: "Inglaterra", shortName: "Inglaterra", flag: "gb-eng" },
  ESP: { code: "ESP", name: "Espanha", shortName: "Espanha", flag: "es" },
  POR: { code: "POR", name: "Portugal", shortName: "Portugal", flag: "pt" },
  NED: { code: "NED", name: "Holanda", shortName: "Holanda", flag: "nl" },
  JPN: { code: "JPN", name: "Japão", shortName: "Japão", flag: "jp" },
  MAR: { code: "MAR", name: "Marrocos", shortName: "Marrocos", flag: "ma" },
  SEN: { code: "SEN", name: "Senegal", shortName: "Senegal", flag: "sn" },
  URU: { code: "URU", name: "Uruguai", shortName: "Uruguai", flag: "uy" },
  COL: { code: "COL", name: "Colômbia", shortName: "Colômbia", flag: "co" },
  KOR: { code: "KOR", name: "Coreia do Sul", shortName: "Coreia", flag: "kr" },
  BEL: { code: "BEL", name: "Bélgica", shortName: "Bélgica", flag: "be" },
  USA: { code: "USA", name: "Estados Unidos", shortName: "EUA", flag: "us" },
  GHA: { code: "GHA", name: "Gana", shortName: "Gana", flag: "gh" },
  CMR: { code: "CMR", name: "Camarões", shortName: "Camarões", flag: "cm" },
  ECU: { code: "ECU", name: "Equador", shortName: "Equador", flag: "ec" },
  NGA: { code: "NGA", name: "Nigéria", shortName: "Nigéria", flag: "ng" },
  ITA: { code: "ITA", name: "Itália", shortName: "Itália", flag: "it" },
};

export const PREFERRED_CHIPS: TeamCode[] = [
  "BRA",
  "ARG",
  "FRA",
  "ENG",
  "POR",
  "ESP",
  "GER",
  "NED",
  "MEX",
  "USA",
  "URU",
  "CRO",
  "JPN",
  "MAR",
];

export const flagUrl = (code: TeamCode): string =>
  `https://flagcdn.com/${TEAMS[code].flag}.svg`;
