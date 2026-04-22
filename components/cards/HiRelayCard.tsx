import { CodeTyper, type Line } from "./CodeTyper";

const snippet: Line[] = [
  [{ text: "// one idea → 5 posts", kind: "com" }],
  [
    { text: "for ", kind: "kw" },
    { text: "(const p ", kind: "txt" },
    { text: "of ", kind: "kw" },
    { text: "platforms) {" },
  ],
  [
    { text: "  const ", kind: "kw" },
    { text: "post " },
    { text: "= ", kind: "op" },
    { text: "shape", kind: "fn" },
    { text: "(idea, p)" },
  ],
  [
    { text: "  await ", kind: "kw" },
    { text: "publish", kind: "fn" },
    { text: "(post)" },
  ],
  [{ text: "}" }],
];

export function HiRelayCard() {
  return <CodeTyper lines={snippet} />;
}
