"use client";

import { LoaderCircle, MapPin, Search, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-time/date-picker";
import { DateRangePicker } from "@/components/date-time/date-range-picker";
import { TimePicker } from "@/components/date-time/time-picker";
import { placeCategories, placeCategoryLabels } from "@/features/places/categories";
import { PlacePreviewMap } from "@/features/places/place-preview-map";
import type { PlaceSearchResult } from "@/features/places/place-search-result";
import type { AccommodationPaymentStatus, TripPlaceRow, TripRow } from "@/lib/supabase/database.types";
import { createAccommodation, deleteAccommodation, updateAccommodation } from "./accommodation-actions";
import { accommodationTypeLabels, accommodationTypes, deriveAccommodationPaymentStatus, paymentStatusLabels, paymentStatuses, remainingAccommodationAmount, type AccommodationWithPlace } from "./accommodation-model";

const fieldClass = "mt-2 h-11 w-full min-w-0 rounded-xl border border-input bg-background/55 px-3 text-sm outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-65";
const labelClass = "text-xs font-medium text-muted-foreground";
const amountFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
const newAccommodationDefaults = {
  checkInTime: "15:00",
  checkOutTime: "11:00",
  guestCount: 2,
} as const;

export function AccommodationForm({
  accommodation,
  canEdit,
  geoapifyConfigured,
  mapAccessToken,
  places,
  trip,
}: {
  accommodation: AccommodationWithPlace | null;
  canEdit: boolean;
  geoapifyConfigured: boolean;
  mapAccessToken: string | null;
  places: TripPlaceRow[];
  trip: TripRow;
}) {
  const action = accommodation ? updateAccommodation : createAccommodation;
  const [totalPrice, setTotalPrice] = useState(accommodation?.total_price?.toString() ?? "");
  const [paidAmount, setPaidAmount] = useState(accommodation?.paid_amount?.toString() ?? "");
  const [currency, setCurrency] = useState(accommodation?.currency ?? trip.currency);
  const [paymentStatus, setPaymentStatus] = useState<AccommodationPaymentStatus>(accommodation?.payment_status ?? "unknown");
  const parsedTotal = totalPrice === "" ? null : Number(totalPrice);
  const parsedPaid = paidAmount === "" ? null : Number(paidAmount);
  const remaining = Number.isFinite(parsedTotal) && Number.isFinite(parsedPaid)
    ? remainingAccommodationAmount(parsedTotal, parsedPaid)
    : null;
  const hasRemainingBalance = remaining !== null && remaining > 0;

  function updateDerivedStatus(nextTotal: string, nextPaid: string) {
    const total = nextTotal === "" ? null : Number(nextTotal);
    const paid = nextPaid === "" ? null : Number(nextPaid);
    setPaymentStatus((current) => deriveAccommodationPaymentStatus(
      Number.isFinite(total) ? total : null,
      Number.isFinite(paid) ? paid : null,
      current,
    ));
  }
  return <form action={canEdit ? action : undefined} className="mt-5 grid gap-5">
    <input type="hidden" name="tripId" value={trip.id} />
    {accommodation ? <input type="hidden" name="accommodationId" value={accommodation.id} /> : null}
    <fieldset disabled={!canEdit} className="grid min-w-0 gap-5 disabled:opacity-90">
      <section className="grid min-w-0 gap-4 rounded-2xl border border-border bg-muted/18 p-4 sm:grid-cols-2">
        <h3 className="sm:col-span-2 font-medium">Základní údaje</h3>
        <label className={`${labelClass} sm:col-span-2`}>Název ubytování *<input className={fieldClass} name="name" required maxLength={160} defaultValue={accommodation?.name ?? ""} /></label>
        <label className={labelClass}>Typ<select className={fieldClass} name="accommodationType" defaultValue={accommodation?.accommodation_type ?? "hotel"}>{accommodationTypes.map((type) => <option key={type} value={type}>{accommodationTypeLabels[type]}</option>)}</select></label>
        <label className={labelClass}>Počet hostů<input className={fieldClass} type="number" name="guestCount" min={1} step={1} defaultValue={accommodation ? accommodation.guest_count ?? "" : newAccommodationDefaults.guestCount} /></label>
      </section>

      <section className="grid min-w-0 gap-4 rounded-2xl border border-border bg-muted/18 p-4 sm:grid-cols-2">
        <h3 className="sm:col-span-2 font-medium">Termín pobytu</h3>
        <DateRangePicker
          className="sm:col-span-2"
          defaultStartDate={accommodation?.check_in_date ?? trip.start_date}
          defaultEndDate={accommodation?.check_out_date ?? trip.end_date}
          endName="checkOutDate"
          label="Pobyt"
          startName="checkInDate"
        />
        <TimePicker label="Check-in" name="checkInTime" defaultValue={accommodation ? accommodation.check_in_time?.slice(0, 5) ?? "" : newAccommodationDefaults.checkInTime} />
        <TimePicker label="Check-out" name="checkOutTime" defaultValue={accommodation ? accommodation.check_out_time?.slice(0, 5) ?? "" : newAccommodationDefaults.checkOutTime} />
      </section>

      <section className="grid min-w-0 gap-4 rounded-2xl border border-border bg-muted/18 p-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><h3 className="font-medium">Místo</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Vyberte uložené místo, nebo vyhledejte hotel či adresu přes Geoapify.</p></div>
        <div className="sm:col-span-2"><AccommodationPlacePicker configured={geoapifyConfigured} mapAccessToken={mapAccessToken} places={places} tripId={trip.id} value={accommodation?.place_id ?? null} /></div>
      </section>

      <section className="grid min-w-0 gap-4 rounded-2xl border border-border bg-muted/18 p-4 sm:grid-cols-2">
        <h3 className="sm:col-span-2 font-medium">Pobyt a rezervace</h3>
        <label className={labelClass}>Pokoj<input className={fieldClass} name="roomType" maxLength={160} defaultValue={accommodation?.room_type ?? ""} /></label>
        <label className={labelClass}>Snídaně<select className={fieldClass} name="breakfastIncluded" defaultValue={accommodation?.breakfast_included === true ? "yes" : accommodation?.breakfast_included === false ? "no" : "unknown"}><option value="unknown">Neznámé</option><option value="yes">Ano</option><option value="no">Ne</option></select></label>
        <label className={labelClass}>Rezervační kód<input className={fieldClass} name="bookingReference" maxLength={160} defaultValue={accommodation?.booking_reference ?? ""} /></label>
        <label className={labelClass}>Odkaz na rezervaci<input className={fieldClass} type="url" name="bookingUrl" maxLength={500} placeholder="https://…" defaultValue={accommodation?.booking_url ?? ""} /></label>
      </section>

      <section className="grid min-w-0 gap-4 rounded-2xl border border-border bg-muted/18 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3"><h3 className="font-medium">Cena a platba</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Částky jsou zdrojem pro budoucí rozpočet; stav platby zůstává vaší explicitní volbou.</p></div>
        <label className={labelClass}>Celková cena<input className={fieldClass} type="number" name="totalPrice" min={0} step="0.01" value={totalPrice} onChange={(event) => { const next = event.target.value; setTotalPrice(next); updateDerivedStatus(next, paidAmount); }} /></label>
        <label className={labelClass}>Měna<input className={`${fieldClass} uppercase`} name="currency" pattern="[A-Za-z]{3}" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></label>
        <label className={labelClass}>Již zaplaceno<input className={fieldClass} type="number" name="paidAmount" min={0} step="0.01" value={paidAmount} onChange={(event) => { const next = event.target.value; setPaidAmount(next); updateDerivedStatus(totalPrice, next); }} /></label>
        <label className={labelClass}>Zbývá doplatit<output aria-live="polite" className={`${fieldClass} flex items-center bg-muted/30 text-foreground`}>{remaining === null ? "Doplňte obě částky" : `${amountFormatter.format(remaining)} ${currency}`}</output></label>
        {hasRemainingBalance ? <DatePicker label="Datum splatnosti zbývající částky" name="balanceDueDate" defaultValue={accommodation?.balance_due_date ?? ""} /> : <input type="hidden" name="balanceDueDate" value="" />}
        <label className={labelClass}>Stav platby<select className={fieldClass} name="paymentStatus" value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as AccommodationPaymentStatus)}>{paymentStatuses.map((status) => <option key={status} value={status}>{paymentStatusLabels[status]}</option>)}</select></label>
        {paymentStatus === "pay_on_site" ? <p className="self-end rounded-xl border border-primary/20 bg-primary/8 px-3 py-3 text-sm text-muted-foreground">Platba na místě. Datum splatnosti může zůstat prázdné.</p> : null}
      </section>

      <label className={labelClass}>Poznámka<textarea className={`${fieldClass} h-28 resize-y py-3`} name="notes" maxLength={4000} defaultValue={accommodation?.notes ?? ""} /></label>
    </fieldset>

    {canEdit ? <div className="flex flex-wrap items-center justify-between gap-3"><SubmitButton label={accommodation ? "Uložit změny" : "Přidat ubytování"} />{accommodation ? <DeleteButton accommodationId={accommodation.id} tripId={trip.id} /> : null}</div> : <p className="rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">Detail je dostupný pouze pro čtení.</p>}
  </form>;
}

