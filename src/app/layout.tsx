import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://martivexa.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MARTIVEXA — osobní AI pracovní prostor",
    template: "%s | MARTIVEXA",
  },
  description: "Samostatný AI pracovní prostor pro přemýšlení, programování, tvorbu obrázků, marketingové návrhy a analýzu dat.",
  applicationName: "MARTIVEXA",
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: "MARTIVEXA",
    title: "MARTIVEXA — osobní AI pracovní prostor",
    description: "Přemýšlej, tvoř a stavěj s MARTIVEXA.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "MARTIVEXA — osobní AI pracovní prostor",
    description: "Samostatný AI pracovní prostor pro přemýšlení, programování a kreativní práci.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
