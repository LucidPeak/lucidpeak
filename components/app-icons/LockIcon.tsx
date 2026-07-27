type Props = { size: number };

export function LockIcon({ size }: Props) {
  const stroke = "#d8d3c8";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
    >
      <rect width="32" height="32" rx="7" fill="#1c1b19" />
      <rect
        x="9"
        y="14.5"
        width="14"
        height="10"
        rx="2.2"
        stroke={stroke}
        strokeWidth="2"
      />
      <path
        d="M12 14.5v-3a4 4 0 0 1 8 0v3"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="19" r="1.4" fill={stroke} />
      <path
        d="M16 20v2"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
