import { Archive, BedDouble, ChevronLeft, Eye, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { AccommodationForm } from "@/features/accommodation/accommodation-form";
import { getAccommodations } from "@/features/accommodation/accommodation-data";
import { AccommodationList } from "@/features/accommodation/accommodation-list";
import { getTripPlaces } from "@/features/itinerary/itinerary-data";
import { getTripDetail } from "@/features/trips/trip-detail";
import { memberRoleLabel } from "@/features/trips/trip-presentation";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ accommodation?: string; edit?: string; new?: string }>;
};

const messages = {
  created: "Ubytování bylo přidáno.",
  error: "Ubytování se nepodařilo uložit.",
  invalid: "Zkontrolujte termín a vyplněné údaje.",
  "place-error": "Vybrané místo se nepodařilo uložit nebo propojit.",
  removed: "Ubytování bylo odstraněno. Uložené místo zůstalo zachované.",
  updated: "Ubytování bylo upraveno.",
} as const;

export default async function AccommodationPage({ params, searchParams }: Props) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  const [detail, accommodations, places] = await Promise.all([
    getTripDetail(tripId),
    getAccommodations(tripId),
    getTripPlaces(tripId),
  ]);
  if (!detail) notFound();
  const role = detail.members.find((member) => member.user_id === detail.currentUserId)?.role ?? "viewer";
  const archived = detail.trip.status === "archived";
  const canEdit = (role === "owner" || role === "editor") && !archived;
  const selected = query.edit ? accommodations.find((item) => item.id === query.edit) ?? null : null;
  if (query.edit && !selected) notFound();
  const showForm = Boolean(query.new || selected);
  const message = query.accommodation ? messages[query.accommodation as keyof typeof messages] ?? messages.error : null;
  const success = ["created", "updated", "removed"].includes(query.accommodation ?? "");

  return <div className="min-w-0">
    <Link href={`/app/trips/${tripId}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"><ChevronLeft className="size-4" /> Zpět na přehled cesty</Link>
    <header className="mt-3 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="truncate text-xs font-medium tracking-[0.18em] text-primary uppercase">{detail.trip.name}</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl"><BedDouble className="size-8 shrink-0 text-primary" /> Ubytování</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Rezervace, noci, místa a základní stav plateb na jednom místě.</p></div><div className="flex flex-wrap items-center gap-2"><StatusPill tone={canEdit ? "brand" : "neutral"}>{memberRoleLabel(role)}</StatusPill>{canEdit && !showForm ? <Link href={`/app/trips/${tripId}/accommodation?new=1`} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(135deg,var(--primary),var(--brand-highlight))] px-3 text-sm font-medium text-primary-foreground shadow-[0_10px_28px_-12px_var(--brand-glow)]"><Plus className="size-4" /> Přidat ubytování</Link> : null}</div></header>
    {archived ? <Notice icon={<Archive className="size-4" />}>Cesta je archivovaná. Ubytování zůstává pouze pro čtení.</Notice> : !canEdit ? <Notice icon={<Eye className="size-4" />}>Máte přístup pouze pro čtení.</Notice> : null}
    {message ? <div role="status" className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm", success ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-300" : "border-amber-400/20 bg-amber-400/8 text-amber-200")}>{message}</div> : null}

    {showForm ? <Surface depth="panel" className="mt-6 min-w-0 overflow-hidden p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">{selected ? "Detail rezervace" : "Nová rezervace"}</p><h2 className="mt-2 text-xl font-semibold">{selected ? selected.name : "Přidat ubytování"}</h2></div><Link href={`/app/trips/${tripId}/accommodation`} className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground">Zavřít</Link></div><AccommodationForm accommodation={selected} canEdit={canEdit} geoapifyConfigured={Boolean(process.env.GEOAPIFY_API_KEY?.trim())} mapAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim() || null} places={places} trip={detail.trip} /></Surface> : null}
    <AccommodationList canEdit={canEdit} items={accommodations} trip={detail.trip} />
  </div>;
}

function Notice({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) { return <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/8 p-4 text-sm text-muted-foreground"><span className="mt-0.5 shrink-0 text-primary">{icon}</span><p>{children}</p></div>; }
