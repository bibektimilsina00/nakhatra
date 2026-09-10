import { proxy } from "@/lib/api/proxy";

/** The day's rasifal. Public — no birth data, no token. */
export async function GET(req: Request) {
  return proxy(req, "/v1/rasifal");
}
