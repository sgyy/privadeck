"use client";

import { useState, useCallback, useEffect } from "react";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { SearchDialog } from "@/components/shared/SearchDialog";
import type { ToolNavItem } from "@/lib/i18n/toolNavData";
import { ToolNavProvider } from "@/lib/i18n/ToolNavContext";

interface MainLayoutProps {
  children: React.ReactNode;
  toolNavData: ToolNavItem[];
}

export function MainLayout({ children, toolNavData }: MainLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  // Global Ctrl+K shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ToolNavProvider data={toolNavData}>
      <div className="min-h-screen flex flex-col">
        <Header
          onMenuClick={() => setMobileNavOpen(true)}
          onSearchClick={() => setSearchOpen(true)}
          toolNavData={toolNavData}
        />

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>

        <Footer toolNavData={toolNavData} />
        <MobileNav open={mobileNavOpen} onClose={closeMobileNav} toolNavData={toolNavData} />
        <SearchDialog open={searchOpen} onClose={closeSearch} toolNavData={toolNavData} />
      </div>
    </ToolNavProvider>
  );
}
