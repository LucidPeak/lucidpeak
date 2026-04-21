type Props = { size: number };

export function LettermatchIcon({ size }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="3"
        y="5"
        width="11"
        height="11"
        rx="2.2"
        fill="none"
        stroke="rgba(0,0,0,0.85)"
        strokeWidth="1.5"
      />
      <rect
        x="10"
        y="8"
        width="11"
        height="11"
        rx="2.2"
        fill="rgba(0,0,0,0.9)"
      />
      <path
        d="M12.5 13.5 L14.5 15.5 L18.5 11.5"
        stroke="#ffffff"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
