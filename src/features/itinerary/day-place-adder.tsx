import { MapPinPlus } from "lucide-react";
import { PlaceAutocomplete } from "./place-autocomplete";

export function DayPlaceAdder({ configured, dayId, mapAccessToken, tripId }: { configured: boolean; dayId: string; mapAccessToken: string | null; tripId: string }) {
  return <details className="rounded-2xl border border-primary/35 bg-primary/8 p-4">
    <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-[var(--brand-highlight)]"><MapPinPlus className="size-5" /> Přidat místo</summary>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">Vyhledejte nové místo a jedním krokem ho přidejte na konec programu tohoto dne.</p>
    <PlaceAutocomplete configured={configured} context={{ dayId, kind: "day", tripId }} mapAccessToken={mapAccessToken} />
  </details>;
}
