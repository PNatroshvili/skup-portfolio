import type { Metadata } from "next";
import { Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";
import "./globals.css";

const georgianSans = Noto_Sans_Georgian({
  variable: "--font-georgian-sans",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const georgianSerif = Noto_Serif_Georgian({
  variable: "--font-georgian-serif",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteUrl = "https://lukma.skup.ge";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Skup — აღმოაჩინე და დაჯავშნე საუკეთესო რესტორნები თბილისში",
  description: "თბილისის რესტორნების აღმოჩენა, რუკა და მაგიდის დაჯავშნა ერთ სივრცეში.",
  alternates: { canonical: siteUrl },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Skup",
    title: "Skup — რესტორნები და ჯავშნები თბილისში",
    description: "აღმოაჩინე, შეინახე და დაჯავშნე.",
    images: [{url:"/og-image.png",width:1200,height:630,alt:"Skup"}],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ka" className={georgianSans.variable + " " + georgianSerif.variable}>
      <body>{children}</body>
    </html>
  );
}
