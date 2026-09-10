import {
  forbidden,
  isAdmin,
  publicConnections,
  readSettings,
  writeSettings,
  type StudioSettings,
} from "@/lib/studio";

/** What the studio is set to, and what it is connected to. */
export async function GET(req: Request) {
  if (!(await isAdmin(req))) return forbidden();
  return Response.json({
    settings: readSettings(),
    connections: publicConnections(),
  });
}

/** Change some of it. Unknown or malformed fields are ignored, not stored. */
export async function PUT(req: Request) {
  if (!(await isAdmin(req))) return forbidden();
  const patch = (await req.json().catch(() => ({}))) as Partial<StudioSettings>;
  return Response.json({ settings: writeSettings(patch) });
}
