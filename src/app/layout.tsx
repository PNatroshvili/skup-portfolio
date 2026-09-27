import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const siteFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = "https://lukma.skup.ge";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "LUKMA — Discover and book the best restaurants in Tbilisi",
  description: "LUKMA — discover Tbilisi restaurants, explore the map, and book a table in one place.",
  alternates: { canonical: siteUrl },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "LUKMA",
    title: "LUKMA — Restaurants and bookings in Tbilisi",
    description: "Discover, save, and book.",
    images: [{url:"/og-image.svg",width:1200,height:630,alt:"LUKMA"}],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={siteFont.className}>
      <body>{children}</body>
    </html>
  );
}
