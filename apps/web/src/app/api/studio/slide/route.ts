import { forbidden, isAdmin, STUDIO_KEY, todayInNepal } from "@/lib/studio";

/**
 * One slide's HTML, for the preview strip.
 *
 * The page fetches this with its bearer token and puts the result in an
 * iframe's `srcdoc`, which is how a keyed page gets shown without the key
 * ever reaching the browser.
 */
export async function GET(req: Request) {
  if (!(await isAdmin(req))) return forbidden();
  if (!STUDIO_KEY) return new Response("STUDIO_KEY is not set", { status: 503 });

  const p = new URL(req.url).searchParams;
  const q = new URLSearchParams({
    date: p.get("date") || todayInNepal(),
    part: p.get("part") === "2" ? "2" : "1",
    i: String(Math.min(6, Math.max(0, Number(p.get("i") || 0)))),
    key: STUDIO_KEY,
  });
  const res = await fetch(`http://127.0.0.1:${process.env.PORT || 3000}/studio/rasifal?${q}`, {
    cache: "no-store",
  });
  return new Response(await res.text(), {
    status: res.status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
