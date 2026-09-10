import {
  clearPublishErrors,
  forbidden,
  isAdmin,
  isPublishing,
  publishDay,
  todayInNepal,
  type Channel,
  type PublishRequest,
} from "@/lib/studio";

const CHANNELS = ["youtube", "tiktok"] as const;

/** Hand a rendered day to the connected channels — everything that is
 *  switched on, or one channel and one part by name. Runs to completion: an
 *  upload is a minute, not six. */
export async function POST(req: Request) {
  if (!(await isAdmin(req))) return forbidden();
  if (isPublishing()) {
    return Response.json({ error: { code: "busy", message: "Already publishing." } }, { status: 409 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    date?: string;
    channel?: string;
    part?: string;
    force?: boolean;
  };
  const request: PublishRequest = {
    channel: CHANNELS.includes(body.channel as Channel) ? (body.channel as Channel) : undefined,
    part: body.part === "1" || body.part === "2" ? body.part : undefined,
    force: Boolean(body.force),
  };

  try {
    const publish = await publishDay(body.date || todayInNepal(), request);
    return Response.json({ publish });
  } catch (err) {
    return Response.json(
      { error: { code: "publish_failed", message: err instanceof Error ? err.message : String(err) } },
      { status: 500 },
    );
  }
}

/** Dismiss a channel's failures for a day. Only failures: a record of
 *  something that actually posted is not the reader's to delete. */
export async function DELETE(req: Request) {
  if (!(await isAdmin(req))) return forbidden();
  const p = new URL(req.url).searchParams;
  const channel = p.get("channel");
  return Response.json({
    publish: clearPublishErrors(
      p.get("date") || todayInNepal(),
      CHANNELS.includes(channel as Channel) ? (channel as Channel) : undefined,
    ),
  });
}
