import type { Metadata } from "next";
import SkupDiscover from "@/components/SkupDiscover";

export const metadata: Metadata = {
  title: "აღმოაჩინე რესტორნები თბილისში — LUKMA",
  description: "იპოვე რესტორანი თბილისში ძიებით, სამზარეულოთი, რეიტინგითა და რუკით.",
};

export default function DiscoverPage() {
  return <SkupDiscover />;
}
