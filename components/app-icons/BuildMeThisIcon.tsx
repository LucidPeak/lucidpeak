type Props = { size: number };

export function BuildMeThisIcon({ size }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M11 2.5 C11.4 7.2 12.8 8.6 17.5 9 C12.8 9.4 11.4 10.8 11 15.5 C10.6 10.8 9.2 9.4 4.5 9 C9.2 8.6 10.6 7.2 11 2.5 Z"
        fill="rgba(0,0,0,0.9)"
      />
      <path
        d="M18 14 C18.2 16.3 18.7 16.8 21 17 C18.7 17.2 18.2 17.7 18 20 C17.8 17.7 17.3 17.2 15 17 C17.3 16.8 17.8 16.3 18 14 Z"
        fill="rgba(0,0,0,0.55)"
      />
    </svg>
  );
}
