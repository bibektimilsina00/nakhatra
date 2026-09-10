import { proxy } from "@/lib/api/proxy";

/** The calendar. Public, like the rasifal. */
export async function GET(req: Request) {
  return proxy(req, "/v1/patro");
}
