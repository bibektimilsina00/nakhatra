import { forbidden, isAdmin, isPublishing, publishDay, todayInNepal } from "@/lib/studio";

/** Hand a rendered day to the connected channels — by hand, or again after
 *  a failure. Runs to completion: an upload is a minute, not six. */
export async function POST(req: Request) {
  if (!(await isAdmin(req))) return forbidden();
  if (isPublishing()) {
    return Response.json({ error: { code: "busy", message: "Already publishing." } }, { status: 409 });
  }
  const { date } = (await req.json().catch(() => ({}))) as { date?: string };
  const publish = await publishDay(date || todayInNepal());
  return Response.json({ publish });
}
