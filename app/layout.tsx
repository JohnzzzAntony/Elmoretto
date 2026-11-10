import type { Metadata, Viewport } from "next";
import "@fontsource-variable/cormorant-garamond";
import "@fontsource-variable/cormorant-garamond/wght-italic.css";
import "@fontsource-variable/manrope";
import "lenis/dist/lenis.css";
import "./globals.css";
import { Motion } from "./motion";

const description = "Follow every El Moretto bean from a misty highland farm to the roaster, then to the cup in your hands. Authentic Italian coffee from Dublin.";

export const metadata: Metadata = {
  title: { default: "El Moretto | From the mountain to your morning", template: "%s | El Moretto" },
  description,
  applicationName: "El Moretto",
  openGraph: { type: "website", siteName: "El Moretto", title: "El Moretto | From the mountain to your morning", description, locale: "en_IE" },
};

export const viewport: Viewport = { themeColor: "#120c08", width: "device-width", initialScale: 1 };

export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-IE"><body id="top">{children}<Motion /></body></html>;
}
