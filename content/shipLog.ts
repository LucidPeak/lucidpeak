export type ShipLogEntry = {
  date: string;
  title: string;
  slug?: string;
};

export const shipLog: ShipLogEntry[] = [
  { date: "May ??", title: "secret project" },
  { date: "May 15", title: "issue aggregator", slug: "issueaggregator" },
  { date: "May 02", title: "lettermatch public release", slug: "lettermatch" },
  { date: "Apr 27", title: "lettermatch v1 live", slug: "lettermatch" },
  { date: "Apr 21", title: "signup terminal", slug: "terminal" },
];
