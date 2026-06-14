import type { Team, TeamCode } from "./types";

export const TEAMS: Record<TeamCode, Team> = {
  // Grupo A
  MEX: { code: "MEX", name: "México",              shortName: "México",         flag: "mx"     },
  RSA: { code: "RSA", name: "África do Sul",        shortName: "África do Sul",  flag: "za"     },
  KOR: { code: "KOR", name: "Coreia do Sul",        shortName: "Coreia",         flag: "kr"     },
  CZE: { code: "CZE", name: "República Tcheca",     shortName: "R. Tcheca",      flag: "cz"     },
  // Grupo B
  CAN: { code: "CAN", name: "Canadá",               shortName: "Canadá",         flag: "ca"     },
  BIH: { code: "BIH", name: "Bósnia e Herzeg.",     shortName: "Bósnia",         flag: "ba"     },
  QAT: { code: "QAT", name: "Catar",                shortName: "Catar",          flag: "qa"     },
  SUI: { code: "SUI", name: "Suíça",                shortName: "Suíça",          flag: "ch"     },
  // Grupo C
  BRA: { code: "BRA", name: "Brasil",               shortName: "Brasil",         flag: "br"     },
  MAR: { code: "MAR", name: "Marrocos",             shortName: "Marrocos",       flag: "ma"     },
  HAI: { code: "HAI", name: "Haiti",                shortName: "Haiti",          flag: "ht"     },
  SCO: { code: "SCO", name: "Escócia",              shortName: "Escócia",        flag: "gb-sct" },
  // Grupo D
  USA: { code: "USA", name: "Estados Unidos",       shortName: "EUA",            flag: "us"     },
  PAR: { code: "PAR", name: "Paraguai",             shortName: "Paraguai",       flag: "py"     },
  AUS: { code: "AUS", name: "Austrália",            shortName: "Austrália",      flag: "au"     },
  TUR: { code: "TUR", name: "Turquia",              shortName: "Turquia",        flag: "tr"     },
  // Grupo E
  GER: { code: "GER", name: "Alemanha",             shortName: "Alemanha",       flag: "de"     },
  CUW: { code: "CUW", name: "Curaçao",              shortName: "Curaçao",        flag: "cw"     },
  CIV: { code: "CIV", name: "Costa do Marfim",      shortName: "C. do Marfim",   flag: "ci"     },
  ECU: { code: "ECU", name: "Equador",              shortName: "Equador",        flag: "ec"     },
  // Grupo F
  NED: { code: "NED", name: "Holanda",              shortName: "Holanda",        flag: "nl"     },
  JPN: { code: "JPN", name: "Japão",               shortName: "Japão",          flag: "jp"     },
  SWE: { code: "SWE", name: "Suécia",               shortName: "Suécia",         flag: "se"     },
  TUN: { code: "TUN", name: "Tunísia",              shortName: "Tunísia",        flag: "tn"     },
  // Grupo G
  BEL: { code: "BEL", name: "Bélgica",              shortName: "Bélgica",        flag: "be"     },
  EGY: { code: "EGY", name: "Egito",               shortName: "Egito",          flag: "eg"     },
  IRN: { code: "IRN", name: "Irã",                  shortName: "Irã",            flag: "ir"     },
  NZL: { code: "NZL", name: "Nova Zelândia",        shortName: "N. Zelândia",    flag: "nz"     },
  // Grupo H
  ESP: { code: "ESP", name: "Espanha",              shortName: "Espanha",        flag: "es"     },
  CPV: { code: "CPV", name: "Cabo Verde",           shortName: "Cabo Verde",     flag: "cv"     },
  KSA: { code: "KSA", name: "Arábia Saudita",       shortName: "Arábia Saudita", flag: "sa"     },
  URU: { code: "URU", name: "Uruguai",              shortName: "Uruguai",        flag: "uy"     },
  // Grupo I
  FRA: { code: "FRA", name: "França",               shortName: "França",         flag: "fr"     },
  SEN: { code: "SEN", name: "Senegal",              shortName: "Senegal",        flag: "sn"     },
  IRQ: { code: "IRQ", name: "Iraque",               shortName: "Iraque",         flag: "iq"     },
  NOR: { code: "NOR", name: "Noruega",              shortName: "Noruega",        flag: "no"     },
  // Grupo J
  ARG: { code: "ARG", name: "Argentina",            shortName: "Argentina",      flag: "ar"     },
  ALG: { code: "ALG", name: "Argélia",              shortName: "Argélia",        flag: "dz"     },
  AUT: { code: "AUT", name: "Áustria",              shortName: "Áustria",        flag: "at"     },
  JOR: { code: "JOR", name: "Jordânia",             shortName: "Jordânia",       flag: "jo"     },
  // Grupo K
  POR: { code: "POR", name: "Portugal",             shortName: "Portugal",       flag: "pt"     },
  COD: { code: "COD", name: "Congo (RD)",            shortName: "R.D. Congo",     flag: "cd"     },
  UZB: { code: "UZB", name: "Uzbequistão",          shortName: "Uzbequistão",    flag: "uz"     },
  COL: { code: "COL", name: "Colômbia",             shortName: "Colômbia",       flag: "co"     },
  // Grupo L
  ENG: { code: "ENG", name: "Inglaterra",           shortName: "Inglaterra",     flag: "gb-eng" },
  CRO: { code: "CRO", name: "Croácia",              shortName: "Croácia",        flag: "hr"     },
  GHA: { code: "GHA", name: "Gana",                shortName: "Gana",           flag: "gh"     },
  PAN: { code: "PAN", name: "Panamá",               shortName: "Panamá",         flag: "pa"     },
};

export const PREFERRED_CHIPS: TeamCode[] = [
  "BRA", "ARG", "FRA", "ENG", "POR", "ESP", "GER", "NED",
  "MEX", "USA", "URU", "CRO", "JPN", "MAR",
];

export const flagUrl = (code: TeamCode): string =>
  `https://flagcdn.com/${TEAMS[code].flag}.svg`;
