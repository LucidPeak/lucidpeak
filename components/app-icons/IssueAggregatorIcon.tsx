type Props = { size: number };

export function IssueAggregatorIcon({ size }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="7" fill="#080808" />
      <text
        y="22"
        textAnchor="middle"
        fontFamily="ui-monospace, 'SF Mono', Menlo, Consolas, monospace"
        fontSize="18"
        fontWeight={800}
      >
        <tspan x="6" fill="#146ef5">{"{"}</tspan>
        <tspan x="16" fill="#ffffff">$</tspan>
        <tspan x="26" fill="#146ef5">{"}"}</tspan>
      </text>
    </svg>
  );
}
