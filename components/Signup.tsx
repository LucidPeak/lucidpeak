export function Signup() {
  return (
    <section
      aria-label="Updates"
      className="mx-auto flex w-full max-w-md flex-col items-center gap-1 py-6 text-center"
    >
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">
        Follow along
      </p>
      <p className="text-[13px] text-zinc-700">
        or drop a line:{" "}
        <a
          href="mailto:lucidpeak@proton.me"
          className="underline-offset-4 hover:underline"
        >
          lucidpeak@proton.me
        </a>
      </p>
    </section>
  );
}
