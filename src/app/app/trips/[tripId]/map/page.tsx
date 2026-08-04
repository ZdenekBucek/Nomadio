import { ChevronLeft, MapPinned } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItineraryDays, getTripPlaces } from "@/features/itinerary/itinerary-data";
import { createTripMapModel } from "@/features/places/map-view-model";
import { TripMap } from "@/features/places/trip-map";
import { getTripDetail } from "@/features/trips/trip-detail";

type Props={params:Promise<{tripId:string}>};

export default async function TripMapPage({params}:Props){
  const{tripId}=await params;
  const[detail,places,days]=await Promise.all([getTripDetail(tripId),getTripPlaces(tripId),getItineraryDays(tripId)]);
  if(!detail)notFound();
  const model=createTripMapModel(places);
  return <div>
    <Link href={`/app/trips/${tripId}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"><ChevronLeft className="size-4"/> Zpět na přehled cesty</Link>
    <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{detail.trip.name}</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl"><MapPinned className="size-8 text-primary"/> Mapa</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Prohlédněte si uložená místa v kontextu celé cesty.</p></div><div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded-full border border-border bg-muted/30 px-3 py-1.5">{places.length} míst</span><span className="rounded-full border border-border bg-muted/30 px-3 py-1.5">{days.length} dní</span></div></header>
    <TripMap accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim()||null} model={model}/>
  </div>;
}
