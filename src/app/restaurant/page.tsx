import type { Metadata } from "next";
import SkupRestaurant from "@/components/SkupRestaurant";

export const metadata: Metadata = {
  title: "რესტორანი — LUKMA",
  description: "რესტორნის დეტალები, მენიუ, მიმოხილვები და მაგიდის დაჯავშნა.",
};

export default function RestaurantPage() {
  return <SkupRestaurant />;
}
