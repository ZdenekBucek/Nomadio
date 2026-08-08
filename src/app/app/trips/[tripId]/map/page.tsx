import { ChevronLeft, MapPinned } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getItineraryDays, getTripPlaces } from "@/features/itinerary/itinerary-data";
import { createTripMapModel } from "@/features/places/map-view-model";
import { TripMap } from "@/features/places/trip-map";
import { getTripDetail } from "@/features/trips/trip-detail";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

type Props={params:Promise<{tripId:string}>;searchParams:Promise<{mapPlace?:string}>};
const messages={created:"Vlastní místo bylo uloženo.",invalid:"Zkontrolujte název, kategorii a souřadnice místa.",error:"Vlastní místo se nepodařilo uložit."}as const;

export default async function TripMapPage({params,searchParams}:Props){
  const[{tripId},query]=await Promise.all([params,searchParams]);
  const supabase=await createClient();
  const[detail,places,days,roleResult]=await Promise.all([getTripDetail(tripId),getTripPlaces(tripId),getItineraryDays(tripId),supabase.rpc("trip_role",{target_trip_id:tripId})]);
  if(!detail)notFound();
  if(roleResult.error)throw roleResult.error;
  const role=roleResult.data??"viewer";
  const canEdit=(role==="owner"||role==="editor")&&detail.trip.status!=="archived";
  const message=query.mapPlace?messages[query.mapPlace as keyof typeof messages]??messages.error:null;
  const model=createTripMapModel(places);
  return <div>
    <Link href={`/app/trips/${tripId}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"><ChevronLeft className="size-4"/> Zpět na přehled cesty</Link>
    <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{detail.trip.name}</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl"><MapPinned className="size-8 text-primary"/> Mapa</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Prohlédněte si uložená místa v kontextu celé cesty.</p></div><div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded-full border border-border bg-muted/30 px-3 py-1.5">{places.length} míst</span><span className="rounded-full border border-border bg-muted/30 px-3 py-1.5">{days.length} dní</span></div></header>
    {message?<div role="status" className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm",query.mapPlace==="created"?"border-emerald-400/20 bg-emerald-400/8 text-emerald-300":"border-amber-400/20 bg-amber-400/8 text-amber-200")}>{message}</div>:null}
    <TripMap accessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim()||null} canEdit={canEdit} model={model} tripId={tripId}/>
  </div>;
}
