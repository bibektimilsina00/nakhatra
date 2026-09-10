import { SITE_URL } from "@/lib/seo/site";
import { readConnections, writeConnections } from "@/lib/studio";
import { exchangeCode, takeState } from "@/lib/studio-youtube";

/**
 * Google sends the admin back here with a code. No bearer on a redirect, so
 * the `state` minted by the POST above is the proof it was us who asked.
 */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const back = (msg: string, ok = false) =>
    Response.redirect(
      // SITE_URL, not `req.url`: Caddy proxies to this container, so the
      // request's own host is localhost:3000 and sending the browser there
      // ends the connection dance on a machine that is not the user's.
      new URL(`/admin/studio?${ok ? "connected" : "error"}=${encodeURIComponent(msg)}`, SITE_URL),
      302,
    );

  if (p.get("error")) return back(p.get("error")!);
  const code = p.get("code");
  const state = p.get("state");
  if (!code || !state || !takeState(state)) return back("That connection attempt is not one this server started.");

  try {
    const { refreshToken, channel } = await exchangeCode(code);
    writeConnections({
      ...readConnections(),
      youtube: { refreshToken, channel, connectedAt: new Date().toISOString() },
    });
    return back(channel, true);
  } catch (err) {
    return back(err instanceof Error ? err.message : "Could not connect YouTube.");
  }
}
