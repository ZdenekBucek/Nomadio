"use client";

import { LoaderCircle, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MapboxPlaceResult } from "@/features/places/mapbox";
import { createMapboxTripPlace } from "./place-actions";

type SearchState = "idle" | "loading" | "ready" | "empty" | "error";
const inputClass = "h-11 w-full rounded-xl border border-input bg-background/55 pl-10 pr-3 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15";

export function PlaceSearch({ configured, tripId }: { configured: boolean; tripId: string }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapboxPlaceResult[]>([]);
  const [state, setState] = useState<SearchState>("idle");

  useEffect(() => {
    const normalized = query.trim();
    if (!configured || normalized.length < 3) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/mapbox/places?tripId=${encodeURIComponent(tripId)}&q=${encodeURIComponent(normalized)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed");
        const payload = await response.json() as { results?: MapboxPlaceResult[] };
        const nextResults = Array.isArray(payload.results) ? payload.results : [];
        setResults(nextResults);
        setState(nextResults.length ? "ready" : "empty");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
        setState("error");
      }
    }, 350);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [configured, query, tripId]);

  if (!configured) return <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/15 p-4"><p className="text-sm font-medium">Vyhledávání míst zatím není připojené</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Po doplnění Mapbox přístupu zde půjde hledat adresy a geografická místa. Vlastní bod můžete dál uložit ručně.</p></div>;

  return <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
    <label className="text-xs font-medium text-muted-foreground" htmlFor="place-search">Vyhledat adresu nebo místo</label>
    <div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input id="place-search" className={inputClass} value={query} onChange={(event)=>{const value=event.target.value;setQuery(value);setResults([]);setState(value.trim().length>=3?"loading":"idle")}} maxLength={100} placeholder="Například Saltstraumen 33" autoComplete="off"/></div>
    <p className="mt-2 text-xs text-muted-foreground">Zadejte alespoň 3 znaky. Hledání upřednostní země této cesty.</p>
    <div aria-live="polite" className="mt-3">
      {state==="loading"?<p className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin"/> Hledám…</p>:null}
      {state==="empty"?<p className="text-sm text-muted-foreground">Nenalezen žádný odpovídající výsledek.</p>:null}
      {state==="error"?<p className="text-sm text-amber-200">Vyhledávání teď není dostupné. Zkuste to později nebo místo přidejte ručně.</p>:null}
      {state==="ready"?<ul className="grid gap-2">{results.map((result)=><li key={result.providerPlaceId} className="flex flex-col gap-3 rounded-xl border border-border bg-background/45 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><MapPin className="size-4"/></span><div className="min-w-0"><p className="truncate text-sm font-medium">{result.name}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{[result.address,result.city,result.countryCode].filter(Boolean).join(" · ")}</p></div></div><form action={createMapboxTripPlace}><input type="hidden" name="tripId" value={tripId}/><input type="hidden" name="providerPlaceId" value={result.providerPlaceId}/><input type="hidden" name="providerCategory" value={result.providerCategory}/><input type="hidden" name="name" value={result.name}/><input type="hidden" name="address" value={result.address??""}/><input type="hidden" name="city" value={result.city??""}/><input type="hidden" name="countryCode" value={result.countryCode??""}/><input type="hidden" name="latitude" value={result.latitude}/><input type="hidden" name="longitude" value={result.longitude}/><input type="hidden" name="category" value={result.category}/><Button type="submit" size="sm">Uložit</Button></form></li>)}</ul>:null}
    </div>
    <p className="mt-3 text-[0.68rem] text-muted-foreground">Vyhledávání © Mapbox. Ukládají se pouze výsledky permanentního geocodingu.</p>
  </div>;
}
