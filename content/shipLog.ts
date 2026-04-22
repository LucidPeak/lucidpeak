export type ShipLogEntry = {
  date: string;
  title: string;
  slug?: string;
};

export const shipLog: ShipLogEntry[] = [
  { date: "Apr 21", title: "dimmed cards go darker" },
  { date: "Apr 18", title: "bake terminal shape" },
  { date: "Apr 14", title: "signup terminal app", slug: "terminal" },
  { date: "Apr 08", title: "sticky drag hardened" },
  { date: "Apr 02", title: "lettermatch v1 live", slug: "lettermatch" },
];
