import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Depop Scraper",
  description: "Track vintage listings",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full" style={{ background: '#0a0f1a' }}>{children}</body>
    </html>
  );
}
