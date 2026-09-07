import { proxy } from "@/lib/api/proxy";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ kundali_id: string }> },
) {
  const { kundali_id } = await params;
  return proxy(req, `/v1/vault/kundalis/${encodeURIComponent(kundali_id)}`);
}
