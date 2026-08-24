export type Locale = "ka" | "en";

export type LocalizedText = Record<Locale, string>;

export interface ServiceItem {
  icon: string;
  title: LocalizedText;
  description: LocalizedText;
  /** Short capability tags, rendered as a single "A · B · C" line. */
  tags: string[];
}

export interface ProjectImages {
  desktop: string;
  tablet: string;
  mobile: string;
}

export interface ProjectItem {
  name: string;
  image: ProjectImages | "";
  eyebrow: LocalizedText;
  description: LocalizedText;
  /** e.g. "Web Design · Development · Lead Generation" — split on render. */
  tags: string[];
  link: string;
  /** Defaults to "View Project" / "პროექტის ნახვა" when omitted. */
  ctaLabel?: LocalizedText;
}

export interface ContactLink {
  label: string;
  url: string;
}

export interface WorkStep {
  title: LocalizedText;
  description: LocalizedText;
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
    title: LocalizedText;
    subtitle: LocalizedText;
    ctaPrimary: LocalizedText;
    ctaSecondary: LocalizedText;
  };
  about: {
    title: LocalizedText;
    heading: LocalizedText;
    /** Paragraphs joined with "\n\n"; rendered with whitespace-pre-line. */
    body: LocalizedText;
    statement: {
      heading: string;
      body: LocalizedText;
    };
  };
  services: {
    title: LocalizedText;
    items: ServiceItem[];
  };
  howWeWork: {
    title: LocalizedText;
    subtitle: LocalizedText;
    steps: WorkStep[];
  };
  projects: {
    title: LocalizedText;
    items: ProjectItem[];
  };
  contact: {
    title: LocalizedText;
    heading: LocalizedText;
    body: LocalizedText;
    ctaLabel: LocalizedText;
    infoLabel: LocalizedText;
    email: string;
    phone?: string;
    location: LocalizedText;
    links: ContactLink[];
    form: {
      nameLabel: LocalizedText;
      namePlaceholder: LocalizedText;
      emailLabel: LocalizedText;
      messageLabel: LocalizedText;
      messagePlaceholder: LocalizedText;
      typeLabel: LocalizedText;
      types: { value: string; label: LocalizedText }[];
      submit: LocalizedText;
    };
  };
  footer: {
    tagline: LocalizedText;
    text: LocalizedText;
  };
}
