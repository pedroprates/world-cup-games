import { flagUrl } from "@/lib/teams";
import type { DayGroup, EnrichedGame } from "@/lib/types";

interface UpcomingSectionProps {
  groups: DayGroup[];
}

export function UpcomingSection({ groups }: UpcomingSectionProps) {
  if (groups.length === 0) return null;
  return (
    <section className="mt-[46px]">
      <div className="flex items-baseline gap-3.5">
        <h2 className="m-0 font-display text-[25px] font-medium tracking-[-0.01em]">
          Próximos dias
        </h2>
        <span className="h-px flex-1 bg-bone-2" />
      </div>
      {groups.map((group) => (
        <div key={group.key} className="mt-[26px]">
          <div className="mb-2.5 flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-mute-2">
              {group.label}
            </span>
            <span className="h-px flex-1 bg-bone-3" />
          </div>
          <div className="flex flex-col gap-2">
            {group.games.map((g) => (
              <UpcomingRow key={g.id} game={g} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function UpcomingRow({ game }: { game: EnrichedGame }) {
  return (
    <div className="relative flex items-center gap-3.5 rounded-[14px] border border-bone-2 bg-paper px-[18px] py-3.5">
      {game.isPreferred && (
        <div className="pointer-events-none absolute inset-0 rounded-[14px] border-[1.5px] border-clay" />
      )}
      <span className="min-w-[46px] font-mono text-sm tabular-nums text-mute-2">
        {game.timeLabel}
      </span>
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2.5">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-right font-display text-[18px]">
            {game.home.name}
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(game.home.code)}
            alt={game.home.name}
            width={30}
            height={21}
            className="h-[21px] w-[30px] flex-none rounded-[4px] border border-ink/10 object-cover"
          />
        </div>
        <span className="flex-none font-mono text-[13px] text-bone-shadow-3">×</span>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={flagUrl(game.away.code)}
            alt={game.away.name}
            width={30}
            height={21}
            className="h-[21px] w-[30px] flex-none rounded-[4px] border border-ink/10 object-cover"
          />
          <span className="overflow-hidden text-ellipsis whitespace-nowrap font-display text-[18px]">
            {game.away.name}
          </span>
        </div>
      </div>
      <div className="hidden min-w-0 items-center gap-2.5 md:flex">
        <span className="max-w-[110px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-mute">
          {game.city}
        </span>
        <span className="h-[18px] w-px bg-bone-3" />
        <div className="flex gap-1.5">
          {game.broadcastersShort.length > 0 ? (
            game.broadcastersShort.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-1 rounded-[7px] border border-clay-border bg-clay-bg px-2 py-[3px] text-xs font-semibold text-clay-deep"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b.logo} alt="" width={12} height={12} className="h-3 w-3 object-contain" />
                {b.name}
              </span>
            ))
          ) : (
            <span className="rounded-[7px] border border-bone-2 bg-paper px-2 py-[3px] text-xs text-mute">
              Sem TV
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
