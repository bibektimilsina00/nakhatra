import { proxy } from "@/lib/api/proxy";

export async function POST(req: Request, ctx: { params: Promise<{ consultation_id: string }> }) {
  const { consultation_id } = await ctx.params;
  const id = encodeURIComponent(consultation_id);
  return proxy(req, `/v1/consultations/${id}/decline`);
}
