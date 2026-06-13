import type { HeroStyle } from "@/lib/types";

interface HeroSwitcherProps {
  value: HeroStyle;
  onChange: (s: HeroStyle) => void;
}

const OPTIONS: { value: HeroStyle; label: string }[] = [
  { value: "classic", label: "Clássico" },
  { value: "editorial", label: "Editorial" },
  { value: "ticket", label: "Ingresso" },
];

export function HeroSwitcher({ value, onChange }: HeroSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-mute-3">
        Layout
      </span>
      <div className="flex gap-1 rounded-full bg-[#EAE6DA] p-1">
        {OPTIONS.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={
                active
                  ? "cursor-pointer rounded-full border-none bg-paper px-3.5 py-[7px] text-[13px] font-semibold text-clay shadow-[0_1px_2px_rgba(40,34,20,0.1)]"
                  : "cursor-pointer rounded-full border-none bg-transparent px-3.5 py-[7px] text-[13px] font-medium text-mute-2"
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
