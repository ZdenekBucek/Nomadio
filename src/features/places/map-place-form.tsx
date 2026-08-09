"use client";

import { MapPin, Save, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { placeCategories, placeCategoryLabels } from "./categories";
import { createMapSelectedPlace } from "./map-place-actions";

const control = "mt-2 h-10 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15";

export type DraftCoordinates = { latitude: number; longitude: number };

export function MapPlaceForm({
  dayId,
  draft,
  onCancel,
  onSubmit,
  tripId,
}: {
  dayId?: string;
  draft: DraftCoordinates;
  onCancel: () => void;
  onSubmit?: () => void;
  tripId: string;
}) {
  const [address, setAddress] = useState("");
  const [addressStatus, setAddressStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const requestSequence = useRef(0);

  useEffect(() => {
    const sequence = ++requestSequence.current;
    const controller = new AbortController();
    const params = new URLSearchParams({
      latitude: draft.latitude.toString(),
      longitude: draft.longitude.toString(),
      tripId,
    });
    void fetch(`/api/geoapify/reverse?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("reverse_failed");
        return await response.json() as { address?: unknown };
      })
      .then((payload) => {
        if (sequence !== requestSequence.current || controller.signal.aborted) return;
        if (typeof payload.address === "string" && payload.address.trim()) {
          setAddress(payload.address.trim().slice(0, 300));
          setAddressStatus("ready");
        } else {
          setAddressStatus("unavailable");
        }
      })
      .catch(() => {
        if (sequence === requestSequence.current && !controller.signal.aborted) setAddressStatus("unavailable");
      });
    return () => controller.abort();
  }, [draft.latitude, draft.longitude, tripId]);

  return (
    <div className="border-t border-primary/25 bg-primary/6 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary"><MapPin className="size-5" /></span>
        <div className="min-w-0"><h3 className="font-semibold">Nové vlastní místo</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Dalším kliknutím do mapy můžete pin před uložením přesunout.</p></div>
      </div>
      <form action={createMapSelectedPlace} onSubmit={onSubmit} className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
        <input type="hidden" name="tripId" value={tripId} />
        {dayId ? <input type="hidden" name="dayId" value={dayId} /> : null}
        <input type="hidden" name="latitude" value={draft.latitude} />
        <input type="hidden" name="longitude" value={draft.longitude} />
        <label className="min-w-0 text-xs font-medium text-muted-foreground">Název místa<input className={control} name="name" maxLength={160} placeholder="Moje vyhlídka" required autoFocus /></label>
        <label className="min-w-0 text-xs font-medium text-muted-foreground">Kategorie Nomadia<select className={control} name="category" defaultValue="custom" required>{placeCategories.map((category) => <option key={category} value={category}>{placeCategoryLabels[category]}</option>)}</select></label>
        <label className="min-w-0 text-xs font-medium text-muted-foreground sm:col-span-2">Adresa<input className={control} name="address" maxLength={300} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Adresa je volitelná" aria-describedby="map-place-address-status" /></label>
        <p id="map-place-address-status" role="status" className="-mt-2 text-xs text-muted-foreground sm:col-span-2">
          {addressStatus === "loading" ? "Hledám adresu…" : addressStatus === "unavailable" ? "Adresu se nepodařilo zjistit. Místo můžete uložit i bez ní." : "Adresu můžete před uložením upravit."}
        </p>
        <label className="min-w-0 text-xs font-medium text-muted-foreground sm:col-span-2">Poznámka<textarea className={`${control} h-24 resize-y py-2`} name="notes" maxLength={1200} placeholder="Volitelná poznámka k místu" /></label>
        <div className="flex min-w-0 items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm sm:col-span-2"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 text-primary" aria-hidden="true">✓</span><div><p className="font-medium text-foreground">Bod je umístěn na mapě</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Pozici můžete změnit novým výběrem na mapě.</p></div></div>
        {dayId ? <label className="flex min-w-0 items-start gap-3 rounded-xl border border-border bg-background/30 p-3 text-sm sm:col-span-2"><input className="mt-1 size-4 shrink-0 accent-primary" type="checkbox" name="addToDay" defaultChecked /><span><span className="font-medium">Přidat rovnou do tohoto dne</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Vytvoří jeden bod na konci timeline a propojí ho s právě vytvořeným místem.</span></span></label> : null}
        <div className="flex min-w-0 flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onCancel}><X /> Zrušit</Button>
          <Button type="submit"><Save /> Uložit místo</Button>
        </div>
      </form>
    </div>
  );
}
