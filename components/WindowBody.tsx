import type { App } from "@/content/apps";
import { AppMark } from "./AppMark";
import { Terminal } from "./Terminal";
import { LettermatchCard } from "./cards/LettermatchCard";
import { IssueAggregatorCard } from "./cards/IssueAggregatorCard";
import { SecretCard } from "./cards/SecretCard";

type Props = { app: App };

function CardVisual({ slug }: { slug: string }) {
  if (slug === "lettermatch") return <LettermatchCard />;
  if (slug === "issueaggregator") return <IssueAggregatorCard />;
  if (slug === "secret1" || slug === "secret2") return <SecretCard />;
  return null;
}

export function WindowBody({ app }: Props) {
  if (app.slug === "terminal") {
    return <Terminal />;
  }

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

      {app.comingSoon && (
        <span className="lock-badge" aria-hidden>
          <svg width="10" height="11" viewBox="0 0 18 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="2" y="9" width="14" height="10" rx="1.5" />
            <path d="M5 9V6a4 4 0 018 0v3" />
          </svg>
          in dev
        </span>
      )}

      <div className="card-surface absolute inset-[10px] flex min-w-0 flex-col gap-1.5 overflow-hidden p-2.5">
        <div className="flex shrink-0 items-start justify-between gap-2">
          <AppMark app={app} size={30} />
          <span
            className={
              app.comingSoon
                ? "inline-flex items-center rounded-full border border-black/10 bg-white/70 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
                : "inline-flex items-center rounded-full border border-emerald-600/15 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-700"
            }
          >
            {badge}
          </span>
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 overflow-hidden">
          <h2 className="truncate text-[15px] font-semibold tracking-tight text-zinc-950">
            {app.name}
          </h2>
          {app.tagline && (
            <p className="line-clamp-2 text-[11.5px] font-medium leading-[1.35] text-zinc-800">{app.tagline}</p>
          )}
          {app.pitch && (
            <p className="line-clamp-2 text-[10.5px] leading-[1.4] text-zinc-600">{app.pitch}</p>
          )}
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-2 pt-0.5">
          {live ? (
            <a
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-7 max-w-full items-center truncate rounded-full bg-zinc-950 px-3 text-[11px] font-medium text-white transition hover:bg-zinc-800"
            >
              Visit {app.name} →
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
