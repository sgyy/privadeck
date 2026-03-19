import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Media Toolbox - Free Online Media Tools",
    template: "%s | Media Toolbox",
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
