type Props = { size: number };

export function LockIcon({ size }: Props) {
  const stroke = "rgba(0,0,0,0.88)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="10"
        rx="2.2"
        stroke={stroke}
        strokeWidth="1.7"
      />
      <path
        d="M8 10.5V7.5a4 4 0 0 1 8 0v3"
        stroke={stroke}
        strokeWidth="1.7"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="12" cy="14.8" r="1.4" fill={stroke} />
      <path
        d="M12 15.8v2"
        stroke={stroke}
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
