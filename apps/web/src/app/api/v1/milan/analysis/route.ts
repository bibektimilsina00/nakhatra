import { proxy } from "@/lib/api/proxy";

/** The model's reading of a match. Prompt and parsing live in `modules/milan/`. */
export async function POST(req: Request) {
  return proxy(req, "/v1/milan/analysis");
}
