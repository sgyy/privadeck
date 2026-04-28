"use client";

import { Link } from "@/i18n/navigation";
import { trackToolCardClick } from "@/lib/analytics";
import type { ReactNode } from "react";

interface ToolCardLinkProps {
  category: string;
  slug: string;
  position?: number;
  from: "home" | "category" | "header_menu";
  className?: string;
  children: ReactNode;
}

export function ToolCardLink({
  category,
  slug,
  position,
  from,
  className,
  children,
}: ToolCardLinkProps) {
  return (
    <Link
      href={`/tools/${category}/${slug}`}
      className={className}
      onClick={() => trackToolCardClick(from, slug, category, position)}
    >
      {children}
    </Link>
  );
}
