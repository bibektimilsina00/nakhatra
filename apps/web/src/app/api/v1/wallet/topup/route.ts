import { proxy } from "@/lib/api/proxy";

/** Development-only upstream: FastAPI 404s this outside `ENV=local`. */
export async function POST(req: Request) {
  return proxy(req, "/v1/wallet/topup");
}
