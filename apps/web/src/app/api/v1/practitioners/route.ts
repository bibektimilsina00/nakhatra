import { proxy } from "@/lib/api/proxy";

/** The public directory. Filters ride the query string. */
export async function GET(req: Request) {
  return proxy(req, "/v1/practitioners");
}
