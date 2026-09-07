const API_URL =
  process.env.FASTAPI_URL || process.env.NAKHATRA_API_URL || process.env.KUNDALI_API_URL || "http://127.0.0.1:8000";

/**
 * Multipart upload, forwarded as-is.
 *
 * Not `proxy()`: that reads the body as text and sets a JSON content type,
 * which would corrupt the boundary and lose the file. The body streams through
 * with its original content type instead.
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const contentType = req.headers.get("content-type");
  try {
    const upstream = await fetch(`${API_URL}/v1/practitioners/photo`, {
      method: "POST",
      headers: {
        ...(auth ? { Authorization: auth } : {}),
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body: await req.arrayBuffer(),
    });
    return Response.json(await upstream.json(), { status: upstream.status });
  } catch (err) {
    console.error("proxy /v1/practitioners/photo failed", err);
    return Response.json(
      { error: { code: "service_unavailable", message: "Could not upload the image." } },
      { status: 502 },
    );
  }
}
