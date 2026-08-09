import { AlertTriangle, BedDouble, CalendarDays, Coffee, CreditCard, MapPin, Plus, Users } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { formatDateOnlyShort } from "@/lib/date-time";
import type { TripRow } from "@/lib/supabase/database.types";
import { accommodationCoverage, accommodationNights, accommodationSummary, accommodationTypeLabels, paymentStatusLabels, remainingAccommodationAmount, type AccommodationWithPlace } from "./accommodation-model";

function formatDate(value: string) { return formatDateOnlyShort(value); }

function formatMoney(value: number, currency: string | null) {
  if (!currency) return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(value);
  return new Intl.NumberFormat("cs-CZ", { currency, maximumFractionDigits: 2, minimumFractionDigits: 0, style: "currency" }).format(value);
}

export function AccommodationList({ canEdit, items, trip }: { canEdit: boolean; items: AccommodationWithPlace[]; trip: TripRow }) {
  const summary = accommodationSummary(items);
  const coverage = accommodationCoverage(items, trip.start_date, trip.end_date);
  return <>
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      <Summary label="Rezervace" value={summary.reservations} /><Summary label="Nocí v rezervacích" value={summary.nights} /><Summary label="Čeká na platbu" value={summary.pending} />
    </div>
    {coverage.gapNights || coverage.overlapCount ? <div className="mt-5 grid gap-2" aria-label="Kontrola pokrytí nocí">{coverage.gapNights ? <Warning>{coverage.gapNights === 1 ? "Chybí ubytování na 1 noc" : `Chybí ubytování na ${coverage.gapNights} nocí`}</Warning> : null}{coverage.overlapCount ? <Warning>{coverage.overlapCount === 1 ? "1 dvojice rezervací se překrývá" : `${coverage.overlapCount} dvojice rezervací se překrývají`}</Warning> : null}</div> : null}
    <div className="mt-6 grid gap-4">
      {items.length ? items.map((item) => <Link key={item.id} href={`/app/trips/${trip.id}/accommodation?edit=${item.id}`} className="block min-w-0"><Surface interactive className="min-w-0 p-4 sm:p-5"><div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-primary/12 text-primary"><BedDouble className="size-4" /></span><div className="min-w-0"><h2 className="truncate font-semibold">{item.name}</h2><p className="mt-0.5 text-xs text-muted-foreground">{accommodationTypeLabels[item.accommodation_type]} · {accommodationNights(item.check_in_date, item.check_out_date)} nocí</p></div></div><div className="mt-4 grid min-w-0 gap-2 text-sm text-muted-foreground sm:grid-cols-2"><span className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" /> {formatDate(item.check_in_date)} – {formatDate(item.check_out_date)}{item.check_in_time || item.check_out_time ? ` · ${item.check_in_time?.slice(0, 5) ?? "—"} / ${item.check_out_time?.slice(0, 5) ?? "—"}` : ""}</span><span className="flex min-w-0 items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><span className="min-w-0 truncate">{item.place?.address || item.place?.name || "Bez propojeného místa"}</span></span>{item.guest_count ? <span className="flex items-center gap-2"><Users className="size-4 text-primary" /> {item.guest_count} hostů{item.room_type ? ` · ${item.room_type}` : ""}</span> : null}<span className="flex items-center gap-2"><Coffee className="size-4 text-primary" /> Snídaně: {item.breakfast_included === null ? "neznámé" : item.breakfast_included ? "ano" : "ne"}</span></div>{item.booking_reference ? <p className="mt-3 text-xs text-muted-foreground">Rezervace: <span className="text-foreground">{item.booking_reference}</span></p> : null}{item.notes ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.notes}</p> : null}</div><AccommodationPaymentSummary item={item} /></div></Surface></Link>) : <Surface className="p-5 text-center"><BedDouble className="mx-auto size-7 text-primary" /><h2 className="mt-3 font-medium">Zatím nemáte přidané žádné ubytování.</h2>{canEdit ? <Link href={`/app/trips/${trip.id}/accommodation?new=1`} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="size-4" /> Přidat ubytování</Link> : null}</Surface>}
    </div>
  </>;
}

export function AccommodationPaymentSummary({ item }: { item: AccommodationWithPlace }) {
  const remaining = remainingAccommodationAmount(item.total_price, item.paid_amount);
  const hasPaidPart = item.paid_amount !== null && item.paid_amount > 0;
  return <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
    <StatusPill tone={item.payment_status === "paid" ? "success" : item.payment_status === "unpaid" || item.payment_status === "partially_paid" ? "warning" : "neutral"}>{paymentStatusLabels[item.payment_status]}</StatusPill>
    {item.total_price !== null ? <span className="flex items-center gap-1.5 text-sm font-medium"><CreditCard className="size-4 text-primary" /> {formatMoney(item.total_price, item.currency)}{item.payment_status === "paid" ? " · Zaplaceno" : ""}</span> : null}
    {item.payment_status !== "paid" && hasPaidPart ? <span className="text-xs text-muted-foreground">Zaplaceno {formatMoney(item.paid_amount!, item.currency)}</span> : null}
    {item.payment_status !== "paid" && remaining !== null ? <span className="text-xs text-muted-foreground">Zbývá {formatMoney(remaining, item.currency)}</span> : null}
    {item.payment_status !== "paid" && item.balance_due_date && remaining !== null && remaining > 0 ? <span className="text-xs text-muted-foreground">{hasPaidPart ? "Doplatek do" : "Splatnost"} {formatDate(item.balance_due_date)}</span> : null}
    {item.payment_status === "pay_on_site" ? <span className="text-xs text-muted-foreground">Platba na místě</span> : null}
  </div>;
}

function Summary({ label, value }: { label: string; value: number }) { return <Surface className="p-4"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></Surface>; }
function Warning({ children }: { children: React.ReactNode }) { return <div className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-sm text-amber-100"><AlertTriangle className="mt-0.5 size-4 shrink-0" />{children}</div>; }
