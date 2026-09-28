import type { Metadata } from "next";
import SkupHome from "@/components/SkupHome";

export const metadata: Metadata = {
  title: "Skup — აღმოაჩინე და დაჯავშნე საუკეთესო რესტორნები",
  description: "თბილისის რესტორნების აღმოჩენა, რუკა და მაგიდის დაჯავშნა ერთ სივრცეში.",
  alternates: { canonical: "https://lukma.skup.ge/" },
};

export default function Home() {
  return <SkupHome />;
}
