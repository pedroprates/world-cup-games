import type { CountdownState, EnrichedGame } from "@/lib/types";
import { flagUrl } from "@/lib/teams";
import { Countdown } from "./Countdown";
import { LiveBadge } from "./LiveBadge";

interface HeroEditorialProps {
  game: EnrichedGame;
  cd: CountdownState;
  hydrated: boolean;
}

export function HeroEditorial({ game, cd, hydrated }: HeroEditorialProps) {
  return (
    <div className="relative grid grid-cols-1 overflow-hidden rounded-3xl border border-bone-2 bg-paper shadow-[0_1px_2px_rgba(40,34,20,0.04),0_22px_50px_-30px_rgba(40,34,20,0.28)] md:grid-cols-[1.2fr_0.8fr]">
      {game.isPreferred && (
        <div className="pointer-events-none absolute inset-0 z-[2] rounded-3xl border-[1.5px] border-clay" />
      )}

      <div className="p-10">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
          {game.dayLabel} · {game.timeLabel} BRT
        </span>

        <div className="mt-6 flex flex-col gap-3.5">
          <div className="flex items-center gap-[18px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flagUrl(game.home.code)}
              alt={game.home.name}
              width={82}
              height={57}
              className="h-[57px] w-[82px] rounded-[9px] border border-ink/10 object-cover shadow-[0_6px_16px_-10px_rgba(40,34,20,0.4)]"
            />
            <span className="font-display text-[44px] font-medium leading-none tracking-[-0.015em]">
              {game.home.name}
            </span>
          </div>
          <span className="pl-2 font-display text-[21px] italic text-mute-3">vs</span>
          <div className="flex items-center gap-[18px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={flagUrl(game.away.code)}
              alt={game.away.name}
              width={82}
              height={57}
              className="h-[57px] w-[82px] rounded-[9px] border border-ink/10 object-cover shadow-[0_6px_16px_-10px_rgba(40,34,20,0.4)]"
            />
            <span className="font-display text-[44px] font-medium leading-none tracking-[-0.015em]">
              {game.away.name}
            </span>
          </div>
        </div>

        <div className="mt-[30px] flex flex-wrap gap-9">
          <div className="flex min-w-[130px] flex-col gap-[5px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
              Cidade
            </span>
            <span className="font-display text-[17px] leading-[1.25]">
              {game.city}
            </span>
            <span className="text-xs leading-[1.3] text-mute">{game.venue}</span>
          </div>
          <div className="flex flex-col gap-[5px]">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
              Grupo
            </span>
            <span className="font-display text-[17px]">{game.group}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col justify-center gap-[22px] border-t border-bone-warm-2 bg-paper-warm px-[30px] py-9 md:border-l md:border-t-0">
        <div className="flex flex-col gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
            Começa em
          </span>
          {hydrated && cd.live && <LiveBadge />}
          {hydrated && !cd.live && <Countdown cd={cd} variant="editorial" />}
        </div>
        <div className="h-px bg-bone-warm" />
        <div className="flex flex-col gap-[9px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
            Onde assistir
          </span>
          <div className="flex flex-wrap gap-1.5">
            {game.broadcasters.length > 0 ? (
              game.broadcasters.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center rounded-lg border border-clay-border bg-clay-bg-soft px-2.5 py-1 text-[13px] font-semibold text-clay-deep"
                >
                  {b.name}
                </span>
              ))
            ) : (
              <span className="rounded-lg border border-bone-2 bg-paper px-2.5 py-1 text-[13px] text-mute">
                Sem transmissão confirmada
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
