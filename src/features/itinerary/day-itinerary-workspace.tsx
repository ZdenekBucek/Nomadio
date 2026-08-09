"use client";

import { useState } from "react";
import { Surface } from "@/components/ui/surface";
import type { ItineraryDayRow, ItineraryItemRow, TripPlaceRow } from "@/lib/supabase/database.types";
import { DayMap } from "@/features/places/day-map";
import type { DayMapModel } from "@/features/places/day-map-view-model";
import { ItineraryAddFlow } from "./itinerary-add-flow";
import { DayTimeline } from "./day-timeline";

export function DayItineraryWorkspace({ canEdit, dayId, days, geoapifyConfigured, initialPlaceId, items, mapAccessToken, mapModel, places, tripId }: { canEdit:boolean; dayId:string; days:ItineraryDayRow[]; geoapifyConfigured:boolean; initialPlaceId?:string|null; items:ItineraryItemRow[]; mapAccessToken:string|null; mapModel:DayMapModel; places:TripPlaceRow[]; tripId:string }) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(() => mapModel.points[0]?.itemId ?? null);
  const [mapPickRequest, setMapPickRequest] = useState(0);

  return <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.82fr)]">
    <Surface depth="panel" className="p-4 sm:p-6">
      <div className="relative mb-4 pr-11"><p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">Program dne</p><h2 className="mt-2 text-xl font-semibold">Timeline</h2><p className="mt-1 text-sm text-muted-foreground">Kliknutím na bod ho zobrazíte na mapě.</p>{canEdit ? <ItineraryAddFlow configured={geoapifyConfigured} dayId={dayId} initialPlaceId={initialPlaceId ?? null} mapAccessToken={mapAccessToken} onChooseMap={() => setMapPickRequest((current) => current + 1)} places={places} tripId={tripId}/> : null}</div>
      <DayTimeline canEdit={canEdit} dayId={dayId} days={days} items={items} onSelectItem={setSelectedItemId} places={places} selectedItemId={selectedItemId} tripId={tripId}/>
    </Surface>
    <div className="xl:sticky xl:top-6"><DayMap accessToken={mapAccessToken} canEdit={canEdit} dayId={dayId} mapPickRequest={mapPickRequest} model={mapModel} onSelectItem={setSelectedItemId} selectedItemId={selectedItemId} tripId={tripId}/></div>
  </div>;
}
