import { readConnections, writeConnections } from "@/lib/studio";
import { exchangeCode, takeState } from "@/lib/studio-youtube";

/**
 * Google sends the admin back here with a code. No bearer on a redirect, so
 * the `state` minted by the POST above is the proof it was us who asked.
 */
export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const back = (msg: string, ok = false) =>
    Response.redirect(new URL(`/admin/studio?${ok ? "connected" : "error"}=${encodeURIComponent(msg)}`, req.url), 302);

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
