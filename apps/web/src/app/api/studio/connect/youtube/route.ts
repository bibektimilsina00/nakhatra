import { forbidden, isAdmin, readConnections, writeConnections } from "@/lib/studio";
import { authUrl, newState } from "@/lib/studio-youtube";

/** Where to send the admin to grant the channel. A POST that returns a URL
 *  rather than a redirect, because a bare navigation carries no bearer. */
export async function POST(req: Request) {
  if (!(await isAdmin(req))) return forbidden();
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return Response.json(
      { error: { code: "unconfigured", message: "GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set on the web server." } },
      { status: 503 },
    );
  }
  return Response.json({ url: authUrl(newState()) });
}

/** Forget the channel. Google's side is revoked at myaccount.google.com. */
export async function DELETE(req: Request) {
  if (!(await isAdmin(req))) return forbidden();
  const c = readConnections();
  delete c.youtube;
  writeConnections(c);
  return Response.json({ ok: true });
}
