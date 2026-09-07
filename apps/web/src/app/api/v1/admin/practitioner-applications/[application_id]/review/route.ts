import { proxy } from "@/lib/api/proxy";

export async function POST(req: Request, ctx: { params: Promise<{ application_id: string }> }) {
  const { application_id } = await ctx.params;
  return proxy(req, `/v1/admin/practitioner-applications/${encodeURIComponent(application_id)}/review`);
}
