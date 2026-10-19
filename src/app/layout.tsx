import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://astra-ai-martinslad10.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MSDAI — osobní AI pracovní prostor",
    template: "%s | MSDAI",
  },
  description: "Samostatný AI pracovní prostor pro přemýšlení, programování, tvorbu obrázků, marketingové návrhy a analýzu dat.",
  applicationName: "MSDAI",
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: "MSDAI",
    title: "MSDAI — osobní AI pracovní prostor",
    description: "Přemýšlej, tvoř a stavěj s MSDAI.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "MSDAI — osobní AI pracovní prostor",
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
