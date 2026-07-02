"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

/** Derives breadcrumbs from the URL path (e.g. /assistants → Home / Assistants). */
export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label = seg
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return { href, label };
  });

  return (
    <nav className="hidden items-center gap-1.5 text-sm text-muted-foreground sm:flex">
      {crumbs.map((c, i) => (
        <React.Fragment key={c.href}>
          {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
          {i === crumbs.length - 1 ? (
            <span className="font-medium text-foreground">{c.label}</span>
          ) : (
            <Link href={c.href} className="hover:text-foreground">
              {c.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
