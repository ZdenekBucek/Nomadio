import { ArrowDown, ArrowUp, Crown, Globe2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import type { TripDestinationRow } from "@/lib/supabase/database.types";

import { addTripDestination, moveTripDestination, removeTripDestination, setPrimaryTripDestination, updateTripDestination } from "./settings-actions";
import { continentLabels, countryFlag, countryOptions } from "./countries";

const controlClassName = "mt-2 h-10 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15";

export function TripDestinations({ canEdit, destinations, tripId }: { canEdit: boolean; destinations: TripDestinationRow[]; tripId: string }) {
  return (
    <div className="mt-6 grid gap-3">
      {destinations.map((destination, index) => (
        <article key={destination.id} className="rounded-2xl border border-border bg-muted/22 p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/12 text-xl">{countryFlag(destination.country_code) || <Globe2 className="size-5 text-primary" aria-hidden="true" />}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{[destination.city, destination.country_name].filter(Boolean).join(", ") || "Bez názvu"}</h3>
                {destination.is_primary ? <StatusPill tone="brand"><Crown className="size-3" aria-hidden="true" /> Hlavní</StatusPill> : null}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Zastávka {index + 1}{destination.continent ? ` · ${continentLabels[destination.continent]}` : ""}</p>
            </div>
          </div>

          {canEdit ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <form action={moveTripDestination}><CommandFields tripId={tripId} destinationId={destination.id} /><input type="hidden" name="direction" value="up" /><Button type="submit" variant="outline" size="sm" disabled={index === 0} aria-label="Posunout destinaci nahoru"><ArrowUp aria-hidden="true" /> Nahoru</Button></form>
              <form action={moveTripDestination}><CommandFields tripId={tripId} destinationId={destination.id} /><input type="hidden" name="direction" value="down" /><Button type="submit" variant="outline" size="sm" disabled={index === destinations.length - 1} aria-label="Posunout destinaci dolů"><ArrowDown aria-hidden="true" /> Dolů</Button></form>
              {!destination.is_primary ? <form action={setPrimaryTripDestination}><CommandFields tripId={tripId} destinationId={destination.id} /><Button type="submit" variant="outline" size="sm"><Crown aria-hidden="true" /> Nastavit jako hlavní</Button></form> : null}
              {!destination.is_primary && destinations.length > 1 ? <form action={removeTripDestination}><CommandFields tripId={tripId} destinationId={destination.id} /><Button type="submit" variant="destructive" size="sm"><Trash2 aria-hidden="true" /> Odebrat</Button></form> : null}
            </div>
          ) : null}

          {canEdit ? (
            <details className="mt-3 rounded-xl border border-border bg-background/25 p-3">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium"><Pencil className="size-4 text-primary" aria-hidden="true" /> Upravit destinaci</summary>
              <form action={updateTripDestination} className="mt-4 grid gap-4 sm:grid-cols-2">
                <CommandFields tripId={tripId} destinationId={destination.id} />
                <DestinationFields destination={destination} />
                <Button type="submit" size="lg" className="sm:col-span-2 sm:justify-self-start">Uložit destinaci</Button>
              </form>
            </details>
          ) : null}
        </article>
      ))}

      {canEdit ? (
        <details className="rounded-2xl border border-dashed border-primary/35 bg-primary/5 p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-[var(--brand-highlight)]"><Plus className="size-4" aria-hidden="true" /> Přidat další destinaci</summary>
          <form action={addTripDestination} className="mt-4 grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="tripId" value={tripId} />
            <DestinationFields />
            <Button type="submit" size="lg" className="sm:col-span-2 sm:justify-self-start"><MapPin aria-hidden="true" /> Přidat destinaci</Button>
          </form>
        </details>
      ) : null}
    </div>
  );
}

function CommandFields({ destinationId, tripId }: { destinationId: string; tripId: string }) {
  return <><input type="hidden" name="tripId" value={tripId} /><input type="hidden" name="destinationId" value={destinationId} /></>;
}

function DestinationFields({ destination }: { destination?: TripDestinationRow }) {
  return <>
    <label className="text-xs font-medium text-muted-foreground">Země<select className={controlClassName} name="countryCode" defaultValue={destination?.country_code ?? ""} required><option value="" disabled>Vyberte zemi</option>{countryOptions.map((country) => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
    <label className="text-xs font-medium text-muted-foreground">Město nebo oblast<input className={controlClassName} name="city" defaultValue={destination?.city ?? ""} maxLength={120} placeholder="Tokio" /></label>
    <label className="text-xs font-medium text-muted-foreground sm:col-span-2">Světadíl<select className={controlClassName} name="continentOverride" defaultValue={destination?.continent_overridden ? destination.continent ?? "" : ""}><option value="">Automaticky podle země</option>{Object.entries(continentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
  </>;
}
