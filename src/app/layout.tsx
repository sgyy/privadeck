import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#06b6d4",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://privadeck.app"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
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
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "PrivaDeck - Privacy-First Online Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
