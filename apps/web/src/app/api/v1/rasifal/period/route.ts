import { proxy } from "@/lib/api/proxy";

/** The week's or month's rasifal. Public, like the daily. */
export async function GET(req: Request) {
  return proxy(req, "/v1/rasifal/period");
}
