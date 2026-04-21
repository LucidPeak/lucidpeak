type Props = { size: number };

export function IssueAggregatorIcon({ size }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="5" cy="7" r="1.8" fill="rgba(0,0,0,0.9)" />
      <rect
        x="9"
        y="5.5"
        width="11"
        height="3"
        rx="1.3"
        fill="rgba(0,0,0,0.9)"
      />
      <circle cx="5" cy="12" r="1.2" fill="rgba(0,0,0,0.35)" />
      <rect
        x="9"
        y="10.5"
        width="7.5"
        height="3"
        rx="1.3"
        fill="rgba(0,0,0,0.6)"
      />
      <circle cx="5" cy="17" r="1.2" fill="rgba(0,0,0,0.35)" />
      <rect
        x="9"
        y="15.5"
        width="9"
        height="3"
        rx="1.3"
        fill="rgba(0,0,0,0.6)"
      />
    </svg>
  );
}
