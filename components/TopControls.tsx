import { PREFERRED_CHIPS, TEAMS, flagUrl } from "@/lib/teams";
import type { TeamCode } from "@/lib/types";

interface TopControlsProps {
  preferred: TeamCode;
  filter: TeamCode | "";
  onPreferredChange: (code: TeamCode) => void;
  onFilterChange: (code: TeamCode | "") => void;
}

export function TopControls({
  preferred,
  filter,
  onPreferredChange,
  onFilterChange,
}: TopControlsProps) {
  const filterActive = filter !== "";
  const filterName = filter ? TEAMS[filter].name : "";
  const teamOptions = (Object.values(TEAMS) ?? [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));

  return (
    <section className="mt-6 flex flex-wrap items-start justify-between gap-x-10 gap-y-6 rounded-[18px] border border-bone bg-paper px-[22px] py-5">
      <div className="flex min-w-0 flex-1 basis-[440px] flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
            Seleção favorita
          </span>
          <span className="text-xs text-mute-3">destaque nos jogos</span>
        </div>
        <div className="flex gap-3.5 overflow-x-auto pb-1">
          {PREFERRED_CHIPS.map((code) => {
            const team = TEAMS[code];
            const active = code === preferred;
            return (
              <button
                key={code}
                type="button"
                onClick={() => onPreferredChange(code)}
                title={team.name}
                className="flex w-14 flex-none cursor-pointer flex-col items-center gap-[7px] border-none bg-transparent p-0.5"
              >
                <span className="relative block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={flagUrl(code)}
                    alt={team.name}
                    width={44}
                    height={44}
                    className="block h-11 w-11 rounded-full border border-ink/10 object-cover"
                  />
                  {active && (
                    <span className="pointer-events-none absolute -inset-1 rounded-full border-2 border-clay" />
                  )}
                </span>
                <span className="max-w-14 truncate text-center text-[11px] text-mute-2">
                  {team.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-none flex-col gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">
          Filtrar por seleção
        </span>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => onFilterChange(e.target.value as TeamCode | "")}
              className="min-w-[210px] cursor-pointer appearance-none rounded-[10px] border border-bone-warm-3 bg-bone-cool py-[11px] pl-3.5 pr-10 text-sm font-medium text-ink"
            >
              <option value="">Todas as seleções</option>
              {teamOptions.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-mute">
              ▾
            </span>
          </div>
          {filterActive && (
            <button
              type="button"
              onClick={() => onFilterChange("")}
              className="cursor-pointer border-none bg-transparent text-[13px] text-clay-deep underline underline-offset-2"
            >
              limpar
            </button>
          )}
        </div>
        {filterActive && (
          <span className="text-xs text-clay-deep">
            Mostrando apenas {filterName}
          </span>
        )}
      </div>
    </section>
  );
}
