import { proxy } from "@/lib/api/proxy";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ user_id: string }> },
) {
  const { user_id } = await ctx.params;
  return proxy(req, `/v1/admin/users/${encodeURIComponent(user_id)}/role`);
}
