import { readFileSync } from "node:fs";
import { join } from "node:path";

import { currentJob, dirFor, filesFor, forbidden, isAdmin, todayInNepal } from "@/lib/studio";

/** How the render is going, and what it has produced so far. */
export async function GET(req: Request) {
  if (!(await isAdmin(req))) return forbidden();

  const date = new URL(req.url).searchParams.get("date") || todayInNepal();
  const job = currentJob();

  let log = "";
  try {
    // The tail is the progress bar: the script prints a line per slide. The
    // caption it also prints belongs to the page, not to the log — left in,
    // it is fourteen lines of hashtags and no progress.
    log = readFileSync(join(dirFor(date), "render.log"), "utf8")
      .split("\n")
      .filter((l) => /^(part |\/|.*[Ee]rror)/.test(l))
      .slice(-14)
      .join("\n");
  } catch {
    log = "";
  }

  return Response.json({
    date,
    running: Boolean(job && job.date === date && !job.finishedAt),
    error: job?.date === date ? job.error : undefined,
    log,
    files: filesFor(date),
  });
}
