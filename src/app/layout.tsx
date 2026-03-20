import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PrivaDeck - Free Online Privacy-First Tools",
    template: "%s | PrivaDeck",
  },
  description:
    "Free browser-based media tools. No uploads, no signups, 100% private.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
