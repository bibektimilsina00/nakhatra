import { readFileSync } from "node:fs";
import { join } from "node:path";

import { dirFor, forbidden, isAdmin, todayInNepal } from "@/lib/studio";

/** A rendered file, for the admin page to preview or download.
 *
 *  The name is matched against a whitelist rather than sanitised: this reads
 *  a path off a query string, and "strip the ../" is the kind of cleverness
 *  that turns into a directory traversal a year later.
 */
const NAME = /^rasifal-\d{4}-\d{2}-\d{2}-part[12](-caption\.txt|\.mp4)$/;

export async function GET(req: Request) {
  if (!(await isAdmin(req))) return forbidden();

  const params = new URL(req.url).searchParams;
  const name = params.get("name") || "";
  const date = params.get("date") || todayInNepal();
  if (!NAME.test(name)) return new Response("Not found", { status: 404 });

  try {
    const body = readFileSync(join(dirFor(date), name));
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": name.endsWith(".mp4") ? "video/mp4" : "text/plain; charset=utf-8",
        "Content-Length": String(body.length),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
