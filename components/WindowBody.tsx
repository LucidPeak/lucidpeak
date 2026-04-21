import type { App } from "@/content/apps";
import { AppMark } from "./AppMark";
import { LettermatchCard } from "./cards/LettermatchCard";
import { IssueAggregatorCard } from "./cards/IssueAggregatorCard";
import { HiRelayCard } from "./cards/HiRelayCard";
import { BuildMeThisCard } from "./cards/BuildMeThisCard";

type Props = { app: App };

function CardVisual({ slug }: { slug: string }) {
  if (slug === "lettermatch") return <LettermatchCard />;
  if (slug === "issueaggregator") return <IssueAggregatorCard />;
  if (slug === "hirelay") return <HiRelayCard />;
  if (slug === "buildmethis") return <BuildMeThisCard />;
  return null;
}

export function WindowBody({ app }: Props) {
  const live = !app.comingSoon && !!app.href;
  const badge = app.comingSoon
    ? "Coming soon"
    : app.href
      ? "Live"
      : "Launching soon";

  return (
    <div
      className="card-reveal group relative h-full overflow-hidden"
      style={{ "--accent": app.accent } as React.CSSProperties}
    >
      <div className="card-art-layer absolute inset-0">
        <CardVisual slug={app.slug} />
      </div>

      <div className="card-surface absolute inset-[10px] flex flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <AppMark app={app} size={32} />
          <span
            className={
              app.comingSoon
                ? "inline-flex items-center rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
                : "inline-flex items-center rounded-full border border-emerald-600/15 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
            }
          >
            <span
              aria-hidden
              className={`mr-1 inline-block h-1 w-1 rounded-full ${
                app.comingSoon ? "bg-zinc-400" : "bg-emerald-500 animate-pulse"
              }`}
            />
            {badge}
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-semibold tracking-tight text-zinc-950">
            {app.name}
          </h2>
          {app.tagline && (
            <p className="text-[12px] font-medium text-zinc-800">{app.tagline}</p>
          )}
          {app.pitch && (
            <p className="text-[11px] leading-[1.45] text-zinc-600">{app.pitch}</p>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          {live ? (
            <a
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center rounded-full bg-zinc-950 px-3 text-[11px] font-medium text-white transition hover:bg-zinc-800"
            >
              Visit {app.name} →
            </a>
          ) : app.href ? (
            <a
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 items-center rounded-full border border-black/10 bg-white/80 px-3 text-[11px] font-medium text-zinc-800 transition hover:bg-white"
            >
              View source →
            </a>
          ) : (
            <span className="inline-flex h-7 items-center rounded-full border border-dashed border-black/15 px-3 text-[10px] font-medium text-zinc-500">
              Link coming soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
