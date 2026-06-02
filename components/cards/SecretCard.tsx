import { CodeTyper, type Line } from "./CodeTyper";

// Redacted-on-purpose: same treatment for both stealth windows so neither
// leaks its domain. Reuses the studio's code-card visual language.
const snippet: Line[] = [
  [{ text: "// classified", kind: "com" }],
  [
    { text: "const ", kind: "kw" },
    { text: "████ " },
    { text: "= ", kind: "op" },
    { text: "stealth", kind: "fn" },
    { text: "()" },
  ],
  [
    { text: "  ship", kind: "fn" },
    { text: "(" },
    { text: "\"████████\"", kind: "str" },
    { text: ")" },
  ],
  [{ text: "// shipping soon", kind: "com" }],
];

export function SecretCard() {
  return <CodeTyper lines={snippet} />;
}
