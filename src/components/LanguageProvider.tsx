"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { Locale, LocalizedText } from "@/lib/types";

interface LanguageContextValue {
  locale: Locale;
  t: (text: LocalizedText) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

/**
 * The locale is fixed per-route (ka at "/", en at "/en/") — each is a real,
 * separately crawlable static page with its own <title>/description/hreflang,
 * not a client-side toggle. That's what makes both languages indexable by
 * search engines instead of only whichever one happened to render first.
 *
 * `locale` is a plain prop (not read from the URL) so page.tsx / en/page.tsx
 * stay Server Components — only this provider needs to be a Client Component,
 * to supply `t()` via context to the (client) section components below it.
 */
export function LanguageProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  // The root layout's <html lang> is static ("ka"); correct it instantly on
  // the /en/ page so assistive tech and browser-translate prompts get it
  // right. Search engines rely on hreflang + actual page content for
  // language targeting, not this attribute, so it isn't SEO-load-bearing —
  // just a correctness/accessibility nicety.
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback((text: LocalizedText) => text[locale], [locale]);

  const value = useMemo(() => ({ locale, t }), [locale, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
