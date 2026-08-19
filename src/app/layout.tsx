import type { Metadata } from "next";
import { Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/components/LanguageProvider";
import { siteContent } from "@/lib/content";

// Georgian-first typography: a serif for display headings, a sans for text.
const georgianSans = Noto_Sans_Georgian({
  variable: "--font-georgian-sans",
  subsets: ["georgian", "latin"],
  weight: ["400", "500"],
  display: "swap",
});

const georgianSerif = Noto_Serif_Georgian({
  variable: "--font-georgian-serif",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const siteUrl = "https://skup.ge";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteContent.meta.title.ka,
    template: `%s — ${siteContent.nav.brand}`,
  },
  description: siteContent.meta.description.ka,
  keywords: [...siteContent.meta.keywords.ka, ...siteContent.meta.keywords.en],
  authors: [{ name: siteContent.nav.brand }],
  alternates: {
    canonical: siteUrl,
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
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: siteContent.nav.brand,
    url: siteUrl,
    image: `${siteUrl}/og-image.png`,
    description: siteContent.meta.description.ka,
    email: siteContent.contact.email,
    telephone: siteContent.contact.phone,
    areaServed: {
      "@type": "Country",
      name: "Georgia",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tbilisi",
      addressCountry: "GE",
    },
    knowsAbout: siteContent.meta.keywords.ka,
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Services",
      itemListElement: siteContent.services.items.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title.ka,
          description: service.description.ka,
        },
      })),
    },
  };

  return (
    <html
      lang="ka"
      className={`${georgianSans.variable} ${georgianSerif.variable} h-full`}
    >
      <head>
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Cloudflare Web Analytics — privacy-first, no cookies, no consent banner needed. */}
        <script
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "3777c4832eb743baa79dcbfa2b2ebe6f"}'
        />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
