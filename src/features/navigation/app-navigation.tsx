"use client";

import {
  CalendarDays,
  FileText,
  LayoutDashboard,
  Map,
  Plane,
  Route,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/app", icon: LayoutDashboard, label: "Přehled" },
  { icon: Plane, label: "Moje cesty" },
  { icon: CalendarDays, label: "Itinerář" },
  { icon: Map, label: "Mapa" },
  { icon: WalletCards, label: "Rozpočet" },
  { icon: FileText, label: "Dokumenty" },
] as const;

const mobileItems = navigationItems.filter(({ label }) =>
  ["Přehled", "Moje cesty", "Itinerář", "Mapa", "Dokumenty"].includes(label),
);

type AppNavigationProps = {
  mobile?: boolean;
};

export function AppNavigation({ mobile = false }: AppNavigationProps) {
  const pathname = usePathname();
  const items = mobile ? mobileItems : navigationItems;

  return (
    <nav
      aria-label={mobile ? "Hlavní mobilní navigace" : "Hlavní navigace"}
      className={
        mobile
          ? "grid grid-cols-5 gap-1"
          : "flex min-h-0 flex-1 flex-col gap-1.5"
      }
    >
      {items.map(({ icon: Icon, label, ...item }) => {
        const href = "href" in item ? item.href : undefined;
        const isActive = href === pathname;
        const sharedClassName = cn(
          "group relative flex items-center text-sm font-medium transition-colors",
          mobile
            ? "min-h-14 flex-col justify-center gap-1 rounded-xl px-1 text-[0.62rem]"
            : "min-h-11 gap-3 rounded-xl px-3",
          isActive
            ? "border border-primary/25 bg-primary/14 text-[var(--brand-highlight)] shadow-[0_12px_30px_-22px_var(--brand-glow)]"
            : href
              ? "text-muted-foreground hover:bg-muted/55 hover:text-foreground"
              : "cursor-not-allowed text-muted-foreground/45",
        );

        if (!href) {
          return (
            <span
              key={label}
              aria-disabled="true"
              className={sharedClassName}
              title={`${label} — připravujeme`}
            >
              <Icon className={mobile ? "size-4" : "size-[1.05rem]"} aria-hidden="true" />
              <span>{label === "Moje cesty" && mobile ? "Cesty" : label}</span>
              {mobile ? null : (
                <span className="ml-auto text-[0.58rem] tracking-[0.12em] uppercase">
                  Brzy
                </span>
              )}
            </span>
          );
        }

        return (
          <Link
            key={label}
            href={href}
            className={sharedClassName}
            aria-current={isActive ? "page" : undefined}
          >
            <Icon className={mobile ? "size-4" : "size-[1.05rem]"} aria-hidden="true" />
            <span>{label}</span>
            {isActive && !mobile ? (
              <span
                className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--brand-highlight)] shadow-[0_0_12px_var(--brand-glow)]"
                aria-hidden="true"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function JourneyPlaceholder() {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Route className="size-3.5 text-primary" aria-hidden="true" />
      <span>Další moduly přidáme po malých řezech.</span>
    </div>
  );
}
