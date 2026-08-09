import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  CheckSquare2,
  FileText,
  Hotel,
  Luggage,
  Plane,
  Plus,
  ReceiptText,
  Ship,
} from "lucide-react";
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { Surface } from "@/components/ui/surface";
import { formatBudgetMoney } from "@/features/budget/budget-model";
import { calendarEventTypeMeta, formatCalendarDate, type CalendarAgendaItem } from "@/features/calendar/calendar-model";
import { countryFlag } from "@/features/trips/countries";
import { formatTripDates, travelerCountLabel, tripCoverClasses } from "@/features/trips/trip-presentation";
import { tripDurationLabel, tripTimingLabel } from "@/features/trips/trip-view";
import { cn } from "@/lib/utils";

import styles from "./global-overview-dashboard.module.css";
import type { GlobalAttention, GlobalOverview } from "./global-overview-model";

export function GlobalOverviewDashboard({ data }: { data: GlobalOverview }) {
  if (!data.stats.active && !data.stats.upcoming && !data.stats.completed) return <EmptyState />;
  const trip = data.dominantTrip;
  return (
    <div className="min-w-0 space-y-5 overflow-x-clip pb-4">
      <DashboardHeader />
      {trip && data.dominantMeta ? <div data-dashboard-section="hero"><TravelHero data={data} /></div> : null}
      {data.dominantPreparation ? <div data-dashboard-section="preparation"><Preparation data={data} /></div> : null}
      <div data-dashboard-section="attention"><Attention alerts={data.alerts} /></div>
      <div className={styles.commandGrid}>
        <div className={styles.next} data-dashboard-section="next-event">{data.nextEvent ? <NextEvent item={data.nextEvent} /> : <EmptyPanel title="Další událost" message="Žádné blízké události." icon={<CalendarDays />} />}</div>
        <div className={styles.upcoming}><Upcoming items={data.upcoming} /></div>
        <div className={styles.finance} data-dashboard-section="finance"><Finance data={data} /></div>
        <div className={styles.tasks} data-dashboard-section="tasks"><Tasks data={data} /></div>
        <div className={styles.documents} data-dashboard-section="documents"><Documents data={data} /></div>
      </div>
    </div>
  );
}

function DashboardHeader() {
  return (
    <header className="flex min-w-0 flex-col gap-4 border-b border-border pb-5 pt-1 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-medium tracking-[0.22em] text-primary uppercase">Nomadio</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Přehled</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Vaše nejbližší cesta a vše podstatné, co je potřeba připravit.</p>
      </div>
      <Link href="/app/trips" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_12px_28px_-18px_var(--brand-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <Plus className="size-4" aria-hidden="true" /> Nová cesta
      </Link>
    </header>
  );
}

function TravelHero({ data }: { data: GlobalOverview }) {
  const trip = data.dominantTrip!;
  const meta = data.dominantMeta!;
  const coverStyle = trip.cover_url ? ({ backgroundImage: `url(${JSON.stringify(trip.cover_url)})` } as CSSProperties) : undefined;
  return (
    <Surface depth="panel" className={cn("relative min-w-0 overflow-hidden p-0", !trip.cover_url && tripCoverClasses[trip.cover_variant])}>
      {trip.cover_url ? <div className="absolute inset-0 bg-cover bg-center" style={coverStyle} aria-hidden="true" /> : null}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,7,18,0.94),rgba(3,7,18,0.64)_62%,rgba(3,7,18,0.32))]" aria-hidden="true" />
      <Link href={`/app/trips/${trip.id}`} className="group relative block min-h-64 p-5 outline-none focus-visible:ring-3 focus-visible:ring-primary/55 sm:p-7 lg:min-h-72 lg:p-8">
        <div className="flex min-h-[13rem] min-w-0 flex-col justify-between gap-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--brand-highlight)] uppercase">{meta.isActive ? "Právě cestujete" : "Další cesta"}</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl lg:text-5xl">{trip.name} {countryFlag(meta.countryCode) ? <span aria-hidden="true">{countryFlag(meta.countryCode)}</span> : null}</h2>
            <p className="mt-3 text-lg font-medium text-white/90">{meta.isActive && meta.dayNumber && meta.totalDays ? `Den ${meta.dayNumber} z ${meta.totalDays}` : tripTimingLabel(trip)}</p>
          </div>
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid min-w-0 gap-1.5 text-sm text-white/70">
              <p>{formatTripDates(trip.start_date, trip.end_date)}</p>
              <p>{[tripDurationLabel(trip), travelerCountLabel(meta.travelerCount)].filter(Boolean).join(" · ")}</p>
              {meta.destination ? <p className="truncate text-white/88">{meta.destination}</p> : null}
            </div>
            <span className="inline-flex min-h-10 shrink-0 items-center gap-2 text-sm font-medium text-white transition group-hover:translate-x-1">Otevřít cestu <ArrowRight className="size-4" aria-hidden="true" /></span>
          </div>
        </div>
      </Link>
    </Surface>
  );
}