function AccommodationPlacePicker({ configured, mapAccessToken, places, tripId, value }: { configured: boolean; mapAccessToken: string | null; places: TripPlaceRow[]; tripId: string; value: string | null }) {
  const inputId = useId();
  const listId = useId();
  const requestId = useRef(0);
  const [mode, setMode] = useState<"none" | "saved" | "external">(value ? "saved" : "none");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [selected, setSelected] = useState<PlaceSearchResult | null>(null);
  const [active, setActive] = useState(-1);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "empty" | "error">("idle");

  useEffect(() => {
    const normalized = query.trim().replace(/\s+/g, " ");
    if (mode !== "external" || !configured || selected || normalized.length < 3) return;
    const controller = new AbortController();
    const current = ++requestId.current;
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

  function choose(result: PlaceSearchResult) {
    requestId.current += 1; setSelected(result); setQuery(result.name); setResults([]); setActive(-1); setState("idle");
  }

  function keyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (state !== "ready" || !results.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActive((index) => (index + 1) % results.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive((index) => index <= 0 ? results.length - 1 : index - 1); }
    else if (event.key === "Enter" && active >= 0) { event.preventDefault(); choose(results[active]!); }
    else if (event.key === "Escape") { setResults([]); setActive(-1); setState("idle"); }
  }

  return <div className="min-w-0">
    <input type="hidden" name="placeMode" value={mode} />
    <div className="flex flex-wrap gap-2">
      {(["none", "saved", "external"] as const).map((option) => <Button key={option} type="button" size="sm" variant={mode === option ? "secondary" : "outline"} onClick={() => { setMode(option); if (option !== "external") setSelected(null); }}>{option === "none" ? "Bez místa" : option === "saved" ? "Uložené místo" : "Vyhledat místo"}</Button>)}
    </div>
    {mode === "saved" ? <label className={`${labelClass} mt-4 block`}>Uložené místo<select className={fieldClass} name="placeId" defaultValue={value ?? ""}><option value="">Bez místa</option>{places.map((place) => <option key={place.id} value={place.id}>{place.name}{place.address ? ` — ${place.address}` : ""}</option>)}</select></label> : <input type="hidden" name="placeId" value="" />}
    {mode === "external" ? <div className="mt-4">
      <label className={labelClass} htmlFor={inputId}>Hotel nebo adresa</label>
      <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input id={inputId} className={`${fieldClass} pl-10`} role="combobox" aria-controls={listId} aria-expanded={state === "ready"} aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined} aria-autocomplete="list" autoComplete="off" maxLength={100} value={query} onKeyDown={keyDown} onChange={(event) => { requestId.current += 1; setQuery(event.target.value); setSelected(null); setResults([]); setActive(-1); setState(configured && event.target.value.trim().length >= 3 ? "loading" : "idle"); }} /></div>
      {!configured ? <p className="mt-2 text-xs text-amber-200">Geoapify není na serveru nakonfigurované. Vyberte uložené místo nebo pokračujte bez místa.</p> : null}
      <div aria-live="polite" className="mt-3">{state === "loading" ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Hledám…</p> : null}{state === "empty" ? <p className="text-sm text-muted-foreground">Nic jsme nenašli.</p> : null}{state === "error" ? <p className="text-sm text-amber-200">Vyhledávání teď není dostupné.</p> : null}
        {state === "ready" ? <ul id={listId} role="listbox" className="grid gap-2">{results.map((result, index) => <li id={`${listId}-${index}`} key={`${result.provider}-${result.providerPlaceId}`} role="option" aria-selected={active === index}><button type="button" className="flex w-full min-w-0 items-start gap-3 rounded-xl border border-border bg-background/50 p-3 text-left hover:border-primary/40" onClick={() => choose(result)}><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block truncate text-sm font-medium">{result.name}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{result.formattedAddress}</span></span></button></li>)}</ul> : null}
      </div>
      {selected ? <ExternalSelection result={selected} mapAccessToken={mapAccessToken} /> : null}
      <p className="mt-3 text-[0.68rem] text-muted-foreground">Vyhledávání Powered by Geoapify · © OpenStreetMap contributors.</p>
    </div> : null}
  </div>;
}

function ExternalSelection({ mapAccessToken, result }: { mapAccessToken: string | null; result: PlaceSearchResult }) {
  const providerCategory = (result.providerCategories.join(",") || "unknown").slice(0, 160);
  return <div className="mt-4 grid min-w-0 gap-4 rounded-xl border border-primary/25 bg-primary/5 p-3 lg:grid-cols-2">
    <div className="min-w-0"><p className="text-sm font-medium">{result.name}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{result.formattedAddress}</p>
      <input type="hidden" name="provider" value={result.provider} /><input type="hidden" name="providerPlaceId" value={result.providerPlaceId} /><input type="hidden" name="providerCategory" value={providerCategory} /><input type="hidden" name="externalName" value={result.name} /><input type="hidden" name="address" value={result.formattedAddress} /><input type="hidden" name="city" value={result.city ?? ""} /><input type="hidden" name="countryCode" value={result.countryCode ?? ""} /><input type="hidden" name="latitude" value={result.latitude} /><input type="hidden" name="longitude" value={result.longitude} /><input type="hidden" name="suggestedCategory" value={result.category} /><input type="hidden" name="attribution" value={result.attribution} />
      <label className={`${labelClass} mt-3 block`}>Kategorie místa<select className={fieldClass} name="category" defaultValue="accommodation">{placeCategories.map((category) => <option key={category} value={category}>{placeCategoryLabels[category]}</option>)}</select></label>
    </div><PlacePreviewMap accessToken={mapAccessToken} latitude={result.latitude} longitude={result.longitude} />
  </div>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" /> Ukládám…</> : label}</Button>;
}

function DeleteButton({ accommodationId, tripId }: { accommodationId: string; tripId: string }) {
  return <Button type="submit" variant="destructive" formAction={deleteAccommodation} data-trip-id={tripId} data-accommodation-id={accommodationId} onClick={(event) => { if (!window.confirm("Opravdu chcete odstranit tuto rezervaci? Uložené místo zůstane zachované.")) event.preventDefault(); }}><Trash2 /> Odstranit</Button>;
}
