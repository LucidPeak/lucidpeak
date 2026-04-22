export function Footer() {
  return (
    <footer className="flex items-baseline justify-between gap-4 pb-8 pt-6 text-xs text-zinc-500 sm:pt-8">
      <span>© {new Date().getFullYear()} lucidpeak</span>
      <a
        href="mailto:lucidpeak@proton.me"
        className="underline-offset-4 hover:underline"
      >
        lucidpeak@proton.me
      </a>
    </footer>
  );
}
