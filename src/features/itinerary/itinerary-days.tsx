import { ArrowDown, ArrowRight, ArrowUp, CalendarPlus, CalendarX2, CheckCircle2, Clock3, MapPin, Pencil, Plus, Shield, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-time/date-picker";
import { StatusPill } from "@/components/ui/status-pill";
import type { ItineraryDayRow } from "@/lib/supabase/database.types";
import { formatDateOnlyLong } from "@/lib/date-time";
import { createItineraryDay, moveItineraryDay, removeItineraryDay, updateItineraryDay } from "./actions";

const control = "mt-2 h-10 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15";
const statusLabels = { plan: "Plán", confirmed: "Potvrzeno", completed: "Dokončeno" } as const;

export function ItineraryDays({ canEdit, days, tripId }: { canEdit: boolean; days: ItineraryDayRow[]; tripId: string }) {
  const dated = days.filter((day) => day.day_date).sort((a, b) => a.day_date!.localeCompare(b.day_date!));
  const undated = days.filter((day) => !day.day_date).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  return <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
    <DaySection title="Dny cesty" description="Datované dny se řadí automaticky podle kalendáře." count={dated.length} empty="Zatím nemáte žádný den přiřazený ke konkrétnímu datu.">
      {dated.map((day) => <DayCard key={day.id} canEdit={canEdit} day={day} tripId={tripId} />)}
      {canEdit ? <CreatePanel tripId={tripId} dated /> : null}
    </DaySection>
    <DaySection title="Plány bez data" description="Celé připravené dny, které můžete později vložit do kalendáře." count={undated.length} empty="Zatím nemáte žádný připravený plán bez data.">
      {undated.map((day, index) => <DayCard key={day.id} canEdit={canEdit} day={day} tripId={tripId} index={index} total={undated.length} />)}
      {canEdit ? <CreatePanel tripId={tripId} /> : null}
    </DaySection>
  </div>;
}

function DaySection({ children, count, description, empty, title }: { children: React.ReactNode; count: number; description: string; empty: string; title: string }) {
  return <section className="rounded-[1.5rem] border border-border bg-card/70 p-4 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.9)] sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div><StatusPill>{count}</StatusPill></div>
    <div className="mt-5 grid gap-3">{count === 0 ? <div className="rounded-2xl border border-dashed border-border p-5 text-sm leading-6 text-muted-foreground">{empty}</div> : null}{children}</div>
  </section>;
}

function DayCard({ canEdit, day, index, total, tripId }: { canEdit: boolean; day: ItineraryDayRow; index?: number; total?: number; tripId: string }) {
  const date = day.day_date ? formatDateOnlyLong(day.day_date) : null;
  return <article className="rounded-2xl border border-border bg-muted/22 p-4">
    <div className="flex items-start gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">{day.day_date ? <CalendarPlus className="size-5" /> : <CalendarX2 className="size-5" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{day.name}</h3>{day.is_reserve ? <StatusPill tone="warning"><Shield className="size-3" /> Rezervní</StatusPill> : null}<StatusPill tone={day.status === "completed" ? "success" : day.status === "confirmed" ? "brand" : "neutral"}>{day.status === "completed" ? <CheckCircle2 className="size-3" /> : <Clock3 className="size-3" />}{statusLabels[day.status]}</StatusPill></div><p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">{date ? <span className="capitalize">{date}</span> : <span>Bez data</span>}{day.city ? <span className="flex items-center gap-1"><MapPin className="size-3" />{day.city}</span> : null}</p></div></div>
    <Link href={`/app/trips/${tripId}/itinerary/${day.id}`} className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-xl border border-primary/25 bg-primary/8 px-3 text-sm font-medium text-[var(--brand-highlight)] transition hover:bg-primary/14">Otevřít detail dne <ArrowRight className="size-4"/></Link>
    {canEdit && day.day_date === null ? <div className="mt-4 flex gap-2"><Command tripId={tripId} dayId={day.id} direction="up" disabled={index === 0} /><Command tripId={tripId} dayId={day.id} direction="down" disabled={index === (total ?? 0) - 1} /></div> : null}
    {canEdit ? <details className="mt-3 rounded-xl border border-border bg-background/25 p-3"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium"><Pencil className="size-4 text-primary" /> Upravit den</summary><form action={updateItineraryDay} className="mt-4 grid gap-4 sm:grid-cols-2"><input type="hidden" name="tripId" value={tripId}/><input type="hidden" name="dayId" value={day.id}/><Fields day={day}/><div className="flex flex-wrap gap-2 sm:col-span-2"><Button type="submit" size="lg">Uložit změny</Button></div></form><div className="mt-4 border-t border-border pt-4"><p className="text-xs leading-5 text-muted-foreground">Odstranění je trvalé. Pokračujte pouze tehdy, pokud tento celý den už nepotřebujete.</p><form action={removeItineraryDay} className="mt-2"><input type="hidden" name="tripId" value={tripId}/><input type="hidden" name="dayId" value={day.id}/><Button type="submit" variant="destructive"><Trash2/> Ano, trvale odstranit den</Button></form></div></details> : null}
  </article>;
}

function Command({ dayId, direction, disabled, tripId }: { dayId: string; direction: "up" | "down"; disabled: boolean; tripId: string }) { const Icon = direction === "up" ? ArrowUp : ArrowDown; return <form action={moveItineraryDay}><input type="hidden" name="tripId" value={tripId}/><input type="hidden" name="dayId" value={dayId}/><input type="hidden" name="direction" value={direction}/><Button type="submit" variant="outline" size="sm" disabled={disabled}><Icon/>{direction === "up" ? "Nahoru" : "Dolů"}</Button></form>; }

function CreatePanel({ dated = false, tripId }: { dated?: boolean; tripId: string }) { return <details className="rounded-2xl border border-dashed border-primary/35 bg-primary/5 p-4"><summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-[var(--brand-highlight)]"><Plus className="size-4"/> {dated ? "Přidat datovaný den" : "Přidat plán bez data"}</summary><form action={createItineraryDay} className="mt-4 grid gap-4 sm:grid-cols-2"><input type="hidden" name="tripId" value={tripId}/><Fields forceDated={dated}/><Button type="submit" size="lg" className="sm:col-span-2 sm:justify-self-start"><Plus/> Přidat {dated ? "den" : "plán"}</Button></form></details>; }

function Fields({ day, forceDated = false }: { day?: ItineraryDayRow; forceDated?: boolean }) { return <><label className="text-xs font-medium text-muted-foreground">Název dne<input className={control} name="name" defaultValue={day?.name ?? ""} maxLength={120} placeholder="Přílet a první procházka" required/></label><DatePicker label={`Datum${forceDated ? "" : " (volitelné)"}`} name="date" defaultValue={day?.day_date ?? ""} clearable={!forceDated}/><label className="text-xs font-medium text-muted-foreground">Město nebo oblast<input className={control} name="city" defaultValue={day?.city ?? ""} maxLength={120} placeholder="Reykjavík"/></label><label className="text-xs font-medium text-muted-foreground">Stav<select className={control} name="status" defaultValue={day?.status ?? "plan"}><option value="plan">Plán</option><option value="confirmed">Potvrzeno</option><option value="completed">Dokončeno</option></select></label><label className="flex min-h-10 items-center gap-2 text-sm sm:col-span-2"><input className="size-4 accent-primary" type="checkbox" name="isReserve" defaultChecked={day?.is_reserve ?? false}/> Rezervní plán pro případ změny</label></>; }
