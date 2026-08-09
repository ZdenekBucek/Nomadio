"use client";

import { BedDouble, CalendarDays, CheckSquare2, CircleDollarSign, Plane, Route } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Surface } from "@/components/ui/surface";
import { formatBudgetMoney } from "@/features/budget/budget-model";
import { cn } from "@/lib/utils";
import { calendarEventTypeMeta, dateKey, filterAgenda, formatCalendarDate, groupAgendaByDate, monthStart, type CalendarAgendaItem, type CalendarEventFilter, type CalendarTrip, type MonthEvent } from "./calendar-model";
import { CalendarMonth } from "./calendar-month";

type View = "month" | "agenda";
const eventFilters: { label: string; value: CalendarEventFilter }[] = [{ label: "Vše", value: "all" }, { label: "Cesty", value: "trip" }, { label: "Doprava", value: "transport" }, { label: "Ubytování", value: "accommodation" }, { label: "Platby", value: "payment" }, { label: "Úkoly", value: "task" }];
const eventIcons = { accommodation_check_in: BedDouble, accommodation_check_out: BedDouble, payment: CircleDollarSign, task: CheckSquare2, transport: Plane, trip_end: Route, trip_start: Route };

export function CalendarDashboard({ agenda = [], initialMonth, initialView = "month", monthEvents = [], trips }: { agenda?: CalendarAgendaItem[]; initialMonth?: string; initialView?: View; monthEvents?: MonthEvent[]; trips: CalendarTrip[] }) {
  const [month, setMonth] = useState(() => monthStart(initialMonth ? new Date(`${initialMonth}-01T00:00:00Z`) : new Date()));
  const [tripId, setTripId] = useState("all");
  const [eventType, setEventType] = useState<CalendarEventFilter>("all");
  const [includePast, setIncludePast] = useState(false);
  const today = dateKey(new Date());
  const visibleTrips = tripId === "all" ? trips : trips.filter((trip) => trip.id === tripId);
  const visibleAgenda = useMemo(() => filterAgenda(agenda, tripId, eventType, includePast, today), [agenda, eventType, includePast, today, tripId]);
  const upcoming = visibleAgenda.filter((item) => item.date >= today).slice(0, 3);
  const changeMonth = (nextMonth: Date) => {
    setMonth(nextMonth);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("view", "month");
    nextUrl.searchParams.set("month", dateKey(nextMonth).slice(0, 7));
    window.history.replaceState(null, "", nextUrl);
  };
  return <div className="mt-6 min-w-0 space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div role="tablist" aria-label="Režim kalendáře" className="inline-flex w-full rounded-xl border border-border bg-card/55 p-1 sm:w-auto">{(["month", "agenda"] as const).map((item) => <Link key={item} href={`/app/calendar?view=${item}${item === "month" ? `&month=${dateKey(month).slice(0, 7)}` : ""}`} role="tab" aria-selected={initialView === item} className={cn("min-h-10 flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition sm:flex-none", initialView === item ? "bg-primary/16 text-[var(--brand-highlight)] shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item === "month" ? "Měsíc" : "Agenda"}</Link>)}</div><label className="flex min-h-10 items-center gap-2 text-sm text-muted-foreground">Cesta<select value={tripId} onChange={(event) => setTripId(event.target.value)} className="min-w-0 rounded-lg border border-border bg-card px-2 py-1.5 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"><option value="all">Všechny cesty</option>{trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.name}</option>)}</select></label></div>
    {initialView === "month" ? <CalendarMonth events={tripId === "all" ? monthEvents : monthEvents.filter((item) => item.tripId === tripId)} month={month} onMonthChange={changeMonth} today={today} trips={visibleTrips} /> : <AgendaView eventType={eventType} includePast={includePast} items={visibleAgenda} onEventType={setEventType} onIncludePast={setIncludePast} upcoming={upcoming} />}
  </div>;
}

function AgendaView({ eventType, includePast, items, onEventType, onIncludePast, upcoming }: { eventType: CalendarEventFilter; includePast: boolean; items: CalendarAgendaItem[]; onEventType: (value: CalendarEventFilter) => void; onIncludePast: (value: boolean) => void; upcoming: CalendarAgendaItem[] }) {
  return <div className="space-y-5"><Surface depth="panel" className="p-4"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold">Nadcházející</h2><button type="button" onClick={() => onIncludePast(!includePast)} className="min-h-9 rounded-lg px-2 text-xs text-[var(--brand-highlight)] hover:bg-primary/10">{includePast ? "Skrýt minulost" : "Zobrazit minulost"}</button></div>{upcoming.length ? <div className="mt-3 grid gap-2 md:grid-cols-3">{upcoming.map((item) => <AgendaLink item={item} key={`upcoming-${item.id}`} compact />)}</div> : <p className="mt-2 text-sm text-muted-foreground">Žádné nadcházející události.</p>}</Surface><nav aria-label="Typ události" className="flex gap-2 overflow-x-auto pb-1">{eventFilters.map((filter) => <button type="button" key={filter.value} onClick={() => onEventType(filter.value)} aria-pressed={eventType === filter.value} className={cn("min-h-9 shrink-0 rounded-xl border px-3 text-xs font-medium", eventType === filter.value ? "border-primary/35 bg-primary/14 text-[var(--brand-highlight)]" : "border-border text-muted-foreground hover:text-foreground")}>{filter.label}</button>)}</nav>{groupAgendaByDate(items).length ? <section aria-label="Agenda" className="space-y-5">{groupAgendaByDate(items).map(([date, group]) => <div key={date}><h2 className="mb-2 text-sm font-semibold capitalize">{formatCalendarDate(date)}</h2><div className="space-y-2">{group.map((item) => <AgendaLink item={item} key={item.id} />)}</div></div>)}</section> : <Surface depth="panel" className="p-6 text-center"><CalendarDays className="mx-auto size-7 text-primary" /><p className="mt-3 text-sm text-muted-foreground">Žádné nadcházející události.</p></Surface>}</div>;
}

function AgendaLink({ compact = false, item }: { compact?: boolean; item: CalendarAgendaItem }) {
  const Icon = eventIcons[item.type]; const meta = calendarEventTypeMeta[item.type];
  return <Link href={item.href} className={cn("flex min-w-0 items-start gap-3 rounded-xl border p-3 transition hover:border-primary/35 hover:bg-muted/30", item.isOverdue ? "border-amber-300/30 bg-amber-300/5" : "border-border bg-card/60", compact && "p-2.5")}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-medium">{item.title}</span>{item.isOverdue ? <span className="rounded-full bg-amber-300/15 px-1.5 py-0.5 text-[0.6rem] font-medium text-amber-200">Po splatnosti</span> : null}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.startTime ? `${item.startTime} · ` : ""}{meta.label}{item.subtitle ? ` · ${item.subtitle}` : ""}</span>{item.amount !== null && item.currency ? <span className="mt-1 block text-xs text-foreground">{formatBudgetMoney(item.amount, item.currency)}</span> : null}</span></Link>;
}
