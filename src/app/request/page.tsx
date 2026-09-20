import type { Metadata } from "next";
import { Suspense } from "react";
import ClientRequestForm from "@/components/ClientRequestForm";

export const metadata: Metadata = {
  title: "პროექტის მოთხოვნა — SKUP Studio",
  description: "SKUP Studio-ს პროექტის მოთხოვნის ფორმა",
  robots: { index: false, follow: false },
};

export default function RequestPage() {
  return (
    <Suspense fallback={<main className="client-request-shell"><div className="client-request-loading">იტვირთება…</div></main>}>
      <ClientRequestForm />
    </Suspense>
  );
}