function Preparation({ data }: { data: GlobalOverview }) {
  const preparation = data.dominantPreparation!;
  return (
    <section aria-labelledby="preparation-title" className="min-w-0">
      <h2 id="preparation-title" className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Připravenost cesty</h2>
      <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-3">
        <Readiness icon={<Hotel />} label="Ubytování" value={`${preparation.accommodation.complete}/${preparation.accommodation.total} nocí`} percent={preparation.accommodation.percent} />
        <Readiness icon={<CheckSquare2 />} label="Checklist" value={`${preparation.checklist.complete}/${preparation.checklist.total}`} percent={preparation.checklist.percent} />
        <Readiness icon={<FileText />} label="Dokumenty" value={`${preparation.documents.complete}/${preparation.documents.total}`} percent={preparation.documents.percent} />
      </div>
    </section>
  );
}

function Readiness({ icon, label, percent, value }: { icon: ReactNode; label: string; percent: number; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card/55 p-3.5">
      <div className="flex min-w-0 items-center gap-2 text-sm"><span className="text-[var(--brand-highlight)] [&_svg]:size-4">{icon}</span><span className="truncate font-medium">{label}</span><span className="ml-auto shrink-0 text-xs text-muted-foreground">{value}</span></div>
      <div role="progressbar" aria-label={`${label}: ${value}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

function Attention({ alerts }: { alerts: GlobalOverview["alerts"] }) {
  if (!alerts.length) return (
    <section aria-labelledby="attention-title" className="flex min-w-0 items-center gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 px-4 py-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-emerald-300"><Check className="size-4" aria-hidden="true" /></span>
      <div><h2 id="attention-title" className="text-sm font-semibold">Vše připraveno</h2><p className="mt-0.5 text-xs text-muted-foreground">Vaše cesta je připravená.</p></div>
    </section>
  );
  return (
    <section aria-labelledby="attention-title" className="min-w-0 rounded-2xl border border-amber-400/15 bg-amber-400/5 p-4">
      <div className="flex items-center gap-2"><AlertTriangle className="size-4 text-amber-300" aria-hidden="true" /><h2 id="attention-title" className="text-sm font-semibold tracking-[0.12em] uppercase">Co je potřeba dořešit</h2><span className="ml-auto text-xs text-amber-200">{alerts.length} {alerts.length === 1 ? "problém" : "problémů"}</span></div>
      <div className="mt-3 grid min-w-0 gap-2 lg:grid-cols-2">
        {alerts.slice(0, 4).map((alert) => <AttentionItem key={alert.id} alert={alert} />)}
      </div>
    </section>
  );
}

function AttentionItem({ alert }: { alert: GlobalAttention }) {
  const Icon = alert.type === "accommodation" ? BedDouble : alert.type === "payment" ? ReceiptText : alert.type === "document" ? FileText : CheckSquare2;
  return <Link href={alert.href} className="flex min-w-0 items-center gap-3 rounded-xl border border-white/6 bg-background/38 p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-400/8 text-amber-200"><Icon className="size-4" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs text-muted-foreground">{alert.tripName}</span><strong className="mt-0.5 block truncate text-sm">{alert.title}</strong><span className="mt-0.5 block text-xs text-muted-foreground">{alert.detail}</span></span><span className="shrink-0 text-xs font-medium text-[var(--brand-highlight)]">Vyřešit</span></Link>;
}

function NextEvent({ item }: { item: CalendarAgendaItem }) {
  const Icon = item.type === "transport" ? Ship : item.type.startsWith("accommodation") ? Hotel : item.type === "payment" ? ReceiptText : item.type === "task" ? CheckSquare2 : Plane;
  return <Surface depth="panel" className="h-full min-w-0 p-5 sm:p-6"><p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Další událost</p><Link href={item.href} className="group mt-5 block min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-primary"><span className="grid size-11 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-[var(--brand-highlight)]"><Icon className="size-5" aria-hidden="true" /></span><h2 className="mt-4 text-xl font-semibold tracking-[-0.03em]">{item.title}</h2><p className="mt-2 text-sm text-muted-foreground">{formatCalendarDate(item.date)}{item.startTime ? ` · ${item.startTime}` : ""}</p><p className="mt-1 text-sm text-foreground/75">{item.tripName}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-highlight)]">Otevřít <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" /></span></Link></Surface>;
}

function Upcoming({ items }: { items: CalendarAgendaItem[] }) {
  return <Surface depth="panel" className="min-w-0 p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Nadcházející</h2><Link href="/app/calendar?view=agenda" className="text-xs text-[var(--brand-highlight)]">Kalendář</Link></div>{items.length ? <div className="mt-3 divide-y divide-border">{items.map((item) => <Link key={item.id} href={item.href} className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-3 py-3 first:pt-0 last:pb-0"><span className="text-xs text-muted-foreground">{formatCalendarDate(item.date)}</span><span className="min-w-0"><span className="block truncate text-sm font-medium">{item.title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.tripName} · {calendarEventTypeMeta[item.type].label}</span></span></Link>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Žádné další blízké události.</p>}</Surface>;
}

function Finance({ data }: { data: GlobalOverview }) {
  return <Surface depth="panel" className="min-w-0 p-5">
    <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Finance</p>
    <div className="mt-4">
      <p className="text-xs text-muted-foreground">Skutečné náklady</p>
      {data.financeReality.length ? <div className="mt-2 space-y-1.5">{data.financeReality.map((summary) => <p key={summary.currency} className="flex items-baseline justify-between gap-3 text-sm"><span className="font-medium">{summary.currency}</span><strong className="tabular-nums">{formatBudgetMoney(summary.amount, summary.currency)}</strong></p>)}</div> : <p className="mt-2 text-sm text-muted-foreground">Zatím nejsou evidované náklady.</p>}
      {data.financeReality.length > 1 ? <p className="mt-2 text-[0.65rem] text-muted-foreground">Měny jsou oddělené bez FX přepočtu.</p> : null}
    </div>
    <div className="mt-5 border-t border-border pt-4">
      <p className="text-xs text-muted-foreground">Nejbližší platby</p>
      {data.payments.length ? <div className="mt-2 divide-y divide-border">{data.payments.map((item) => <Link key={item.id} href={item.href} className="block min-w-0 py-2.5 first:pt-0 last:pb-0">
        <span className="flex min-w-0 items-start justify-between gap-3"><span className="min-w-0"><span className="block truncate text-sm font-medium">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.tripName}</span></span><strong className="shrink-0 text-sm tabular-nums">{formatBudgetMoney(item.remainingAmount ?? 0, item.currency)}</strong></span>
        <span className={cn("mt-1 block text-xs", item.isOverdue ? "text-destructive" : "text-muted-foreground")}>{item.dueDate ? `${item.isOverdue ? "Po splatnosti" : "Splatnost"} ${item.dueDate}` : "Bez data splatnosti"}</span>
      </Link>)}</div> : <p className="mt-2 text-sm text-muted-foreground">Žádné zbývající platby.</p>}
    </div>
  </Surface>;
}

function Tasks({ data }: { data: GlobalOverview }) {
  return <Surface depth="panel" className="min-w-0 p-5"><p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Příprava</p>{data.openTasks.length ? <div className="mt-3 divide-y divide-border">{data.openTasks.map((task) => <Link key={task.id} href={task.href} className="flex min-w-0 gap-3 py-3 first:pt-0 last:pb-0"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-muted-foreground/45" aria-hidden="true" /><span className="min-w-0"><span className="block truncate text-sm font-medium">{task.title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{task.tripName}{task.due_date ? ` · do ${task.due_date}` : ""}{task.priority === "high" ? " · vysoká priorita" : ""}</span></span></Link>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Žádné otevřené úkoly.</p>}</Surface>;
}

function Documents({ data }: { data: GlobalOverview }) {
  return <Surface depth="panel" className="min-w-0 p-5"><p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">Dokumenty</p><div className="mt-3 flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-[var(--brand-highlight)]"><FileText className="size-4" aria-hidden="true" /></span><p className="min-w-0 text-sm text-muted-foreground">{data.documents.total ? <><strong className="text-foreground">{data.documents.total} dokumentů</strong><span className="block text-xs">{data.documents.important} důležité · {data.documents.offline} označených offline</span></> : "Žádné dokumenty."}</p></div></Surface>;
}

function EmptyPanel({ icon, message, title }: { icon: ReactNode; message: string; title: string }) {
  return <Surface depth="panel" className="h-full min-w-0 p-5"><p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">{title}</p><div className="mt-6 text-muted-foreground [&_svg]:size-6">{icon}</div><p className="mt-3 text-sm text-muted-foreground">{message}</p></Surface>;
}

function EmptyState() {
  return <div className="min-w-0"><DashboardHeader /><Surface depth="panel" className="mt-6 grid min-h-80 place-items-center overflow-hidden p-8 text-center"><div className="max-w-sm"><span className="mx-auto grid size-14 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-[var(--brand-highlight)]"><Luggage className="size-6" aria-hidden="true" /></span><h2 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">Kam vás zavede další cesta?</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Naplánujte první cestu a mějte itinerář, finance i dokumenty na jednom místě.</p><Link href="/app/trips" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground"><Plus className="size-4" aria-hidden="true" /> Vytvořit cestu</Link></div></Surface></div>;
}
