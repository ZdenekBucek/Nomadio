"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, BedDouble, BusFront, CalendarDays, CheckSquare2, FileText, LayoutDashboard, Map, MoreHorizontal, Plane, Settings, StickyNote, WalletCards } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavigationItem = { href: string; icon: typeof Map; label: string; status?: "active" | "coming-soon" };
const globalNavigation: NavigationItem[] = [
  { href: "/app", icon: LayoutDashboard, label: "Přehled" },
  { href: "/app/trips", icon: Plane, label: "Moje cesty" },
  { href: "/app/calendar", icon: CalendarDays, label: "Kalendář" },
  { href: "/app/map", icon: Map, label: "Mapa", status: "coming-soon" },
  { href: "/app/finance", icon: WalletCards, label: "Finance", status: "coming-soon" },
  { href: "/app/documents", icon: FileText, label: "Dokumenty", status: "coming-soon" },
];
const mobileGlobalNavigation: NavigationItem[] = [
  globalNavigation[0]!, { ...globalNavigation[1]!, label: "Cesty" }, globalNavigation[2]!, globalNavigation[3]!, { href: "/app/more", icon: MoreHorizontal, label: "Více" },
];
const tripNavigation = [
  { icon: LayoutDashboard, label: "Přehled", section: "overview", status: "active" }, { icon: CalendarDays, label: "Itinerář", section: "itinerary", status: "active" }, { icon: Map, label: "Mapa", section: "map", status: "active" }, { icon: BedDouble, label: "Ubytování", section: "accommodation", status: "active" }, { icon: BusFront, label: "Doprava", section: "transport", status: "active" }, { icon: WalletCards, label: "Rozpočet", section: "budget", status: "active" }, { icon: FileText, label: "Dokumenty", section: "documents", status: "active" }, { icon: CheckSquare2, label: "Checklist", section: "checklist", status: "active" }, { icon: StickyNote, label: "Poznámky", section: "notes", status: "coming-soon" }, { icon: Settings, label: "Nastavení cesty", section: "settings", status: "active" },
] as const;
const mobileTripNavigation = [tripNavigation[0], tripNavigation[1], tripNavigation[2], tripNavigation[5], { icon: MoreHorizontal, label: "Více", section: "settings", status: "active" }] as const;
const mobilePrimarySections: Set<string> = new Set(mobileTripNavigation.slice(0, 4).map((item) => item.section));
const mobileOverflowNavigation = tripNavigation.filter((item) => !mobilePrimarySections.has(item.section));

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
  return <nav aria-label={mobile ? "Globální mobilní navigace" : "Globální navigace"} className={mobile ? "grid grid-cols-5 gap-1" : "flex min-h-0 flex-1 flex-col gap-1.5"}>{items.map((item) => { const Icon = item.icon; if (item.status === "coming-soon") return <ComingSoonItem key={item.href} icon={Icon} label={item.label} mobile={mobile} />; const active = globalActive(pathname, item.href); return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={itemClass(active, mobile)}><Icon className={mobile ? "size-4" : "size-[1.05rem]"} aria-hidden="true" /><span>{item.label}</span>{active && !mobile ? <ActiveRail /> : null}</Link>; })}</nav>;
}

function TripNavigation({ mobile, pathname, tripId }: { mobile: boolean; pathname: string; tripId: string }) {
  const overviewHref = `/app/trips/${tripId}`;
  const items = mobile ? mobileTripNavigation : tripNavigation;
  const overflowActive = mobileOverflowNavigation.some((item) => tripHref(item.section, overviewHref) === pathname);
  return <nav aria-label={mobile ? "Mobilní navigace cesty" : "Navigace cesty"} className={mobile ? "grid grid-cols-5 gap-1" : "flex min-h-0 flex-1 flex-col gap-1.5"}>{mobile ? null : <Link href="/app/trips" className="mb-2 flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted/55 hover:text-foreground"><ArrowLeft className="size-4" aria-hidden="true" /> Moje cesty</Link>}{items.map((item) => { const Icon = item.icon; const href = tripHref(item.section, overviewHref); if (mobile && item.label === "Více") { return <MobileTripOverflow key="more" overviewHref={overviewHref} pathname={pathname} active={overflowActive} />; } if (item.status === "coming-soon") return <ComingSoonItem key={item.label} icon={Icon} label={item.label} mobile={mobile} />; const active = href === pathname; return <Link key={item.label} href={href} aria-current={active ? "page" : undefined} className={itemClass(active, mobile)}><Icon className={mobile ? "size-4" : "size-[1.05rem]"} aria-hidden="true" /><span>{item.label}</span>{active && !mobile ? <ActiveRail /> : null}</Link>; })}</nav>;
}

function MobileTripOverflow({ overviewHref, pathname, active }: { overviewHref: string; pathname: string; active: boolean }) {
  const [open, setOpen] = useState(false);
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger type="button" aria-label="Otevřít další části cesty" aria-controls="trip-more-navigation" className={itemClass(active, true)}>
      <MoreHorizontal className="size-4" aria-hidden="true" />
      <span>Více</span>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" />
      <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
        <Dialog.Popup id="trip-more-navigation" className="pointer-events-auto w-full rounded-t-[1.75rem] border border-border bg-sidebar p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-24px_70px_-30px_rgba(0,0,0,0.95)] outline-none data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/40" aria-hidden="true" />
          <Dialog.Title className="text-lg font-semibold">Více</Dialog.Title>
          <Dialog.Description className="sr-only">Další části této cesty</Dialog.Description>
          <div className="mt-4 grid gap-1.5">
            {mobileOverflowNavigation.map((item, index) => {
              const Icon = item.icon;
              const href = tripHref(item.section, overviewHref);
              const itemActive = href === pathname;
              if (item.status === "coming-soon") return <ComingSoonItem key={item.label} icon={Icon} label={item.label} index={index} mobile={false} />;
              return <Link key={item.label} href={href} aria-current={itemActive ? "page" : undefined} onClick={() => setOpen(false)} className={cn(itemClass(itemActive, false), index === mobileOverflowNavigation.length - 1 && "mt-2 border-t border-border pt-3")}>
                <Icon className="size-[1.05rem]" aria-hidden="true" />
                <span>{item.label}</span>
                {itemActive ? <ActiveRail /> : null}
              </Link>;
            })}
          </div>
        </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog.Root>;
}
function ComingSoonItem({ icon: Icon, index, label, mobile }: { icon: typeof Map; index?: number; label: string; mobile: boolean }) {
  return <div role="group" aria-label={`${label}, brzy`} title="Tato funkce bude dostupná později." className={cn("flex min-w-0 items-center text-sm font-medium text-muted-foreground/60", mobile ? "min-h-14 flex-col justify-center gap-1 rounded-xl px-1 text-[0.58rem]" : "min-h-11 gap-3 rounded-xl px-3", !mobile && index !== undefined && "mt-2 border-t border-border pt-3")}>
    <Icon className={mobile ? "size-4" : "size-[1.05rem]"} aria-hidden="true" />
    <span className={mobile ? "max-w-full truncate" : "truncate"}>{label}</span>
    <span aria-hidden="true" className={cn("rounded-full border border-border/70 px-1.5 py-0.5 text-[0.55rem] tracking-[0.1em] uppercase", mobile ? "" : "ml-auto")}>Brzy</span>
    <span className="sr-only">Brzy</span>
  </div>;
}
function ActiveRail() { return <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-[var(--brand-highlight)] shadow-[0_0_12px_var(--brand-glow)]" aria-hidden="true" />; }
