"use client";

import { ArrowLeft, BedDouble, BusFront, CalendarDays, CheckSquare2, FileText, LayoutDashboard, Map, MoreHorizontal, Plane, Route, Settings, StickyNote, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavigationItem = { href: string; icon: typeof Map; label: string; soon?: boolean };
const globalNavigation: NavigationItem[] = [
  { href: "/app", icon: LayoutDashboard, label: "Přehled", soon: true },
  { href: "/app/trips", icon: Plane, label: "Moje cesty" },
  { href: "/app/calendar", icon: CalendarDays, label: "Kalendář", soon: true },
  { href: "/app/map", icon: Map, label: "Mapa", soon: true },
  { href: "/app/finance", icon: WalletCards, label: "Finance", soon: true },
  { href: "/app/documents", icon: FileText, label: "Dokumenty", soon: true },
];
const mobileGlobalNavigation: NavigationItem[] = [
  globalNavigation[0]!, { ...globalNavigation[1]!, label: "Cesty" }, globalNavigation[2]!, globalNavigation[3]!, { href: "/app/more", icon: MoreHorizontal, label: "Více" },
];
const tripNavigation = [
  { icon: LayoutDashboard, label: "Přehled", section: "overview" }, { icon: CalendarDays, label: "Itinerář", section: "itinerary" }, { icon: Map, label: "Mapa", section: "map" }, { icon: BedDouble, label: "Ubytování", section: "accommodation" }, { icon: BusFront, label: "Doprava", section: "transport" }, { icon: WalletCards, label: "Rozpočet", section: "budget" }, { icon: FileText, label: "Dokumenty", section: "documents" }, { icon: CheckSquare2, label: "Checklist", section: "checklist" }, { icon: StickyNote, label: "Poznámky", section: "notes" }, { icon: Settings, label: "Nastavení cesty", section: "settings" },
] as const;
const mobileTripNavigation = [tripNavigation[0], tripNavigation[1], tripNavigation[2], tripNavigation[5], { icon: MoreHorizontal, label: "Více", section: "settings" }] as const;

function tripHref(section: string, tripHref: string) { return section === "overview" ? tripHref : `${tripHref}/${section}`; }
function globalActive(pathname: string, href: string) { return href === "/app" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`); }
function itemClass(active: boolean, mobile: boolean) { return cn("group relative flex min-w-0 items-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary", mobile ? "min-h-14 flex-col justify-center gap-1 rounded-xl px-1 text-[0.58rem]" : "min-h-11 gap-3 rounded-xl px-3", active ? "border border-primary/25 bg-primary/14 text-[var(--brand-highlight)] shadow-[0_12px_30px_-22px_var(--brand-glow)]" : "text-muted-foreground hover:bg-muted/55 hover:text-foreground"); }

export function AppNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const tripMatch = pathname.match(/^\/app\/trips\/([^/]+)/);
  return tripMatch ? <TripNavigation mobile={mobile} pathname={pathname} tripId={tripMatch[1]!} /> : <GlobalNavigation mobile={mobile} pathname={pathname} />;
}

function GlobalNavigation({ mobile, pathname }: { mobile: boolean; pathname: string }) {
  const items = mobile ? mobileGlobalNavigation : globalNavigation;
  return <nav aria-label={mobile ? "Globální mobilní navigace" : "Globální navigace"} className={mobile ? "grid grid-cols-5 gap-1" : "flex min-h-0 flex-1 flex-col gap-1.5"}>{items.map((item) => { const Icon = item.icon; const active = globalActive(pathname, item.href); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={itemClass(active, mobile)}><Icon className={mobile ? "size-4" : "size-[1.05rem]"} aria-hidden="true" /><span>{item.label}</span>{item.soon && !mobile ? <span aria-hidden="true" className="ml-auto rounded-full border border-border px-1.5 py-0.5 text-[0.55rem] tracking-[0.1em] uppercase">Brzy</span> : null}{active && !mobile ? <ActiveRail /> : null}</Link>; })}</nav>;
}

function TripNavigation({ mobile, pathname, tripId }: { mobile: boolean; pathname: string; tripId: string }) {
  const overviewHref = `/app/trips/${tripId}`;
  const items = mobile ? mobileTripNavigation : tripNavigation;
  return <nav aria-label={mobile ? "Mobilní navigace cesty" : "Navigace cesty"} className={mobile ? "grid grid-cols-5 gap-1" : "flex min-h-0 flex-1 flex-col gap-1.5"}>{mobile ? null : <><Link href="/app/trips" className="mb-3 flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted/55 hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" /> Moje cesty</Link><Link href={overviewHref} className="mb-3 rounded-xl border border-primary/15 bg-primary/7 px-3 py-2 text-xs font-medium text-[var(--brand-highlight)]">Aktuální cesta</Link></>}{items.map((item) => { const Icon = item.icon; const href = tripHref(item.section, overviewHref); const active = item.label === "Více" ? !tripNavigation.slice(0, 6).some((primary) => tripHref(primary.section, overviewHref) === pathname) : href === pathname; return <Link key={item.label} href={href} aria-current={active ? "page" : undefined} className={itemClass(active, mobile)}><Icon className={mobile ? "size-4" : "size-[1.05rem]"} aria-hidden="true" /><span>{item.label}</span>{active && !mobile ? <ActiveRail /> : null}</Link>; })}</nav>;
}
function ActiveRail() { return <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--brand-highlight)] shadow-[0_0_12px_var(--brand-glow)]" aria-hidden="true" />; }
export function JourneyPlaceholder() { return <div className="flex items-center gap-2 text-xs text-muted-foreground"><Route className="size-3.5 text-primary" aria-hidden="true" /><span>Další moduly přidáme po malých řezech.</span></div>; }
