import type { Metadata } from "next";
import SkupAccount from "@/components/SkupAccount";

export const metadata: Metadata = {
  title: "LUKMA — My account",
  description: "Manage LUKMA bookings, favorites and rewards.",
};

export default function AccountPage() {
  return <SkupAccount />;
}
