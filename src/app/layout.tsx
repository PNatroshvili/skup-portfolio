import type { Metadata } from "next";
import { Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { siteContent } from "@/lib/content";

// Georgian-first typography: a serif for display headings, a sans for text.
const georgianSans = Noto_Sans_Georgian({
  variable: "--font-georgian-sans",
  subsets: ["georgian", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const georgianSerif = Noto_Serif_Georgian({
  variable: "--font-georgian-serif",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: siteContent.meta.title.ka,
  description: siteContent.meta.description.ka,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ka"
      className={`${georgianSans.variable} ${georgianSerif.variable} h-full`}
    >
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
