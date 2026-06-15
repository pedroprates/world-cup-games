import type { CountdownState, EnrichedGame } from "@/lib/types";
import { flagUrl } from "@/lib/teams";
import { Countdown } from "./Countdown";
import { LiveBadge } from "./LiveBadge";

interface HeroClassicProps {
  game: EnrichedGame;
  cd: CountdownState;
  hydrated: boolean;
}

export function HeroClassic({ game, cd, hydrated }: HeroClassicProps) {
  return (
    <div className="relative rounded-3xl border border-bone-2 bg-paper px-10 pb-7 pt-[38px] shadow-[0_1px_2px_rgba(40,34,20,0.04),0_22px_50px_-30px_rgba(40,34,20,0.28)]">
      {game.isPreferred && (
        <div className="pointer-events-none absolute inset-0 rounded-3xl border-[1.5px] border-clay" />
      )}

      <div className="mb-6 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-mute">
          {game.group} · Fase de grupos
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-5">
        <div className="flex flex-col items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(game.home.code)}
            alt={game.home.name}
            width={132}
            height={92}
            className="h-[92px] w-[132px] rounded-xl border border-ink/10 object-cover shadow-[0_8px_20px_-10px_rgba(40,34,20,0.4)]"
          />
          <span className="text-center font-display text-[33px] font-medium leading-[1.05] tracking-[-0.01em]">
            {game.home.name}
          </span>
        </div>

        <div className="flex min-w-[210px] flex-col items-center gap-4 pt-6">
          <span className="font-display text-[20px] italic text-mute-3">vs</span>
          {hydrated && cd.live && <LiveBadge />}
          {hydrated && !cd.live && (
            <div className="flex flex-col items-center gap-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
                Começa em
              </span>
              <Countdown cd={cd} variant="classic" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(game.away.code)}
            alt={game.away.name}
            width={132}
            height={92}
            className="h-[92px] w-[132px] rounded-xl border border-ink/10 object-cover shadow-[0_8px_20px_-10px_rgba(40,34,20,0.4)]"
          />
          <span className="text-center font-display text-[33px] font-medium leading-[1.05] tracking-[-0.01em]">
            {game.away.name}
          </span>
        </div>
      </div>

      <div className="mt-[30px] flex flex-wrap justify-center gap-x-[50px] gap-y-[18px] border-t border-bone-3 pt-[22px]">
        <FactCol label="Dia" value={game.dayLabel} />
        <FactCol
          label="Horário"
          value={
            <>
              {game.timeLabel} <span className="text-xs text-mute">BRT</span>
            </>
          }
        />
        <div className="flex flex-col items-center gap-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
            Cidade
          </span>
          <span className="font-display text-[17px]">{game.city}</span>
          <span className="text-xs text-mute">{game.venue}</span>
        </div>
        <div className="flex flex-col items-center gap-[7px]">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
            Onde assistir
          </span>
          <div className="flex flex-wrap justify-center gap-1.5">
            {game.broadcasters.length > 0 ? (
              game.broadcasters.map((b) => (
                <span
                  key={b.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-clay-border bg-clay-bg px-2.5 py-1 text-[13px] font-semibold text-clay-deep"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.logo} alt="" width={14} height={14} className="h-[14px] w-[14px] object-contain" />
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

function FactCol({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
        {label}
      </span>
      <span className="font-display text-[17px]">{value}</span>
    </div>
  );
}
