import type { App } from "@/content/apps";

type Props = {
  app: App;
  size?: number;
  className?: string;
};

export function AppMark({ app, size = 48, className = "" }: Props) {
  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-[26%] text-white font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_4px_10px_-4px_rgba(0,0,0,0.25)] ring-1 ring-black/[0.04] ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `radial-gradient(130% 130% at 25% 15%, rgba(255,255,255,0.9), rgba(255,255,255,0) 55%), #ffffff`,
      }}
    >
      {app.Icon ? <app.Icon size={Math.round(size * 0.62)} /> : app.mark}
    </span>
  );
}
