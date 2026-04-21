type Props = {
  size?: number;
  className?: string;
  accent?: string;
};

export function TerminalMark({ size = 32, className = "", accent = "#1c1b19" }: Props) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-[26%] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_10px_-4px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.05] ${className}`}
      style={{
        width: size,
        height: size,
        background: accent,
        fontFamily:
          'ui-monospace, "SF Mono", Menlo, Monaco, "Cascadia Mono", monospace',
        fontSize: size * 0.42,
        fontWeight: 600,
        letterSpacing: "-0.03em",
      }}
    >
      ›_
    </span>
  );
}
