import { ChooseKundali } from "@/features/kundali/components/choose-kundali";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  return <ChooseKundali mode={mode === "live" ? "live" : "reading"} />;
}
