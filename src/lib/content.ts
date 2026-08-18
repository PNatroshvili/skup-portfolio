import raw from "../../content/site.json";
import type { SiteContent } from "./types";

// The JSON has a leading "_readme" documentation field that isn't part of the
// typed shape — strip it out before casting.
const { _readme, ...content } = raw as typeof raw & { _readme?: string };
void _readme;

export const siteContent = content as unknown as SiteContent;
