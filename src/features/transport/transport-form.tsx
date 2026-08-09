"use client";

import { AlertTriangle, ArrowDown, ArrowUp, ChevronDown, LoaderCircle, MapPin, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { DateTimePicker } from "@/components/date-time/date-time-picker";
import { Button } from "@/components/ui/button";
import { placeCategories, placeCategoryLabels } from "@/features/places/categories";
import type { PlaceSearchResult } from "@/features/places/place-search-result";
import type { PlaceCategory, TransportPaymentStatus, TripPlaceRow, TripRow } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { deleteTransportBooking, saveTransportBooking } from "./transport-actions";
import type { TransportPlaceSelection } from "./transport-input";
import { bookingStatusLabels, bookingStatuses, dateTimeInputValue, deriveTransportPaymentStatus, remainingTransportAmount, transportPaymentStatusLabels, transportPaymentStatuses, transportTypeLabels, transportTypes, type TransportBookingWithSegments } from "./transport-model";

const fieldClass = "mt-2 h-11 w-full min-w-0 rounded-xl border border-input bg-background/55 px-3 text-sm outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-65";
const labelClass = "text-xs font-medium text-muted-foreground";
const amountFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });

type SegmentDraft = {
  arrivalAt: string;
  arrivalPlace: TransportPlaceSelection;
  baggage: string;
  departureAt: string;
  departurePlace: TransportPlaceSelection;
  key: string;
  notes: string;
  platform: string;
  seat: string;
  serviceNumber: string;
  terminal: string;
};

function emptySegment(key: string): SegmentDraft {
  return { arrivalAt: "", arrivalPlace: { mode: "none" }, baggage: "", departureAt: "", departurePlace: { mode: "none" }, key, notes: "", platform: "", seat: "", serviceNumber: "", terminal: "" };
}

function nonexistentTimeMessage(timeZone: string) {
  return `Tento čas v časovém pásmu ${timeZone} neexistuje kvůli změně letního času. Zvolte jiný čas.`;
}

