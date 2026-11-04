import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://chatsladai.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ChatSLADAI — osobní AI pracovní prostor",
    template: "%s | ChatSLADAI",
  },
  description: "Samostatný AI pracovní prostor pro přemýšlení, programování, tvorbu obrázků, marketingové návrhy a analýzu dat.",
  applicationName: "ChatSLADAI",
  openGraph: {
    type: "website",
    locale: "cs_CZ",
    siteName: "ChatSLADAI",
    title: "ChatSLADAI — osobní AI pracovní prostor",
    description: "Přemýšlej, tvoř a stavěj s ChatSLADAI.",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "ChatSLADAI — osobní AI pracovní prostor",
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
