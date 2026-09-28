import type { Metadata } from "next";
import SkupManager from "@/components/SkupManager";

export const metadata: Metadata = {
  title: "LUKMA — რესტორნის მართვა",
  description: "LUKMA რესტორნის მენეჯერის სივრცე.",
};

export default function ManagerPage() {
  return <SkupManager />;
}
