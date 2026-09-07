import { proxy } from "@/lib/api/proxy";

export async function GET(req: Request, ctx: { params: Promise<{ profile_id: string }> }) {
  const { profile_id } = await ctx.params;
  return proxy(req, `/v1/practitioners/${encodeURIComponent(profile_id)}`);
}
