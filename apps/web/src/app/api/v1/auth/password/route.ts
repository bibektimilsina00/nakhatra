import { proxy } from "@/lib/api/proxy";

export async function POST(req: Request) {
  return proxy(req, "/v1/auth/password");
}
