import { proxy } from "@/lib/api/proxy";

export async function GET(req: Request) {
  return proxy(req, "/v1/auth/me");
}

export async function PATCH(req: Request) {
  return proxy(req, "/v1/auth/me");
}
