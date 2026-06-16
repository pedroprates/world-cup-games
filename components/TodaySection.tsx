import { flagUrl } from "@/lib/teams";
import type { EnrichedGame } from "@/lib/types";

interface TodaySectionProps {
  title: string;
  games: EnrichedGame[];
}

export function TodaySection({ title, games }: TodaySectionProps) {
  if (games.length === 0) return null;
  return (
    <section className="mt-[46px]">
      <div className="flex items-baseline gap-3.5">
        <h2 className="m-0 font-display text-[25px] font-medium tracking-[-0.01em]">
          {title}
        </h2>
        <span className="h-px flex-1 bg-bone-2" />
        <span className="text-[13px] text-mute">{games.length} jogos</span>
      </div>
      <div className="mt-[18px] grid gap-3.5 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
        {games.map((g) => (
          <TodayCard key={g.id} game={g} />
        ))}
      </div>
    </section>
  );
}

function TodayCard({ game }: { game: EnrichedGame }) {
  return (
    <div className="relative rounded-2xl border border-bone-2 bg-paper px-5 py-[18px]">
      {game.isPreferred && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl border-[1.5px] border-clay" />
      )}
      <div className="mb-3.5 flex items-center justify-between">
        <span className="font-mono text-[13px] font-medium text-mute-2">
          {game.timeLabel} · BRT
        </span>
        {game.isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-clay-border-strong bg-clay-bg-strong px-2.5 py-[3px]">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-clay" />
            <span className="text-[10px] font-bold tracking-[0.08em] text-clay-deep">
              AO VIVO
            </span>
          </span>
        )}
        {game.showPrefBadge && (
          <span className="rounded-full border border-clay-border bg-clay-bg px-2.5 py-[3px] text-[10px] font-semibold text-clay-deep">
            Sua seleção
          </span>
        )}
      </div>
      <div className="flex flex-col gap-[11px]">
        <Row team={game.home} />
        <Row team={game.away} />
      </div>
      <div className="mt-3.5 flex items-center justify-between gap-2.5 border-t border-bone-3 pt-3">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-mute">
          {game.city}
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {game.broadcasters.length > 0 ? (
            game.broadcasters.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center rounded-[7px] border border-clay-border bg-clay-bg px-2 py-[3px] text-xs font-semibold text-clay-deep"
              >
                {b.name}
              </span>
            ))
          ) : (
            <span className="rounded-[7px] border border-bone-2 bg-paper px-2 py-[3px] text-xs text-mute">
              Sem transmissão
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ team }: { team: EnrichedGame["home"] }) {
  return (
    <div className="flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={flagUrl(team.code)}
        alt={team.name}
        width={34}
        height={24}
        className="h-6 w-[34px] rounded-[4px] border border-ink/10 object-cover"
      />
      <span className="font-display text-[19px]">{team.name}</span>
    </div>
  );
}
