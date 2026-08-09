import { ArrowRight, BusFront, CalendarClock, CreditCard, MapPin, Plus, Route } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import type { TripRow } from "@/lib/supabase/database.types";
import { bookingStatusLabels, firstDeparture, lastArrival, remainingTransportAmount, transportPaymentStatusLabels, transportSummary, transportTypeLabels, type TransportBookingWithSegments } from "./transport-model";

const dueDateFormatter = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", year: "numeric", timeZone: "UTC" });
function formatDueDate(value: string) { return dueDateFormatter.format(new Date(`${value}T00:00:00Z`)); }

function formatDateTime(value: string | null, timezone: string) {
  if (!value) return "Bez termínu";
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", hour: "2-digit", minute: "2-digit", month: "short", timeZone: timezone, year: "numeric" }).format(new Date(value));
}

function formatMoney(value: number, currency: string | null) {
  if (!currency) return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(value);
  return new Intl.NumberFormat("cs-CZ", { currency, maximumFractionDigits: 2, minimumFractionDigits: 0, style: "currency" }).format(value);
}

export function TransportList({ canEdit, items, trip }: { canEdit: boolean; items: TransportBookingWithSegments[]; trip: TripRow }) {
  const summary = transportSummary(items);
  return <>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Summary label="Rezervace" value={String(summary.bookings)} />
      <Summary label="Segmenty" value={String(summary.segments)} />
      <Summary label="Čeká na platbu" value={String(summary.pendingPayments)} />
      <Summary label="Nejbližší přesun" value={summary.nearestMovement ? formatDateTime(summary.nearestMovement, trip.timezone) : "—"} compact />
    </div>
    <div className="mt-6 grid gap-4">{items.length ? items.map((item) => <TransportCard item={item} key={item.id} trip={trip} />) : <Surface className="p-5 text-center"><BusFront className="mx-auto size-7 text-primary" /><h2 className="mt-3 font-medium">Zatím nemáte přidanou žádnou dopravu.</h2>{canEdit ? <Link href={`/app/trips/${trip.id}/transport?new=1`} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="size-4" /> Přidat dopravu</Link> : null}</Surface>}</div>
  </>;
}

function TransportCard({ item, trip }: { item: TransportBookingWithSegments; trip: TripRow }) {
  const first = item.segments[0] ?? null;
  const last = item.segments[item.segments.length - 1] ?? null;
  const departure = firstDeparture(item);
  const arrival = lastArrival(item);
  const remaining = remainingTransportAmount(item.total_price, item.paid_amount);
  const hasPaidPart = item.paid_amount !== null && item.paid_amount > 0;
  return <Link href={`/app/trips/${trip.id}/transport?edit=${item.id}`} className="block min-w-0"><Surface interactive className="min-w-0 p-4 sm:p-5"><div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0 flex-1"><div className="flex min-w-0 flex-wrap items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><BusFront className="size-5" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.title}</h2><StatusPill tone={item.status === "cancelled" ? "danger" : item.status === "completed" ? "success" : "neutral"}>{bookingStatusLabels[item.status]}</StatusPill></div><p className="mt-1 text-xs text-muted-foreground">{transportTypeLabels[item.transport_type]}{item.provider ? ` · ${item.provider}` : ""}{item.booking_reference ? ` · ${item.booking_reference}` : ""}</p></div></div>
      <div className="mt-4 grid min-w-0 gap-2 text-sm text-muted-foreground sm:grid-cols-2"><span className="flex items-start gap-2"><CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" /><span><span className="block">{formatDateTime(departure, trip.timezone)}</span>{arrival ? <span className="mt-0.5 block text-xs">až {formatDateTime(arrival, trip.timezone)}</span> : null}</span></span><span className="flex min-w-0 items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block truncate">{first?.departurePlace?.name ?? "Neurčené místo"}</span><span className="flex items-center gap-1 text-xs"><ArrowRight className="size-3" /> {last?.arrivalPlace?.name ?? "Neurčené místo"}</span></span></span><span className="flex items-center gap-2"><Route className="size-4 text-primary" /> {item.segments.length} {item.segments.length === 1 ? "segment" : item.segments.length < 5 ? "segmenty" : "segmentů"}</span>{item.notes ? <span className="line-clamp-2 sm:col-span-2">{item.notes}</span> : null}</div></div>
      <div className="flex shrink-0 flex-col items-start gap-1.5 lg:items-end"><StatusPill tone={item.payment_status === "paid" ? "success" : item.payment_status === "unpaid" || item.payment_status === "partially_paid" ? "warning" : "neutral"}>{transportPaymentStatusLabels[item.payment_status]}</StatusPill>{item.total_price !== null ? <span className="flex items-center gap-1.5 text-sm font-medium"><CreditCard className="size-4 text-primary" /> {formatMoney(item.total_price, item.currency)}{item.payment_status === "paid" ? " · Zaplaceno" : ""}</span> : null}{item.payment_status !== "paid" && hasPaidPart ? <span className="text-xs text-muted-foreground">Zaplaceno {formatMoney(item.paid_amount!, item.currency)}</span> : null}{item.payment_status !== "paid" && remaining !== null ? <span className="text-xs text-muted-foreground">Zbývá {formatMoney(remaining, item.currency)}</span> : null}{item.payment_status !== "paid" && item.balance_due_date && remaining !== null && remaining > 0 ? <span className="text-xs text-muted-foreground">{hasPaidPart ? "Doplatek do" : "Splatnost"} {formatDueDate(item.balance_due_date)}</span> : null}{item.payment_status === "pay_on_site" ? <span className="text-xs text-muted-foreground">Platba na místě</span> : null}</div></div></Surface></Link>;
}

function Summary({ compact = false, label, value }: { compact?: boolean; label: string; value: string }) { return <Surface className="min-w-0 p-4"><p className={compact ? "truncate text-sm font-semibold" : "text-2xl font-semibold"}>{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></Surface>; }
