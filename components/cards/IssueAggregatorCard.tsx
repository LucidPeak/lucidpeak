import { CodeTyper, type Line } from "./CodeTyper";

const snippet: Line[] = [
  [{ text: "// open issues w/ bounty", kind: "com" }],
  [
    { text: "const ", kind: "kw" },
    { text: "open " },
    { text: "= ", kind: "op" },
    { text: "await ", kind: "kw" },
    { text: "gh", kind: "fn" },
  ],
  [{ text: "  .repos" }],
  [{ text: "  .issues" }],
  [
    { text: "  .list({" },
    { text: " state: ", kind: "txt" },
    { text: "\"open\"", kind: "str" },
    { text: " })" },
  ],
  [
    { text: "return ", kind: "kw" },
    { text: "open.filter(hasBounty)" },
  ],
];

export function IssueAggregatorCard() {
  return <CodeTyper lines={snippet} />;
}
