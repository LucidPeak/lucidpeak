import { CodeTyper, type Line } from "./CodeTyper";

const snippet: Line[] = [
  [{ text: "// wish → built", kind: "com" }],
  [
    { text: "wishes", kind: "fn" },
    { text: ".push({" },
  ],
  [
    { text: "  title: ", kind: "txt" },
    { text: "\"ocr my pdfs\"", kind: "str" },
    { text: "," },
  ],
  [
    { text: "  by: ", kind: "txt" },
    { text: "\"@anon\"", kind: "str" },
    { text: "," },
  ],
  [
    { text: "  status: ", kind: "txt" },
    { text: "\"open\"", kind: "str" },
  ],
  [{ text: "})" }],
];

export function BuildMeThisCard() {
  return <CodeTyper lines={snippet} />;
}
