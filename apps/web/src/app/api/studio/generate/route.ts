import { forbidden, isAdmin, startRender, todayInNepal } from "@/lib/studio";

/** Start the day's render. Returns at once — the job outlives the request. */
export async function POST(req: Request) {
  if (!(await isAdmin(req))) return forbidden();

  const { date } = (await req.json().catch(() => ({}))) as { date?: string };
  const day = date || todayInNepal();
  const { started, reason } = startRender(day);

  if (!started) {
    return Response.json({ error: { code: "busy", message: reason } }, { status: 409 });
  }
  return Response.json({ date: day, started: true });
}
