import { RasifalPage } from "@/features/rasifal/components/rasifal-page";

export const metadata = {
  title: "आजको राशिफल · Rasifal — Nakhatra",
  description:
    "Today's rasifal for all twelve signs, computed by gochara from Nepal's own time — murti nirnaya, vedha and the transit houses, not a generated horoscope.",
};

export default function Page() {
  return <RasifalPage />;
}
