const API_URL =
  process.env.FASTAPI_URL || process.env.NAKHATRA_API_URL || process.env.KUNDALI_API_URL || "http://127.0.0.1:8000";

/** Streams the image back with its own content type, so <img> can render it. */
export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const upstream = await fetch(`${API_URL}/v1/practitioners/photos/${encodeURIComponent(name)}`);
  if (!upstream.ok || !upstream.body) return new Response(null, { status: upstream.status });
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
      // Named by a hash of the bytes, so it can be cached forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
