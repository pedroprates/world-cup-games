import type { CountdownState, EnrichedGame } from "@/lib/types";
import { flagUrl } from "@/lib/teams";
import { LiveBadge } from "./LiveBadge";

interface HeroTicketProps {
  game: EnrichedGame;
  cd: CountdownState;
  hydrated: boolean;
}

export function HeroTicket({ game, cd, hydrated }: HeroTicketProps) {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-bone-2 bg-paper shadow-[0_1px_2px_rgba(40,34,20,0.04),0_22px_50px_-30px_rgba(40,34,20,0.28)] md:flex-row">
      {game.isPreferred && (
        <div className="pointer-events-none absolute inset-0 z-[3] rounded-3xl border-[1.5px] border-clay" />
      )}

      <div className="min-w-0 flex-1 px-10 py-[38px]">
        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
          {game.group} · {game.dayLabel}
        </span>

        <div className="mt-[26px] flex flex-wrap items-center gap-7">
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flagUrl(game.home.code)}
              alt={game.home.name}
              width={94}
              height={94}
              className="h-[94px] w-[94px] rounded-full border border-ink/10 object-cover shadow-[0_8px_20px_-10px_rgba(40,34,20,0.4)]"
            />
            <span className="text-center font-display text-[26px] font-medium leading-[1.05]">
              {game.home.name}
            </span>
          </div>
          <span className="font-display text-[22px] italic text-mute-3">vs</span>
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flagUrl(game.away.code)}
              alt={game.away.name}
              width={94}
              height={94}
              className="h-[94px] w-[94px] rounded-full border border-ink/10 object-cover shadow-[0_8px_20px_-10px_rgba(40,34,20,0.4)]"
            />
            <span className="text-center font-display text-[26px] font-medium leading-[1.05]">
              {game.away.name}
            </span>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-10">
          <div className="flex flex-col gap-[5px]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-mute-3">
              Cidade
            </span>
            <span className="font-display text-[17px]">{game.city}</span>
          </div>
          <div className="flex flex-col gap-[5px]">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-mute-3">
              Estádio
            </span>
            <span className="font-display text-[17px]">{game.venue}</span>
          </div>
        </div>
      </div>

      <div className="relative w-full border-t-2 border-dashed border-bone-soft md:w-[2px] md:border-l-2 md:border-t-0">
        <span className="absolute -left-[11px] -top-[11px] hidden h-[22px] w-[22px] rounded-full bg-cream md:block" />
        <span className="absolute -bottom-[11px] -left-[11px] hidden h-[22px] w-[22px] rounded-full bg-cream md:block" />
      </div>

      <div className="flex w-full flex-none flex-col justify-center gap-5 bg-paper-warm px-[30px] py-[34px] md:w-[280px]">
        <div className="flex flex-col gap-[9px]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-mute-3">
            Embarque em
          </span>
          {hydrated && cd.live && <LiveBadge size="lg" />}
          {hydrated && !cd.live && (
            <span className="font-mono text-[30px] font-medium tracking-[-0.01em] tabular-nums">
              {cd.line}
            </span>
          )}
        </div>
        <div className="h-px bg-bone-warm" />
        <div className="flex flex-col gap-[5px]">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-mute-3">
            Horário
          </span>
          <span className="font-display text-[20px]">
            {game.timeLabel} <span className="text-xs text-mute">BRT</span>
          </span>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-mute-3">
            Onde assistir
          </span>
          <div className="flex flex-wrap gap-1.5">
            {game.channels.map((c) => (
              <span
                key={c}
                className="rounded-lg border border-clay-border bg-clay-bg-soft px-2.5 py-1 text-[13px] font-semibold text-clay-deep"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
