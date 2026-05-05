"use client";

import { useTranslations } from "next-intl";
import { Shield, Zap, Globe } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("common");
  const tf = useTranslations("footer");
  const th = useTranslations("home");

  const aboutLinks = [
    { href: "/about", label: tf("aboutUs") },
    { href: "/how-it-works", label: tf("howItWorks") },
    { href: "/privacy", label: tf("privacy") },
    { href: "/terms", label: tf("terms") },
  ];

  return (
    <footer className="relative border-t border-border bg-muted/30">
      <div className="absolute inset-0 dot-pattern opacity-30 dark:opacity-15 pointer-events-none" />
      <div
        className="absolute inset-x-0 top-0 h-px opacity-40"
        style={{ background: "var(--gradient-primary)" }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-10 lg:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 text-2xl font-bold"
        >
          <Shield className="h-6 w-6 text-primary" />
          <span className="text-gradient">{t("siteName")}</span>
        </Link>

        {/* Tagline */}
        <p className="mt-3 text-center text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          {tf("tagline")}
        </p>

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <TrustBadge icon={<Shield className="h-4 w-4" />} label={th("featurePrivate")} />
          <TrustBadge icon={<Zap className="h-4 w-4" />} label={th("featureInstant")} />
          <TrustBadge icon={<Globe className="h-4 w-4" />} label={th("featureNoUpload")} />
        </div>

        {/* About links */}
        <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm">
          {aboutLinks.map((link, i) => (
            <span key={link.href} className="flex items-center gap-x-1">
              <Link
                href={link.href}
                className="px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {link.label}
              </Link>
              {i < aboutLinks.length - 1 && (
                <span aria-hidden className="text-border select-none">
                  &middot;
                </span>
              )}
            </span>
          ))}
        </nav>

        {/* Bottom bar */}
        <div className="mt-8 border-t border-border/50 pt-5">
          <p
            className="text-center text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            &copy; {new Date().getFullYear()} {t("siteName")}. {tf("allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-card/60 backdrop-blur-sm px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground hover:shadow-[var(--glow-primary)] transition-all duration-300">
      <span className="text-primary">{icon}</span>
      {label}
    </div>
  );
}
