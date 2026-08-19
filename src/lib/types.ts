export type Locale = "ka" | "en";

export type LocalizedText = Record<Locale, string>;

export interface ServiceItem {
  icon: string;
  title: LocalizedText;
  description: LocalizedText;
}

export interface ProjectImages {
  desktop: string;
  tablet: string;
  mobile: string;
}

export interface ProjectItem {
  name: string;
  image: ProjectImages | "";
  description: LocalizedText;
  tech: string[];
  link: string;
}

export interface ContactLink {
  label: string;
  url: string;
}

export interface SiteContent {
  meta: {
    title: LocalizedText;
    description: LocalizedText;
    keywords: Record<Locale, string[]>;
  };
  nav: {
    brand: string;
    links: {
      about: LocalizedText;
      services: LocalizedText;
      projects: LocalizedText;
      contact: LocalizedText;
    };
  };
  hero: {
    eyebrow: LocalizedText;
    title: LocalizedText;
    subtitle: LocalizedText;
    ctaPrimary: LocalizedText;
    ctaSecondary: LocalizedText;
  };
  about: {
    title: LocalizedText;
    body: LocalizedText;
  };
  services: {
    title: LocalizedText;
    items: ServiceItem[];
  };
  projects: {
    title: LocalizedText;
    items: ProjectItem[];
  };
  contact: {
    title: LocalizedText;
    body: LocalizedText;
    email: string;
    phone?: string;
    links: ContactLink[];
  };
  footer: {
    text: LocalizedText;
  };
}
