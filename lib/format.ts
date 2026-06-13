import type { CountdownState } from "./types";

const TZ = "America/Sao_Paulo";

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

const dayKeyFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const weekdayFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  weekday: "long",
});

const dayMonthFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
});

export const formatTime = (d: Date): string => timeFmt.format(d);
export const dayKey = (d: Date): string => dayKeyFmt.format(d);
export const formatDayMonth = (d: Date): string => dayMonthFmt.format(d);

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const keyToDayIndex = (key: string): number =>
  Math.round(Date.parse(`${key}T12:00:00Z`) / 86400000);

export const formatDayLabel = (d: Date, now: Date): string => {
  const diff = keyToDayIndex(dayKey(d)) - keyToDayIndex(dayKey(now));
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Amanhã";
  return cap(weekdayFmt.format(d));
};

export const formatFullDayLabel = (d: Date, now: Date): string =>
  `${formatDayLabel(d, now)} · ${formatDayMonth(d)}`;

const pad = (n: number): string => String(n).padStart(2, "0");

export const computeCountdown = (target: Date, now: Date): CountdownState => {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) {
    return { live: true, d: "00", h: "00", m: "00", s: "00", line: "00:00:00", showDays: false };
  }
  const total = Math.floor(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const dStr = pad(days);
  const hStr = pad(hours);
  const mStr = pad(minutes);
  const sStr = pad(seconds);
  const line = days > 0 ? `${days}d ${hStr}:${mStr}:${sStr}` : `${hStr}:${mStr}:${sStr}`;
  return { live: false, d: dStr, h: hStr, m: mStr, s: sStr, line, showDays: days > 0 };
};

export const isLiveNow = (kickoff: Date, now: Date): boolean => {
  const t = kickoff.getTime();
  const n = now.getTime();
  return t <= n && n < t + 105 * 60 * 1000;
};
