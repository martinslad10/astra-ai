import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astra AI — Your AI workspace",
  description: "A standalone workspace for reasoning, coding, and creative work.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="cs">
      <body>{children}</body>
    </html>
  );
}
