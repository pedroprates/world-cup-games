import type { CountdownState } from "@/lib/types";

interface CountdownProps {
  cd: CountdownState;
  variant?: "classic" | "editorial";
}

export function Countdown({ cd, variant = "classic" }: CountdownProps) {
  const big = variant === "classic";
  const numberCls = big
    ? "font-mono text-[34px] font-medium leading-none tabular-nums"
    : "font-mono text-[30px] font-medium leading-none tabular-nums";
  const labelCls = big
    ? "mt-[7px] text-[10px] font-semibold uppercase tracking-[0.1em] text-mute"
    : "mt-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-mute";
  const colonCls = big
    ? "mt-px font-mono text-[30px] text-bone-shadow-2"
    : "mt-px font-mono text-[26px] text-bone-shadow";
  const cellMin = big ? "min-w-[42px]" : "min-w-[38px]";
  const gap = big ? "gap-[9px]" : "gap-2";

  return (
    <div className={`flex items-start ${gap}`}>
      {cd.showDays && (
        <>
          <div className={`flex flex-col items-center ${cellMin}`}>
            <span className={numberCls}>{cd.d}</span>
            <span className={labelCls}>dias</span>
          </div>
          <span className={colonCls}>:</span>
        </>
      )}
      <div className={`flex flex-col items-center ${cellMin}`}>
        <span className={numberCls}>{cd.h}</span>
        <span className={labelCls}>h</span>
      </div>
      <span className={colonCls}>:</span>
      <div className={`flex flex-col items-center ${cellMin}`}>
        <span className={numberCls}>{cd.m}</span>
        <span className={labelCls}>min</span>
      </div>
      <span className={colonCls}>:</span>
      <div className={`flex flex-col items-center ${cellMin}`}>
        <span className={`${numberCls} text-clay`}>{cd.s}</span>
        <span className={labelCls}>seg</span>
      </div>
    </div>
  );
}