export function TransportForm({
  booking, canEdit, dateTimeError = null, geoapifyConfigured, places, trip,
}: {
  booking: TransportBookingWithSegments | null;
  canEdit: boolean;
  dateTimeError?: { field: "arrival" | "departure"; segmentIndex: number } | null;
  geoapifyConfigured: boolean;
  places: TripPlaceRow[];
  trip: TripRow;
}) {
  const nextKey = useRef(booking?.segments.length ?? 1);
  const [segments, setSegments] = useState<SegmentDraft[]>(() => booking?.segments.length ? booking.segments.map((segment) => ({
    arrivalAt: dateTimeInputValue(segment.arrival_at, trip.timezone),
    arrivalPlace: segment.arrival_place_id ? { mode: "saved", placeId: segment.arrival_place_id } : { mode: "none" },
    baggage: segment.baggage ?? "",
    departureAt: dateTimeInputValue(segment.departure_at, trip.timezone),
    departurePlace: segment.departure_place_id ? { mode: "saved", placeId: segment.departure_place_id } : { mode: "none" },
    key: segment.id,
    notes: segment.notes ?? "",
    platform: segment.platform ?? "",
    seat: segment.seat ?? "",
    serviceNumber: segment.service_number ?? "",
    terminal: segment.terminal ?? "",
  })) : [emptySegment("new-0")]);
  const [totalPrice, setTotalPrice] = useState(booking?.total_price?.toString() ?? "");
  const [paidAmount, setPaidAmount] = useState(booking?.paid_amount?.toString() ?? "");
  const [currency, setCurrency] = useState(booking?.currency ?? trip.currency);
  const [paymentStatus, setPaymentStatus] = useState<TransportPaymentStatus>(booking?.payment_status ?? "unknown");
  const dateTimeErrorKey = booking?.segments[dateTimeError?.segmentIndex ?? -1]?.id ?? (dateTimeError?.segmentIndex === 0 ? "new-0" : null);
  const [openSegmentKeys, setOpenSegmentKeys] = useState<Set<string>>(() => new Set([booking?.segments[0]?.id ?? "new-0", ...(dateTimeErrorKey ? [dateTimeErrorKey] : [])]));
  const [segmentErrorKeys, setSegmentErrorKeys] = useState<Set<string>>(() => new Set(dateTimeErrorKey ? [dateTimeErrorKey] : []));
  const parsedTotal = totalPrice === "" ? null : Number(totalPrice);
  const parsedPaid = paidAmount === "" ? null : Number(paidAmount);
  const remaining = Number.isFinite(parsedTotal) && Number.isFinite(parsedPaid) ? remainingTransportAmount(parsedTotal, parsedPaid) : null;

  function updateDerivedStatus(nextTotal: string, nextPaid: string) {
    const total = nextTotal === "" ? null : Number(nextTotal);
    const paid = nextPaid === "" ? null : Number(nextPaid);
    setPaymentStatus((current) => deriveTransportPaymentStatus(Number.isFinite(total) ? total : null, Number.isFinite(paid) ? paid : null, current));
  }

  function updateSegment(index: number, patch: Partial<SegmentDraft>) {
    setSegments((current) => current.map((segment, itemIndex) => itemIndex === index ? { ...segment, ...patch } : segment));
  }

  function moveSegment(index: number, direction: -1 | 1) {
    setSegments((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  function toggleSegment(key: string) {
    setOpenSegmentKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function addSegment() {
    const key = `new-${nextKey.current++}`;
    setSegments((current) => [...current, emptySegment(key)]);
    setOpenSegmentKeys((current) => new Set(current).add(key));
  }

  function removeSegment(key: string, index: number) {
    setSegments((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setOpenSegmentKeys((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }

  const serializedSegments = JSON.stringify(segments.map((segment) => ({
    arrivalAt: segment.arrivalAt,
    arrivalPlace: segment.arrivalPlace,
    baggage: segment.baggage,
    departureAt: segment.departureAt,
    departurePlace: segment.departurePlace,
    notes: segment.notes,
    platform: segment.platform,
    seat: segment.seat,
    serviceNumber: segment.serviceNumber,
    terminal: segment.terminal,
  })));
  return <form action={canEdit ? saveTransportBooking : undefined} className="mt-5 grid min-w-0 gap-5" onInvalid={(event) => {
    const key = (event.target as HTMLElement).closest<HTMLElement>("[data-segment-key]")?.dataset.segmentKey;
    if (key) {
      setOpenSegmentKeys((current) => new Set(current).add(key));
      setSegmentErrorKeys((current) => new Set(current).add(key));
    }
  }}>
    <input type="hidden" name="tripId" value={trip.id} />
    <input type="hidden" name="bookingId" value={booking?.id ?? ""} />
    <input type="hidden" name="segments" value={serializedSegments} />
    <fieldset disabled={!canEdit} className="grid min-w-0 gap-5 disabled:opacity-90">
      <section className="grid min-w-0 gap-4 rounded-2xl border border-border bg-muted/18 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <h3 className="font-medium sm:col-span-2 lg:col-span-3">Rezervace</h3>
        <label className={`${labelClass} sm:col-span-2`}>Název *<input className={fieldClass} name="title" required maxLength={160} defaultValue={booking?.title ?? ""} /></label>
        <label className={labelClass}>Typ dopravy<select className={fieldClass} name="transportType" defaultValue={booking?.transport_type ?? "flight"}>{transportTypes.map((type) => <option key={type} value={type}>{transportTypeLabels[type]}</option>)}</select></label>
        <label className={labelClass}>Dopravce / poskytovatel<input className={fieldClass} name="provider" maxLength={160} defaultValue={booking?.provider ?? ""} /></label>
        <label className={labelClass}>Rezervační kód<input className={fieldClass} name="bookingReference" maxLength={160} defaultValue={booking?.booking_reference ?? ""} /></label>
        <label className={labelClass}>Stav rezervace<select className={fieldClass} name="status" defaultValue={booking?.status ?? "planned"}>{bookingStatuses.map((status) => <option key={status} value={status}>{bookingStatusLabels[status]}</option>)}</select></label>
      </section>

      <section className="grid min-w-0 gap-4 rounded-2xl border border-border bg-muted/18 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3"><h3 className="font-medium">Cena a platba</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Částky jsou připravené jako zdroj pro budoucí modul Rozpočet.</p></div>
        <label className={labelClass}>Celková cena<input className={fieldClass} type="number" name="totalPrice" min={0} step="0.01" value={totalPrice} onChange={(event) => { const next = event.target.value; setTotalPrice(next); updateDerivedStatus(next, paidAmount); }} /></label>
        <label className={labelClass}>Měna<input className={`${fieldClass} uppercase`} name="currency" pattern="[A-Za-z]{3}" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></label>
        <label className={labelClass}>Již zaplaceno<input className={fieldClass} type="number" name="paidAmount" min={0} step="0.01" value={paidAmount} onChange={(event) => { const next = event.target.value; setPaidAmount(next); updateDerivedStatus(totalPrice, next); }} /></label>
        <label className={labelClass}>Zbývá doplatit<output aria-live="polite" className={`${fieldClass} flex items-center bg-muted/30 text-foreground`}>{remaining === null ? "Doplňte obě částky" : `${amountFormatter.format(remaining)} ${currency}`}</output></label>
        {remaining !== null && remaining > 0 ? <label className={labelClass}>Datum splatnosti zbývající částky<input className={fieldClass} type="date" name="balanceDueDate" defaultValue={booking?.balance_due_date ?? ""} /></label> : <input type="hidden" name="balanceDueDate" value="" />}
        <label className={labelClass}>Stav platby<select className={fieldClass} name="paymentStatus" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as TransportPaymentStatus)}>{transportPaymentStatuses.map((status) => <option key={status} value={status}>{transportPaymentStatusLabels[status]}</option>)}</select></label>
        {paymentStatus === "pay_on_site" ? <p className="self-end rounded-xl border border-primary/20 bg-primary/8 px-3 py-3 text-sm text-muted-foreground">Platba na místě. Datum splatnosti může zůstat prázdné.</p> : null}
      </section>

      <section className="grid min-w-0 gap-4 rounded-2xl border border-border bg-muted/18 p-4">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3"><div><h3 className="font-medium">Segmenty cesty</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Pořadí určíte tlačítky nahoru a dolů. Časy se ukládají v časovém pásmu cesty {trip.timezone}.</p></div>{canEdit ? <Button type="button" size="sm" variant="outline" onClick={addSegment}><Plus /> Přidat segment</Button> : null}</div>
        <div className="grid min-w-0 gap-4">{segments.map((segment, index) => <SegmentEditor key={segment.key} configured={geoapifyConfigured} dateTimeError={dateTimeError?.segmentIndex === index ? dateTimeError.field : null} hasError={segmentErrorKeys.has(segment.key)} index={index} open={openSegmentKeys.has(segment.key)} places={places} segment={segment} timeZone={trip.timezone} total={segments.length} tripId={trip.id} onChange={(change) => updateSegment(index, change)} onMove={(direction) => moveSegment(index, direction)} onRemove={() => removeSegment(segment.key, index)} onToggle={() => toggleSegment(segment.key)} />)}</div>
      </section>

      <label className={labelClass}>Poznámka k rezervaci<textarea className={`${fieldClass} h-28 resize-y py-3`} name="notes" maxLength={4000} defaultValue={booking?.notes ?? ""} /></label>
    </fieldset>
    {canEdit ? <div className="flex min-w-0 flex-wrap items-center justify-between gap-3"><SubmitButton label={booking ? "Uložit dopravu" : "Přidat dopravu"} />{booking ? <DeleteButton /> : null}</div> : <p className="rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">Detail je dostupný pouze pro čtení.</p>}
  </form>;
}

function SegmentEditor({ configured, dateTimeError, hasError, index, onChange, onMove, onRemove, onToggle, open, places, segment, timeZone, total, tripId }: {
  configured: boolean; dateTimeError: "arrival" | "departure" | null; hasError: boolean; index: number; onChange: (change: Partial<SegmentDraft>) => void; onMove: (direction: -1 | 1) => void; onRemove: () => void; onToggle: () => void; open: boolean; places: TripPlaceRow[]; segment: SegmentDraft; timeZone: string; total: number; tripId: string;
}) {
  const departure = placeSummary(segment.departurePlace, places);
  const arrival = placeSummary(segment.arrivalPlace, places);
  const route = departure || arrival ? `${departure ?? "?"} → ${arrival ?? "?"}` : "Trasa zatím není vyplněná";
  const time = segment.departureAt ? segment.departureAt.slice(11, 16) : null;
  const summary = [time, segment.serviceNumber].filter(Boolean).join(" · ");
  const panelId = `transport-segment-panel-${segment.key}`;

  return <article className="min-w-0 rounded-2xl border border-border bg-background/35 p-3 sm:p-4" data-segment-key={segment.key}>
    <button type="button" aria-label={`Segment ${index + 1}: ${route}${summary ? `, ${summary}` : ""}`} aria-controls={panelId} aria-expanded={open} onClick={onToggle} className="flex min-h-11 w-full min-w-0 items-center gap-3 rounded-xl text-left transition hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <span className="shrink-0 text-xs font-semibold text-primary">{index + 1}</span>
      <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{route}</span>{summary ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{summary}</span> : null}</span>
      {hasError ? <AlertTriangle aria-label="Segment obsahuje chybu" className="size-4 shrink-0 text-amber-300" /> : null}
      <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
    </button>
    <div id={panelId} hidden={!open} className="mt-4 grid min-w-0 gap-4">
      <div className="grid min-w-0 gap-4 lg:grid-cols-2"><PlacePicker configured={configured} label="Odkud" places={places} selection={segment.departurePlace} tripId={tripId} onChange={(departurePlace) => onChange({ departurePlace })} /><PlacePicker configured={configured} label="Kam" places={places} selection={segment.arrivalPlace} tripId={tripId} onChange={(arrivalPlace) => onChange({ arrivalPlace })} /></div>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DateTimePicker label="Odjezd / odlet" value={segment.departureAt} timeZone={timeZone} error={dateTimeError === "departure" ? nonexistentTimeMessage(timeZone) : null} onChange={(departureAt) => onChange({ departureAt })} />
        <DateTimePicker label="Příjezd / přílet" value={segment.arrivalAt} timeZone={timeZone} error={dateTimeError === "arrival" ? nonexistentTimeMessage(timeZone) : null} onChange={(arrivalAt) => onChange({ arrivalAt })} />
        <label className={labelClass}>Číslo letu / spoje<input className={fieldClass} maxLength={80} value={segment.serviceNumber} onChange={(event) => onChange({ serviceNumber: event.target.value })} /></label>
        <label className={labelClass}>Terminál<input className={fieldClass} maxLength={80} value={segment.terminal} onChange={(event) => onChange({ terminal: event.target.value })} /></label>
        <label className={labelClass}>Nástupiště<input className={fieldClass} maxLength={80} value={segment.platform} onChange={(event) => onChange({ platform: event.target.value })} /></label>
        <label className={labelClass}>Sedadlo<input className={fieldClass} maxLength={160} value={segment.seat} onChange={(event) => onChange({ seat: event.target.value })} /></label>
        <label className={`${labelClass} sm:col-span-2`}>Zavazadla<input className={fieldClass} maxLength={500} value={segment.baggage} onChange={(event) => onChange({ baggage: event.target.value })} /></label>
        <label className={`${labelClass} sm:col-span-2 lg:col-span-4`}>Poznámka<textarea className={`${fieldClass} h-20 resize-y py-3`} maxLength={2000} value={segment.notes} onChange={(event) => onChange({ notes: event.target.value })} /></label>
        <div className="flex flex-wrap gap-1 sm:col-span-2 lg:col-span-4"><Button type="button" size="icon-sm" variant="ghost" aria-label={`Posunout segment ${index + 1} nahoru`} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp /></Button><Button type="button" size="icon-sm" variant="ghost" aria-label={`Posunout segment ${index + 1} dolů`} disabled={index === total - 1} onClick={() => onMove(1)}><ArrowDown /></Button><Button type="button" size="sm" variant="destructive" aria-label={`Odstranit segment ${index + 1}`} disabled={total === 1} onClick={onRemove}><Trash2 /> Odstranit segment</Button></div>
      </div>
    </div>
  </article>;
}

function placeSummary(selection: TransportPlaceSelection, places: TripPlaceRow[]) {
  if (selection.mode === "external") return selection.result.name;
  if (selection.mode === "saved") return places.find((place) => place.id === selection.placeId)?.name ?? null;
  return null;
}

function PlacePicker({ configured, label, onChange, places, selection, tripId }: { configured: boolean; label: string; onChange: (selection: TransportPlaceSelection) => void; places: TripPlaceRow[]; selection: TransportPlaceSelection; tripId: string }) {
  const inputId = useId(); const listId = useId(); const requestId = useRef(0);
  const [mode, setMode] = useState<"none" | "saved" | "external">(selection.mode);
  const [query, setQuery] = useState(selection.mode === "external" ? selection.result.name : "");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [selected, setSelected] = useState<PlaceSearchResult | null>(selection.mode === "external" ? selection.result : null);
  const [active, setActive] = useState(-1);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "empty" | "error">("idle");

  useEffect(() => {
    const normalized = query.trim().replace(/\s+/g, " ");
    if (mode !== "external" || !configured || selected || normalized.length < 3) return;
    const controller = new AbortController(); const current = ++requestId.current;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/geoapify/places?tripId=${encodeURIComponent(tripId)}&q=${encodeURIComponent(normalized)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("search failed");
        const payload = await response.json() as { results?: PlaceSearchResult[] };
        if (current !== requestId.current) return;
        const next = Array.isArray(payload.results) ? payload.results : [];
        setResults(next); setActive(next.length ? 0 : -1); setState(next.length ? "ready" : "empty");
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError") || current !== requestId.current) return;
        setResults([]); setActive(-1); setState("error");
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [configured, mode, query, selected, tripId]);

  function switchMode(next: "none" | "saved" | "external") {
    if (next === mode) return;
    requestId.current += 1; setMode(next); setResults([]); setActive(-1); setState("idle");
    if (next === "none") { setSelected(null); setQuery(""); onChange({ mode: "none" }); }
    if (next === "saved") { setSelected(null); setQuery(""); onChange({ mode: "none" }); }
    if (next === "external") { setSelected(null); setQuery(""); onChange({ mode: "none" }); }
  }

  function choose(result: PlaceSearchResult) {
    requestId.current += 1; setSelected(result); setQuery(result.name); setResults([]); setActive(-1); setState("idle");
    onChange({ category: result.category, mode: "external", result });
  }

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (state !== "ready" || !results.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => (index + 1) % results.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => index <= 0 ? results.length - 1 : index - 1); }
    else if (event.key === "Enter" && active >= 0) { event.preventDefault(); choose(results[active]!); }
    else if (event.key === "Escape") { setResults([]); setActive(-1); setState("idle"); }
  }

  return <div className="min-w-0 rounded-xl border border-border bg-muted/15 p-3"><p className="text-xs font-semibold text-foreground">{label}</p><div className="mt-2 flex flex-wrap gap-1.5">{(["none", "saved", "external"] as const).map((option) => <Button key={option} type="button" size="sm" variant={mode === option ? "secondary" : "outline"} onClick={() => switchMode(option)}>{option === "none" ? "Bez místa" : option === "saved" ? "Uložené" : "Geoapify"}</Button>)}</div>
    {mode === "saved" ? <label className={`${labelClass} mt-3 block`}>Uložené místo<select className={fieldClass} value={selection.mode === "saved" ? selection.placeId : ""} onChange={(event) => onChange(event.target.value ? { mode: "saved", placeId: event.target.value } : { mode: "none" })}><option value="">Vyberte místo</option>{places.map((place) => <option key={place.id} value={place.id}>{place.name}{place.address ? ` — ${place.address}` : ""}</option>)}</select></label> : null}
    {mode === "external" ? <div className="mt-3"><label className={labelClass} htmlFor={inputId}>Název nebo adresa</label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input id={inputId} className={`${fieldClass} pl-10`} role="combobox" aria-controls={listId} aria-expanded={state === "ready"} aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined} aria-autocomplete="list" autoComplete="off" maxLength={100} value={query} onKeyDown={keyDown} onChange={(event) => { requestId.current += 1; setQuery(event.target.value); setSelected(null); onChange({ mode: "none" }); setResults([]); setActive(-1); setState(configured && event.target.value.trim().length >= 3 ? "loading" : "idle"); }} /></div>
      {!configured ? <p className="mt-2 text-xs text-amber-200">Geoapify není na serveru nakonfigurované. Použijte uložené místo.</p> : null}<div aria-live="polite" className="mt-2">{state === "loading" ? <p className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Hledám…</p> : null}{state === "empty" ? <p className="text-xs text-muted-foreground">Nic jsme nenašli.</p> : null}{state === "error" ? <p className="text-xs text-amber-200">Vyhledávání teď není dostupné.</p> : null}{state === "ready" ? <ul id={listId} role="listbox" className="grid gap-2">{results.map((result, index) => <li id={`${listId}-${index}`} key={`${result.provider}-${result.providerPlaceId}`} role="option" aria-selected={active === index}><button type="button" className="flex w-full min-w-0 items-start gap-2 rounded-xl border border-border bg-background/50 p-2 text-left hover:border-primary/40" onClick={() => choose(result)}><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block truncate text-sm font-medium">{result.name}</span><span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{result.formattedAddress}</span></span></button></li>)}</ul> : null}</div>
      {selected && selection.mode === "external" ? <div className="mt-3 rounded-xl border border-primary/25 bg-primary/5 p-3"><p className="text-sm font-medium">{selected.name}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{selected.formattedAddress}</p><label className={`${labelClass} mt-3 block`}>Kategorie Nomadia<select className={fieldClass} value={selection.category} onChange={(event) => onChange({ ...selection, category: event.target.value as PlaceCategory })}>{placeCategories.map((category) => <option key={category} value={category}>{placeCategoryLabels[category]}</option>)}</select></label></div> : null}
      <p className="mt-2 text-[0.65rem] text-muted-foreground">Powered by Geoapify · © OpenStreetMap contributors.</p></div> : null}
  </div>;
}

function SubmitButton({ label }: { label: string }) { const { pending } = useFormStatus(); return <Button type="submit" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" /> Ukládám…</> : label}</Button>; }
function DeleteButton() { return <Button type="submit" variant="destructive" formAction={deleteTransportBooking} onClick={(event) => { if (!window.confirm("Opravdu chcete odstranit rezervaci včetně jejích segmentů? Uložená místa zůstanou zachovaná.")) event.preventDefault(); }}><Trash2 /> Odstranit rezervaci</Button>; }
