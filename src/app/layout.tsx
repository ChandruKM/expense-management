import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chandru's Wallet - Smart Expense Management",
  description: "Smart Expense Management & Auto-Expense Deducter",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Chandru's Wallet",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#10b981",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Chandru's Wallet" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-zinc-950 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
