import { proxy } from "@/lib/api/proxy";

export async function GET(req: Request) {
  return proxy(req, "/v1/consultations");
}

export async function POST(req: Request) {
  return proxy(req, "/v1/consultations");
}
