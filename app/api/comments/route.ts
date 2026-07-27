import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CommentPayload = {
  note: string;
  url: string;
  viewport: { w: number; h: number };
  tool?: "box" | "pen";
  rect: { x: number; y: number; w: number; h: number };
  strokes?: Array<Array<{ x: number; y: number }>> | null;
  selector: string | null;
  elementText: string | null;
};

function devOnly(): Response | null {
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not available", { status: 404 });
  }
  return null;
}

function commentsDir() {
  return path.join(process.cwd(), ".comments");
}

function safeName(file: string): string | null {
  const base = path.basename(file);
  if (base !== file) return null;
  if (!base.endsWith(".json")) return null;
  if (base.includes("..") || base.includes("/") || base.includes("\\")) return null;
  return base;
}

export async function GET() {
  const guard = devOnly();
  if (guard) return guard;

  const dir = commentsDir();
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  } catch {
    return Response.json({ entries: [] });
  }

  const entries = await Promise.all(
    files.map(async (f) => {
      try {
        const raw = await readFile(path.join(dir, f), "utf8");
        const data = JSON.parse(raw);
        return {
          file: f,
          timestamp: data.timestamp ?? null,
          note: data.note ?? "",
          url: data.url ?? "",
          tool: data.tool ?? null,
          rect: data.rect ?? null,
          selector: data.selector ?? null,
        };
      } catch {
        return null;
      }
    }),
  );

  const clean = entries
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .sort((a, b) => (b.timestamp ?? "").localeCompare(a.timestamp ?? ""));

  return Response.json({ entries: clean });
}

export async function POST(request: Request) {
  const guard = devOnly();
  if (guard) return guard;

  let payload: CommentPayload;
  try {
    payload = (await request.json()) as CommentPayload;
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  if (typeof payload?.note !== "string" || payload.note.trim() === "") {
    return Response.json({ error: "note required" }, { status: 400 });
  }
  if (payload.note.length > 5000) {
    return Response.json({ error: "note too long" }, { status: 400 });
  }

  const dir = commentsDir();
  await mkdir(dir, { recursive: true });

  const ts = new Date();
  const iso = ts.toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${iso}.json`);
  const body = {
    timestamp: ts.toISOString(),
    ...payload,
  };
  const json = JSON.stringify(body, null, 2);
  // ponytail: crude size cap so a giant strokes array can't fill the disk.
  if (json.length > 200_000) {
    return Response.json({ error: "payload too large" }, { status: 413 });
  }
  await writeFile(file, json, "utf8");

  return Response.json({ ok: true, file: path.relative(process.cwd(), file) });
}

export async function DELETE(request: Request) {
  const guard = devOnly();
  if (guard) return guard;

  let body: { file?: string };
  try {
    body = (await request.json()) as { file?: string };
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const name = body?.file ? safeName(body.file) : null;
  if (!name) {
    return Response.json({ error: "invalid file" }, { status: 400 });
  }

  try {
    await unlink(path.join(commentsDir(), name));
  } catch {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
