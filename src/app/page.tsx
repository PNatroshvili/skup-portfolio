import type { Metadata } from "next";
import { LanguageProvider } from "@/components/LanguageProvider";
import LoadingOverlay from "@/components/LoadingOverlay";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Projects from "@/components/Projects";
import Services from "@/components/Services";
import HowWeWork from "@/components/HowWeWork";
import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { siteContent } from "@/lib/content";

const siteUrl = "https://skup.ge";

export const metadata: Metadata = {
  title: siteContent.meta.title.ka,
  description: siteContent.meta.description.ka,
  alternates: {
    canonical: siteUrl,
    languages: {
      ka: siteUrl,
      en: `${siteUrl}/en/`,
      "x-default": siteUrl,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: siteContent.nav.brand,
    title: siteContent.meta.title.ka,
    description: siteContent.meta.description.ka,
    locale: "ka_GE",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: siteContent.nav.brand }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteContent.meta.title.ka,
    description: siteContent.meta.description.ka,
    images: ["/og-image.png"],
  },
};

export default function Home() {
  return (
    <LanguageProvider locale="ka">
      <LoadingOverlay />
      <Header />
      <main className="flex-1">
        <Hero />
        <Projects />
        <Services />
        <HowWeWork />
        <About />
        <Contact />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
