import "./globals.css";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { Shield } from "lucide-react";
import { getAllTools } from "@/lib/registry";
import { categories } from "@/lib/registry/categories";
import type { Metadata } from "next";
import enCommon from "../../messages/en/common.json";
import { NotFound404 } from "@/components/shared/NotFound404";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: true,
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const toolNames = enCommon.toolNames as Record<
  string,
  Record<string, { name: string; description: string }>
>;

export default function RootNotFound() {
  const allTools = getAllTools();
  const tools = allTools.map((t) => ({
    slug: t.slug,
    category: t.category,
    name: toolNames[t.category]?.[t.slug]?.name ?? t.slug,
    description: toolNames[t.category]?.[t.slug]?.description ?? "",
  }));
  const cats = categories.map((c) => ({
    key: c.key,
    label: enCommon.categories[c.key as keyof typeof enCommon.categories].name,
  }));

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          {/* Static Header */}
          <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl flex h-16 items-center gap-4 px-4 lg:px-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-bold text-foreground"
              >
                <Shield className="h-6 w-6 text-primary drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
                <span>PrivaDeck</span>
              </Link>
              <nav className="hidden lg:flex items-center gap-1 ml-6">
                {cats.map((cat) => (
                  <Link
                    key={cat.key}
                    href={`/en/tools/${cat.key}`}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {cat.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
              <NotFound404 tools={tools} categories={cats} pathPrefix="/en" />
            </div>
          </main>

          {/* Static Footer */}
          <footer className="border-t border-border/50 bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 py-8 lg:px-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-bold text-foreground"
                >
                  <Shield className="h-5 w-5 text-primary" />
                  <span>PrivaDeck</span>
                </Link>
                <p className="text-sm text-muted-foreground max-w-md">
                  Privacy-first browser tools for media, PDF &amp; development.
                  All processing stays on your device.
                </p>
                <p className="text-xs text-muted-foreground">
                  © {new Date().getFullYear()} PrivaDeck. All rights reserved.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
