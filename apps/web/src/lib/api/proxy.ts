import { NextResponse } from "next/server";

export const API_URL = process.env.FASTAPI_URL || process.env.NAKHATRA_API_URL || process.env.KUNDALI_API_URL || "http://127.0.0.1:8000";

/**
 * Forward a request to FastAPI unchanged.
 *
 * One helper rather than a copy per route: the auth forwarding, the error shape
 * and the rule that upstream detail never reaches the client are decisions that
 * must be identical everywhere, and six copies is six chances to diverge.
 *
 * The body is passed through as text. Re-parsing and re-serialising it would
 * make this route a place where a field can be dropped — which is exactly the
 * bug that made `/api/v1/kundali` silently fall back to spawning Python for
 * every chart.
 */
export async function proxy(req: Request, path: string): Promise<NextResponse> {
  try {
    const auth = req.headers.get("authorization");
    // Query strings are forwarded. Without this a filtered request arrived
    // upstream unfiltered and returned everything — which reads as "the filter
    // does nothing" rather than as an error. `/places` had already hand-rolled
    // its own route to work around it.
    const search = new URL(req.url).search;
    const res = await fetch(`${API_URL}${path}${search}`, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      ...(req.method === "GET" || req.method === "HEAD"
        ? {}
        : { body: await req.text() }),
    });

    const text = await res.text();
    if (!text) return new NextResponse(null, { status: res.status });

    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      // Upstream sent something that is not JSON — a gateway error page, say.
      // Do not forward it; it is not the error envelope clients parse.
      console.error(`proxy ${path}: non-JSON response (${res.status})`);
      return NextResponse.json(
        { error: { code: "bad_gateway", message: "Unexpected response from the server." } },
        { status: 502 },
      );
    }
  } catch (err) {
    // Detail stays server-side: it can carry birth data and internal hostnames.
    console.error(`proxy ${path} failed`, err);
    return NextResponse.json(
      { error: { code: "service_unavailable", message: "Could not reach the server." } },
      { status: 502 },
    );
  }
}
