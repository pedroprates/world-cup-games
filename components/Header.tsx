interface HeaderProps {
  nowLabel: string | null;
}

export function Header({ nowLabel }: HeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-clay font-mono text-[13px] font-bold text-[#FBF4EF]">
          26
        </span>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-[21px] font-semibold tracking-[-0.01em]">
            Copa do Mundo 2026
          </span>
          <span className="text-xs text-mute">
            Guia de jogos · EUA · Canadá · México
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-bone bg-paper px-3.5 py-[7px]">
        <span className="h-[7px] w-[7px] rounded-full bg-live" />
        <span className="font-mono text-[13px] tabular-nums">
          {nowLabel ?? "--:--"}
        </span>
        <span className="text-[11px] tracking-[0.06em] text-mute">BRT</span>
      </div>
    </header>
  );
}
