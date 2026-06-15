"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { TopControls } from "@/components/TopControls";
import { HeroSwitcher } from "@/components/HeroSwitcher";
import { HeroClassic } from "@/components/HeroClassic";
import { HeroEditorial } from "@/components/HeroEditorial";
import { HeroTicket } from "@/components/HeroTicket";
import { TodaySection } from "@/components/TodaySection";
import { UpcomingSection } from "@/components/UpcomingSection";
import { TEAMS } from "@/lib/teams";
import { fetchGames } from "@/lib/client/api";
import { buildSchedule } from "@/lib/schedule";
import {
  computeCountdown,
  dayKey,
  formatDayMonth,
  formatTime,
} from "@/lib/format";
import type { ApiGame } from "@/lib/api-types";
import type { HeroStyle, TeamCode } from "@/lib/types";

const FALLBACK_NOW = new Date("2026-06-12T12:00:00-03:00");

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState<Date>(FALLBACK_NOW);
  const [preferred, setPreferred] = useState<TeamCode>("BRA");
  const [filter, setFilter] = useState<TeamCode | "">("");
  const [heroStyle, setHeroStyle] = useState<HeroStyle>("classic");
  const [games, setGames] = useState<ApiGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setHydrated(true);
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    fetchGames()
      .then(({ games: g }) => { setGames(g); setLoading(false); })
      .catch(() => setLoading(false));
    return () => clearInterval(id);
  }, []);

  const schedule = useMemo(
    () => buildSchedule({ now, games, preferred, filter }),
    [now, games, preferred, filter],
  );

  const countdown = useMemo(
    () => (schedule.next ? computeCountdown(schedule.next.kickoff, now) : null),
    [schedule.next, now],
  );

  const todayTitle = useMemo(() => {
    if (!schedule.next) return "";
    const isToday = dayKey(schedule.next.kickoff) === dayKey(now);
    return isToday
      ? `Ainda hoje · ${formatDayMonth(schedule.next.kickoff)}`
      : schedule.next.dayLabel;
  }, [schedule.next, now]);

  const filterActive = filter !== "";
  const filterName = filter ? TEAMS[filter].name : "";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <span className="text-sm text-mute-2">Carregando jogos…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream px-6 pb-[90px] pt-10 text-ink">
      <div className="mx-auto max-w-[1080px]">
        <Header nowLabel={hydrated ? formatTime(now) : null} />

        <TopControls
          preferred={preferred}
          filter={filter}
          onPreferredChange={setPreferred}
          onFilterChange={setFilter}
        />

        <section className="mt-[30px]">
          <div className="mb-3.5 flex flex-wrap items-end justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="inline-block h-2 w-2 rounded-full bg-clay" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-mute-2">
                Próximo jogo
              </span>
              {schedule.next?.isPreferred && (
                <span className="rounded-full border border-clay-border bg-clay-bg px-2.5 py-[3px] text-[11px] font-semibold text-clay-deep">
                  Sua seleção
                </span>
              )}
            </div>
            <HeroSwitcher value={heroStyle} onChange={setHeroStyle} />
          </div>

          {schedule.next && countdown ? (
            <>
              {heroStyle === "classic" && (
                <HeroClassic game={schedule.next} cd={countdown} hydrated={hydrated} />
              )}
              {heroStyle === "editorial" && (
                <HeroEditorial game={schedule.next} cd={countdown} hydrated={hydrated} />
              )}
              {heroStyle === "ticket" && (
                <HeroTicket game={schedule.next} cd={countdown} hydrated={hydrated} />
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-bone-soft bg-paper p-12 text-center">
              <span className="font-display text-[22px] text-mute-2">
                Nenhum jogo encontrado
                {filterActive ? ` para ${filterName}` : ""}
              </span>
              {filterActive && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setFilter("")}
                    className="cursor-pointer rounded-[10px] border-none bg-clay px-5 py-[11px] text-sm font-semibold text-[#FBF4EF]"
                  >
                    Ver todos os jogos
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <TodaySection title={todayTitle} games={schedule.today} />
        <UpcomingSection groups={schedule.upcoming} />

        <footer className="mt-12 text-center">
          <span className="text-xs text-mute-3">
            Horários no fuso de Brasília · sujeitos a alteração
          </span>
        </footer>
      </div>
    </div>
  );
}
