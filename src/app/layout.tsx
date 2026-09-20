import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QRShield — Scan Before You Trust",
  description:
    "A privacy-first QR security scanner that detects suspicious destinations before users open them. Decode first, analyze second, visit last — entirely in your browser.",
  keywords: [
    "QR security",
    "quishing",
    "QR phishing",
    "QR scanner",
    "phishing protection",
    "privacy-first",
    "URL analyzer",
  ],
  authors: [{ name: "QRShield" }],
  // Favicon is auto-served from src/app/icon.svg + icon.png (+ apple-icon.png).
  openGraph: {
    title: "QRShield — Scan Before You Trust",
    description:
      "A pre-click security layer for QR codes: decode, analyze, understand, then decide.",
    siteName: "QRShield",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1020",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
