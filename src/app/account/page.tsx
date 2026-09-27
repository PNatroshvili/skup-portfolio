import type { Metadata } from "next";
import SkupAccount from "@/components/SkupAccount";

export const metadata: Metadata = {
  title: "ჩემი Skup — ჯავშნები და ფავორიტები",
  description: "მართე შენი Skup ჯავშნები, ფავორიტები და loyalty.",
};

export default function AccountPage() {
  return <SkupAccount />;
}
