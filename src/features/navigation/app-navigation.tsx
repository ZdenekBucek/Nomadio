"use client";

import {
  ArrowLeft,
  BedDouble,
  BusFront,
  CalendarDays,
  CheckSquare2,
  FileText,
  LayoutDashboard,
  Map,
  MoreHorizontal,
  Plane,
  Route,
  Settings,
  StickyNote,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/app", icon: LayoutDashboard, label: "Přehled" },
  { href: "/app/trips", icon: Plane, label: "Moje cesty" },
  { icon: CalendarDays, label: "Itinerář" },
  { icon: Map, label: "Mapa" },
  { icon: WalletCards, label: "Rozpočet" },
  { icon: FileText, label: "Dokumenty" },
] as const;

const mobileItems = navigationItems.filter(({ label }) =>
  ["Přehled", "Moje cesty", "Itinerář", "Mapa", "Dokumenty"].includes(label),
);

const tripNavigationItems = [
  { icon: LayoutDashboard, label: "Přehled", section: "overview" },
  { icon: CalendarDays, label: "Itinerář", section: "itinerary" },
  { icon: Map, label: "Mapa", section: "map" },
  { icon: BedDouble, label: "Ubytování" },
  { icon: BusFront, label: "Doprava" },
  { icon: WalletCards, label: "Rozpočet" },
  { icon: FileText, label: "Dokumenty" },
  { icon: CheckSquare2, label: "Checklist" },
  { icon: StickyNote, label: "Poznámky" },
  { icon: Settings, label: "Nastavení cesty", section: "settings" },
] as const;

const mobileTripNavigationItems = [
  tripNavigationItems[0],
  tripNavigationItems[1],
  tripNavigationItems[2],
  tripNavigationItems[5],
  { icon: MoreHorizontal, label: "Více", section: "settings" },
] as const;

function tripHref(section: string | undefined, overviewHref: string) {
  if (section === "overview") return overviewHref;
  if (section === "itinerary") return `${overviewHref}/itinerary`;
  if (section === "map") return `${overviewHref}/map`;
  if (section === "settings") return `${overviewHref}/settings`;
  return undefined;
}

type AppNavigationProps = {
  mobile?: boolean;
};

export function AppNavigation({ mobile = false }: AppNavigationProps) {
  const pathname = usePathname();
  const tripMatch = pathname.match(/^\/app\/trips\/([^/]+)/);

  if (tripMatch) {
    return (
      <TripNavigation
        mobile={mobile}
        pathname={pathname}
        tripId={tripMatch[1]!}
      />
    );
  }

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
        const isActive = href
          ? href === "/app"
            ? pathname === href
            : pathname.startsWith(href)
          : false;
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
            <span>{label === "Moje cesty" && mobile ? "Cesty" : label}</span>
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

function TripNavigation({
  mobile,
  pathname,
  tripId,
}: {
  mobile: boolean;
  pathname: string;
  tripId: string;
}) {
  const items = mobile ? mobileTripNavigationItems : tripNavigationItems;
  const overviewHref = `/app/trips/${tripId}`;

  return (
    <nav
      aria-label={mobile ? "Mobilní navigace cesty" : "Navigace cesty"}
      className={mobile ? "grid grid-cols-5 gap-1" : "flex min-h-0 flex-1 flex-col gap-1.5"}
    >
      {mobile ? null : (
        <Link
          href="/app/trips"
          className="mb-3 flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted/55 hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Moje cesty
        </Link>
      )}

      {items.map(({ icon: Icon, label, ...item }) => {
        const href = tripHref("section" in item ? item.section : undefined, overviewHref);
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
              <span>{label}</span>
              {mobile ? null : (
                <span className="ml-auto text-[0.58rem] tracking-[0.12em] uppercase">Brzy</span>
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
