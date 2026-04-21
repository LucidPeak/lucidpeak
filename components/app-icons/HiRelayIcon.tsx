type Props = { size: number };

export function HiRelayIcon({ size }: Props) {
  const stroke = "rgba(0,0,0,0.88)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="5.5" cy="18.5" r="1.8" fill={stroke} />
      <path
        d="M5.5 14.5 A 4 4 0 0 1 9.5 18.5"
        stroke={stroke}
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M5.5 10 A 8.5 8.5 0 0 1 14 18.5"
        stroke={stroke}
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M5.5 5.5 A 13 13 0 0 1 18.5 18.5"
        stroke={stroke}
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
