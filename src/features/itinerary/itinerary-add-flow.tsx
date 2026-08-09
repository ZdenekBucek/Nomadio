"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, Lightbulb, MapPin, MapPinPlus, Plus, StickyNote, X } from "lucide-react";
import { useState } from "react";
import { TimePicker } from "@/components/date-time/time-picker";
import { Button } from "@/components/ui/button";
import type { TripPlaceRow } from "@/lib/supabase/database.types";
import { createItineraryItem } from "./item-actions";
import { PlaceAutocomplete } from "./place-autocomplete";

type ItemChoice = "place" | "activity" | "note";
type PlaceMethod = "search" | "saved" | null;

const control = "mt-2 h-10 w-full rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15";

export function ItineraryAddFlow({
  configured,
  dayId,
  initialPlaceId,
  mapAccessToken,
  onChooseMap,
  places,
  tripId,
}: {
  configured: boolean;
  dayId: string;
  initialPlaceId?: string | null;
  mapAccessToken: string | null;
  onChooseMap: () => void;
  places: TripPlaceRow[];
  tripId: string;
}) {
  const initialPlace = initialPlaceId ? places.find((candidate) => candidate.id === initialPlaceId) ?? null : null;
  const [open, setOpen] = useState(Boolean(initialPlace));
  const [choice, setChoice] = useState<ItemChoice | null>(initialPlace ? "place" : null);
  const [placeMethod, setPlaceMethod] = useState<PlaceMethod>(null);
  const [selectedPlace, setSelectedPlace] = useState<TripPlaceRow | null>(initialPlace);

  function close() {
    setOpen(false);
    setChoice(null);
    setPlaceMethod(null);
    setSelectedPlace(null);
  }

  function back() {
    if (selectedPlace) {
      setSelectedPlace(null);
      return;
    }
    if (placeMethod) {
      setPlaceMethod(null);
      return;
    }
    setChoice(null);
  }

  function chooseMap() {
    close();
    onChooseMap();
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => nextOpen ? setOpen(true) : close()}>
      <Dialog.Trigger
        type="button"
        aria-label="Přidat položku"
        title="Přidat položku"
        className="absolute top-0 right-0 grid size-10 place-items-center rounded-xl text-primary outline-none transition hover:bg-primary/10 hover:text-[var(--brand-highlight)] focus-visible:ring-2 focus-visible:ring-primary sm:size-9"
      >
        <Plus className="size-4" aria-hidden="true" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto sm:items-center sm:p-5">
          <Dialog.Popup className="w-full max-w-xl rounded-t-[1.75rem] border border-border bg-card p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-[0_-24px_70px_-30px_rgba(0,0,0,0.95)] outline-none data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0 sm:max-h-[min(44rem,calc(100vh-2.5rem))] sm:overflow-y-auto sm:rounded-[1.75rem] sm:p-6 sm:shadow-[0_30px_100px_-30px_rgba(0,0,0,0.95)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Dialog.Title className="text-xl font-semibold">Přidat do itineráře</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                  {choice ? "Doplňte údaje nové položky programu." : "Vyberte, co chcete přidat do programu dne."}
                </Dialog.Description>
              </div>
              <Dialog.Close aria-label="Zavřít přidání položky" className="grid size-10 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="size-4" /></Dialog.Close>
            </div>

            {choice ? <Button type="button" variant="ghost" size="sm" onClick={back} className="mt-4 -ml-2"><ArrowLeft /> Zpět</Button> : null}
            {!choice ? <ChoiceStep onChoose={setChoice} /> : null}
            {choice === "place" && !placeMethod && !selectedPlace ? <PlaceMethodStep canChooseMap={Boolean(mapAccessToken)} onChooseMap={chooseMap} onMethod={setPlaceMethod} /> : null}
            {choice === "place" && placeMethod === "search" ? <PlaceAutocomplete configured={configured} context={{ dayId, kind: "day", tripId }} daySubmitLabel="Přidat do itineráře" mapAccessToken={mapAccessToken} /> : null}
            {choice === "place" && placeMethod === "saved" && !selectedPlace ? <SavedPlaceStep places={places} onChoose={setSelectedPlace} /> : null}
            {choice === "place" && selectedPlace ? <ItemForm choice="place" dayId={dayId} place={selectedPlace} places={places} tripId={tripId} /> : null}
            {choice === "activity" ? <ItemForm choice="activity" dayId={dayId} places={places} tripId={tripId} /> : null}
            {choice === "note" ? <ItemForm choice="note" dayId={dayId} places={places} tripId={tripId} /> : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ChoiceStep({ onChoose }: { onChoose: (choice: ItemChoice) => void }) {
  const options = [
    { choice: "place" as const, description: "Vyhledejte, vyberte uložené nebo označte na mapě.", icon: MapPin, title: "Místo" },
    { choice: "activity" as const, description: "Program bez povinného místa na mapě.", icon: Lightbulb, title: "Aktivita" },
    { choice: "note" as const, description: "Volná poznámka, případně s časem.", icon: StickyNote, title: "Poznámka" },
  ];
  return <div className="mt-6 grid gap-3">{options.map((option) => {
    const Icon = option.icon;
    return <button key={option.choice} type="button" onClick={() => onChoose(option.choice)} className="flex min-h-16 items-start gap-3 rounded-2xl border border-border bg-background/30 p-4 text-left transition hover:border-primary/40 hover:bg-primary/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><Icon className="size-5" /></span>
      <span><span className="block font-medium">{option.title}</span><span className="mt-1 block text-sm leading-5 text-muted-foreground">{option.description}</span></span>
    </button>;
  })}</div>;
}

function PlaceMethodStep({ canChooseMap, onChooseMap, onMethod }: { canChooseMap: boolean; onChooseMap: () => void; onMethod: (method: PlaceMethod) => void }) {
  return <div className="mt-6 grid gap-3">
    <p className="text-sm font-medium">Jak chcete vybrat místo?</p>
    <Button type="button" variant="outline" className="min-h-12 justify-start" onClick={() => onMethod("search")}><MapPin /> Vyhledat nové místo</Button>
    <Button type="button" variant="outline" className="min-h-12 justify-start" onClick={() => onMethod("saved")}><MapPinPlus /> Vybrat z uložených míst</Button>
    <Button type="button" variant="outline" className="min-h-12 justify-start" disabled={!canChooseMap} onClick={onChooseMap}><MapPin /> Vybrat místo z mapy</Button>
    {!canChooseMap ? <p className="text-xs text-muted-foreground">Výběr z mapy potřebuje konfiguraci Mapboxu.</p> : null}
  </div>;
}

function SavedPlaceStep({ onChoose, places }: { onChoose: (place: TripPlaceRow) => void; places: TripPlaceRow[] }) {
  if (!places.length) return <div className="mt-6 rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">Zatím nemáte uložené žádné místo. Vyhledejte nové místo nebo ho vyberte na mapě.</div>;
  return <div className="mt-6 grid gap-2"><p className="text-sm font-medium">Uložená místa</p>{places.map((place) => <button key={place.id} type="button" onClick={() => onChoose(place)} className="flex min-h-12 items-start gap-3 rounded-xl border border-border bg-background/30 p-3 text-left transition hover:border-primary/40 hover:bg-primary/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><MapPin className="mt-0.5 size-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block truncate font-medium">{place.name}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{[place.address, place.city].filter(Boolean).join(" · ") || "Bez adresy"}</span></span></button>)}</div>;
}

function ItemForm({ choice, dayId, place, places, tripId }: { choice: ItemChoice; dayId: string; place?: TripPlaceRow; places: TripPlaceRow[]; tripId: string }) {
  const isNote = choice === "note";
  const itemType = isNote ? "note" : "activity";
  const defaultTitle = place?.name ?? "";
  return <form action={createItineraryItem} className="mt-6 grid gap-4 sm:grid-cols-2">
    <input type="hidden" name="tripId" value={tripId} />
    <input type="hidden" name="dayId" value={dayId} />
    <input type="hidden" name="type" value={itemType} />
    {place ? <input type="hidden" name="placeId" value={place.id} /> : null}
    {place ? <div className="rounded-xl border border-primary/25 bg-primary/6 p-3 text-sm sm:col-span-2"><span className="font-medium">Místo</span><span className="ml-2 text-muted-foreground">{place.name}</span></div> : null}
    <label className="text-xs font-medium text-muted-foreground sm:col-span-2">{isNote ? "Poznámka" : "Název"}<input className={control} name="title" defaultValue={defaultTitle} maxLength={160} placeholder={isNote ? "Například: koupit repelent" : "Například: trajekt do Moskenes"} required /></label>
    {!isNote && !place ? <label className="text-xs font-medium text-muted-foreground sm:col-span-2">Místo (volitelné)<select className={control} name="placeId" defaultValue=""><option value="">Bez propojeného místa</option>{places.map((savedPlace) => <option key={savedPlace.id} value={savedPlace.id}>{savedPlace.name}{savedPlace.city ? ` · ${savedPlace.city}` : ""}</option>)}</select></label> : null}
    <TimePicker label="Začátek (volitelný)" name="startTime" />
    <TimePicker label="Konec (volitelný)" name="endTime" />
    <label className="text-xs font-medium text-muted-foreground sm:col-span-2">Doplňující poznámka (volitelná)<textarea className={`${control} h-24 py-3`} name="notes" maxLength={1200} placeholder="Praktické informace nebo připomínka" /></label>
    <div className="flex justify-end sm:col-span-2"><Button type="submit"><Plus /> Přidat do itineráře</Button></div>
  </form>;
}
