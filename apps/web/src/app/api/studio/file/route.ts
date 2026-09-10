import { forbidden, isAdmin, readStudioFile, todayInNepal, verifyFile } from "@/lib/studio";

/**
 * A rendered file, for the admin page to play, download or read.
 *
 * Two ways in. An admin's bearer token, for anything the page fetches
 * itself; or a signed URL with an expiry, for the things a `<video>` or a
 * download link has to fetch on its own — neither can carry a header.
 *
 * The name is matched against a whitelist rather than sanitised: this reads
 * a path off a query string, and "strip the ../" is the kind of cleverness
 * that turns into a directory traversal a year later.
 */
const NAME = /^rasifal-\d{4}-\d{2}-\d{2}-part[12](-caption\.txt|\.mp4)$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const name = params.get("name") || "";
  const date = params.get("date") || todayInNepal();
  if (!NAME.test(name) || !DATE.test(date)) return new Response("Not found", { status: 404 });

  const signed = verifyFile(date, name, params.get("exp") || "", params.get("sig") || "");
  if (!signed && !(await isAdmin(req))) return forbidden();

  const body = await readStudioFile(date, name).catch(() => null);
  if (!body) return new Response("Not found", { status: 404 });

  const type = name.endsWith(".mp4") ? "video/mp4" : "text/plain; charset=utf-8";
  const headers = {
    "Content-Type": type,
    // A signed URL is good for hours and the bytes never change under it;
    // an unsigned one is a one-off read for an admin.
    "Cache-Control": signed ? "private, max-age=3600" : "no-store",
    "Accept-Ranges": "bytes",
  };

  // Range, so the player can show a first frame without the last byte and
  // seeking lands where it was asked to.
  const range = req.headers.get("range");
  const match = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (match) {
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
    if (start >= body.length || start > end) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${body.length}` },
      });
    }
    const slice = body.subarray(start, end + 1);
    return new Response(new Uint8Array(slice), {
      status: 206,
      headers: {
        ...headers,
        "Content-Range": `bytes ${start}-${end}/${body.length}`,
        "Content-Length": String(slice.length),
      },
    });
  }

  return new Response(new Uint8Array(body), {
    headers: { ...headers, "Content-Length": String(body.length) },
  });
}
