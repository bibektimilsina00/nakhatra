import { proxy } from "@/lib/api/proxy";

export async function POST(req: Request, ctx: { params: Promise<{ grant_id: string }> }) {
  const { grant_id } = await ctx.params;
  const id = encodeURIComponent(grant_id);
  return proxy(req, `/v1/grants/${id}/revoke`);
}
