interface LiveBadgeProps {
  size?: "sm" | "md" | "lg";
}

export function LiveBadge({ size = "md" }: LiveBadgeProps) {
  const dotSize =
    size === "sm" ? "h-1.5 w-1.5" : size === "lg" ? "h-[9px] w-[9px]" : "h-2 w-2";
  const textSize = size === "lg" ? "text-[18px]" : "text-[13px]";
  const padding = size === "lg" ? "" : "border border-clay-border-strong bg-clay-bg-strong px-4 py-[9px]";

  if (size === "lg") {
    return (
      <div className="inline-flex items-center gap-2 self-start">
        <span className={`${dotSize} animate-pulse-soft rounded-full bg-clay`} />
        <span className={`${textSize} font-bold tracking-[0.1em] text-clay-deep`}>
          AO VIVO
        </span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-full ${padding}`}>
      <span className={`${dotSize} animate-pulse-soft rounded-full bg-clay`} />
      <span className={`${textSize} font-bold tracking-[0.1em] text-clay-deep`}>
        AO VIVO
      </span>
    </div>
  );
}
