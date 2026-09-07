import { ConsultationRoom } from "@/features/consultations/components/consultation-room";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConsultationRoom id={id} />;
}
