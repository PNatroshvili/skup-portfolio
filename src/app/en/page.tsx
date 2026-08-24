import type { Metadata } from "next";
import { LanguageProvider } from "@/components/LanguageProvider";
import LoadingOverlay from "@/components/LoadingOverlay";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Services from "@/components/Services";
import Projects from "@/components/Projects";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import { siteContent } from "@/lib/content";

const siteUrl = "https://skup.ge";
const pageUrl = `${siteUrl}/en/`;

export const metadata: Metadata = {
  title: siteContent.meta.title.en,
  description: siteContent.meta.description.en,
  alternates: {
    canonical: pageUrl,
    languages: {
      ka: siteUrl,
      en: pageUrl,
      "x-default": siteUrl,
    },
  },
  openGraph: {
    type: "website",
    url: pageUrl,
    siteName: siteContent.nav.brand,
    title: siteContent.meta.title.en,
    description: siteContent.meta.description.en,
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: siteContent.nav.brand }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteContent.meta.title.en,
    description: siteContent.meta.description.en,
    images: ["/og-image.png"],
  },
};

export default function HomeEn() {
  return (
    <LanguageProvider locale="en">
      <LoadingOverlay />
      <Header />
      <main className="flex-1">
        <Hero />
        <About />
        <Services />
        <Projects />
        <Contact />
      </main>
      <Footer />
    </LanguageProvider>
  );
}
