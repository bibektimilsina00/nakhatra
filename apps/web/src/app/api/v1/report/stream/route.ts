const API_URL =
  process.env.FASTAPI_URL || process.env.NAKHATRA_API_URL || process.env.KUNDALI_API_URL || "http://127.0.0.1:8000";

/**
 * Server-sent events, passed through untouched.
 *
 * Not `proxy()`: that reads the whole body with `await res.text()` before
 * replying, which would buffer the stream back into the single slow response
 * streaming exists to avoid. Here the upstream body is handed straight to the
 * client and the headers that stop intermediaries buffering are preserved.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");

  let upstream: Response;
  try {
    upstream = await fetch(`${API_URL}/v1/report/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      body: await req.text(),
      // Node's fetch buffers the response without this.
      // @ts-expect-error -- undici-only, not in the DOM lib's RequestInit.
      duplex: "half",
    });
  } catch (err) {
    // Detail stays server-side: it can carry birth data and internal hostnames.
    console.error("proxy /v1/report/stream failed", err);
    return new Response(
      JSON.stringify({ error: { code: "service_unavailable", message: "Could not reach the server." } }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!upstream.ok || !upstream.body) {
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
