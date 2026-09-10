import { forbidden, isAdmin, readConnections, writeConnections } from "@/lib/studio";
import { newState, tiktokAuthUrl, tiktokConfigured } from "@/lib/studio-tiktok";

/** Where to send the admin to grant the account. A POST that returns a URL
 *  rather than a redirect, because a bare navigation carries no bearer. */
export async function POST(req: Request) {
  if (!(await isAdmin(req))) return forbidden();
  if (!tiktokConfigured()) {
    return Response.json(
      { error: { code: "unconfigured", message: "TIKTOK_CLIENT_KEY / TIKTOK_CLIENT_SECRET are not set on the web server." } },
      { status: 503 },
    );
  }
  return Response.json({ url: tiktokAuthUrl(newState()) });
}

/** Forget the account. TikTok's side is revoked in the app's settings. */
export async function DELETE(req: Request) {
  if (!(await isAdmin(req))) return forbidden();
  const c = readConnections();
  delete c.tiktok;
  writeConnections(c);
  return Response.json({ ok: true });
}
