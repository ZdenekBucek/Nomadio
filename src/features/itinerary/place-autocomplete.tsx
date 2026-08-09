"use client";

import { LoaderCircle, MapPin, Search } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { TimePicker } from "@/components/date-time/time-picker";
import { placeCategories, placeCategoryLabels } from "@/features/places/categories";
import { PlacePreviewMap } from "@/features/places/place-preview-map";
import type { PlaceSearchResult } from "@/features/places/place-search-result";
import { addExternalPlaceToDay, addManualPlaceToDay } from "./day-place-actions";
import { createExternalTripPlace, createTripPlace } from "./place-actions";

type SearchState = "idle" | "loading" | "ready" | "empty" | "error";
type PlaceContext = { kind: "saved"; tripId: string } | { dayId: string; kind: "day"; tripId: string };

const inputClass = "h-11 w-full rounded-xl border border-input bg-background/55 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15";
const controlClass = "mt-2 h-10 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15";

export function PlaceAutocomplete({ configured, context, daySubmitLabel, mapAccessToken }: { configured: boolean; context: PlaceContext; daySubmitLabel?: string; mapAccessToken: string | null }) {
  const fieldId = useId();
  const listboxId = useId();
  const requestId = useRef(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [selected, setSelected] = useState<PlaceSearchResult | null>(null);
  const [state, setState] = useState<SearchState>("idle");

  useEffect(() => {
    const normalized = query.trim().replace(/\s+/g, " ");
    if (!configured || normalized.length < 3 || selected) return;
    const controller = new AbortController();
    const currentRequest = ++requestId.current;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/geoapify/places?tripId=${encodeURIComponent(context.tripId)}&q=${encodeURIComponent(normalized)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed");
        const payload = await response.json() as { results?: PlaceSearchResult[] };
        if (currentRequest !== requestId.current) return;
        const nextResults = Array.isArray(payload.results) ? payload.results : [];
        setResults(nextResults);
        setActiveIndex(nextResults.length ? 0 : -1);
        setState(nextResults.length ? "ready" : "empty");
      } catch (error) {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
        if (currentRequest !== requestId.current) return;
        setResults([]);
        setActiveIndex(-1);
        setState("error");
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [configured, context.tripId, query, selected]);

  function choose(result: PlaceSearchResult) {
    requestId.current += 1;
    setSelected(result);
    setQuery(result.name);
    setResults([]);
    setActiveIndex(-1);
    setState("idle");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (state !== "ready" || results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const result = results[activeIndex];
      if (result) choose(result);
    } else if (event.key === "Escape") {
      setResults([]);
      setActiveIndex(-1);
      setState("idle");
    }
  }

  const canSaveManual = query.trim().length > 0 && !selected && (!configured || state === "empty" || state === "error");

  return <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
    <label className="text-xs font-medium text-muted-foreground" htmlFor={fieldId}>Název nebo adresa</label>
    <div className="relative mt-2">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id={fieldId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={state === "ready"}
        className={inputClass}
        value={query}
        onChange={(event) => {
          requestId.current += 1;
          const value = event.target.value;
          setQuery(value);
          setSelected(null);
          setResults([]);
          setActiveIndex(-1);
          setState(configured && value.trim().length >= 3 ? "loading" : "idle");
        }}
        onKeyDown={onKeyDown}
        maxLength={100}
        placeholder="Hotel, restaurace, nabíječka nebo adresa"
        role="combobox"
        autoComplete="off"
      />
    </div>
    <p className="mt-2 text-xs text-muted-foreground">Zadejte alespoň 3 znaky. Hledání upřednostní země této cesty.</p>

    {!configured ? <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/15 p-3"><p className="text-sm font-medium">Vyhledávání míst zatím není připojené</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Chybí serverová konfigurace Geoapify. Vlastní místo můžete bezpečně uložit bez souřadnic.</p></div> : null}

    <div aria-live="polite" className="mt-3">
      {state === "loading" ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin" /> Hledám…</p> : null}
      {state === "empty" ? <p className="text-sm text-muted-foreground">Nenalezen žádný odpovídající výsledek.</p> : null}
      {state === "error" ? <p className="text-sm text-amber-200">Vyhledávání teď není dostupné. Zkuste to později nebo místo uložte bez souřadnic.</p> : null}
      {state === "ready" ? <ul id={listboxId} role="listbox" aria-label="Výsledky hledání míst" className="grid gap-2">
        {results.map((result, index) => <li id={`${listboxId}-${index}`} key={`${result.provider}-${result.providerPlaceId}`} role="option" aria-selected={index === activeIndex}>
          <button type="button" onClick={() => choose(result)} onMouseEnter={() => setActiveIndex(index)} className="flex w-full items-start gap-3 rounded-xl border border-border bg-background/45 p-3 text-left transition hover:border-primary/40 aria-selected:border-primary/55 aria-selected:bg-primary/8">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><MapPin className="size-4" /></span>
            <span className="min-w-0"><span className="block truncate text-sm font-medium">{result.name}</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{result.formattedAddress}</span><span className="mt-1 block text-xs text-[var(--brand-highlight)]">{placeCategoryLabels[result.category]}</span></span>
          </button>
        </li>)}
      </ul> : null}
    </div>

    {selected ? <SelectedPlace context={context} daySubmitLabel={daySubmitLabel} result={selected} mapAccessToken={mapAccessToken} onCancel={() => { setSelected(null); setQuery(""); }} /> : null}
    {canSaveManual ? <ManualFallback context={context} daySubmitLabel={daySubmitLabel} name={query.trim()} /> : null}

    <p className="mt-4 text-[0.68rem] text-muted-foreground">Vyhledávání <a className="underline underline-offset-2" href="https://www.geoapify.com/" target="_blank" rel="noreferrer">Powered by Geoapify</a> · <a className="underline underline-offset-2" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a>. Mapové zobrazení a jeho atribuce zůstávají od Mapboxu.</p>
  </div>;
}

function ContextIds({ context }: { context: PlaceContext }) {
  return <><input type="hidden" name="tripId" value={context.tripId} />{context.kind === "day" ? <input type="hidden" name="dayId" value={context.dayId} /> : null}</>;
}

function SelectedPlace({ context, daySubmitLabel, result, mapAccessToken, onCancel }: { context: PlaceContext; daySubmitLabel: string | undefined; result: PlaceSearchResult; mapAccessToken: string | null; onCancel: () => void }) {
  const providerCategory = (result.providerCategories.join(",") || "unknown").slice(0, 160);
  return <div className="mt-4 grid gap-4 rounded-2xl border border-primary/30 bg-background/45 p-4 lg:grid-cols-2">
    <div>
      <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">Vybrané místo</p>
      <h3 className="mt-2 font-medium">{result.name}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{result.formattedAddress}</p>
      <form action={context.kind === "day" ? addExternalPlaceToDay : createExternalTripPlace} className="mt-4">
        <ContextIds context={context} />
        <input type="hidden" name="provider" value={result.provider} />
        <input type="hidden" name="providerPlaceId" value={result.providerPlaceId} />
        <input type="hidden" name="providerCategory" value={providerCategory} />
        <input type="hidden" name="name" value={result.name} />
        <input type="hidden" name="address" value={result.formattedAddress} />
        <input type="hidden" name="city" value={result.city ?? ""} />
        <input type="hidden" name="countryCode" value={result.countryCode ?? ""} />
        <input type="hidden" name="latitude" value={result.latitude} />
        <input type="hidden" name="longitude" value={result.longitude} />
        <input type="hidden" name="suggestedCategory" value={result.category} />
        <input type="hidden" name="attribution" value={result.attribution} />
        <label className="text-xs font-medium text-muted-foreground">Kategorie Nomadia
          <select className={controlClass} name="category" defaultValue={result.category}>{placeCategories.map((category) => <option key={category} value={category}>{placeCategoryLabels[category]}</option>)}</select>
        </label>
        {context.kind === "day" ? <DayItemFields /> : null}
        <div className="mt-4 flex flex-wrap gap-2"><SubmitButton label={context.kind === "day" ? daySubmitLabel ?? "Přidat do dne" : "Uložit místo"} /><Button type="button" variant="outline" onClick={onCancel}>Zrušit výběr</Button></div>
      </form>
    </div>
    <PlacePreviewMap accessToken={mapAccessToken} latitude={result.latitude} longitude={result.longitude} />
  </div>;
}

function ManualFallback({ context, daySubmitLabel, name }: { context: PlaceContext; daySubmitLabel: string | undefined; name: string }) {
  return <form action={context.kind === "day" ? addManualPlaceToDay : createTripPlace} className="mt-4 rounded-xl border border-dashed border-border bg-muted/15 p-3">
    <ContextIds context={context} />
    <input type="hidden" name="name" value={name} />
    <input type="hidden" name="address" value="" />
    <input type="hidden" name="city" value="" />
    <input type="hidden" name="countryCode" value="" />
    <input type="hidden" name="latitude" value="" />
    <input type="hidden" name="longitude" value="" />
    <label className="text-xs font-medium text-muted-foreground">Kategorie vlastního místa
      <select className={controlClass} name="category" defaultValue="custom">{placeCategories.map((category) => <option key={category} value={category}>{placeCategoryLabels[category]}</option>)}</select>
    </label>
    {context.kind === "day" ? <DayItemFields /> : null}
    <div className="mt-3"><SubmitButton label={context.kind === "day" ? daySubmitLabel ?? `Přidat „${name}“ do dne` : `Uložit „${name}“ bez souřadnic`} variant="outline" /></div>
  </form>;
}

function DayItemFields() {
  return <div className="mt-4 grid gap-4 sm:grid-cols-2">
    <TimePicker label="Začátek (volitelný)" name="startTime" />
    <TimePicker label="Konec (volitelný)" name="endTime" />
    <label className="text-xs font-medium text-muted-foreground sm:col-span-2">Poznámka (volitelná)<textarea className={`${controlClass} h-24 py-3`} name="notes" maxLength={1200} placeholder="Praktické informace nebo připomínka" /></label>
  </div>;
}

function SubmitButton({ label, variant }: { label: string; variant?: "outline" }) {
  const { pending } = useFormStatus();
  return <Button type="submit" variant={variant} disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" /> Ukládám…</> : label}</Button>;
}
