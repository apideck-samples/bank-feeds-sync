import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Apideck Bank Feeds Sync — Interactive Demo",
  description:
    "Push bank transactions into Xero, QuickBooks, Sage and FreshBooks through one API. A fully interactive walk-through of the Apideck Bank Feeds API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen text-ink-900 antialiased">{children}</body>
    </html>
  );
}
