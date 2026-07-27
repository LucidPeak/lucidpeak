export function Hero() {
  return (
    <header className="flex flex-col items-center gap-2 pt-10 pb-4 text-center sm:pt-14">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
        <span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-900"
        />
        lucidpeak
      </div>
      <p className="max-w-md text-sm text-zinc-500">
        Pick an app below.
      </p>
    </header>
  );
}
