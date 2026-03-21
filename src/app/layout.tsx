import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PrivaDeck - Free Online Privacy-First Tools",
    template: "%s | PrivaDeck",
  },
  description:
    "Free browser-based media tools. No uploads, no signups, 100% private.",
  openGraph: {
    type: "website",
    siteName: "PrivaDeck",
    images: [
      {
        url: "https://privadeck.app/og-default.png",
        width: 1200,
        height: 630,
        alt: "PrivaDeck - Privacy-First Online Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://privadeck.app/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
