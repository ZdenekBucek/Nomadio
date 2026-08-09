import { Archive, ChevronLeft, Eye, MapPinned, Settings2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { getTripDetail } from "@/features/trips/trip-detail";
import { TripDestinations } from "@/features/trips/trip-destinations";
import { TripLifecyclePanel } from "@/features/trips/trip-lifecycle-panel";
import { memberRoleLabel } from "@/features/trips/trip-presentation";
import { TripSettingsForm } from "@/features/trips/trip-settings-form";
import { getTripCover } from "@/features/trips/trip-cover";
import { cn } from "@/lib/utils";

type TripSettingsPageProps = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ cover?: string; destination?: string; lifecycle?: string; settings?: string }>;
};

const destinationMessages = {
  added: "Destinace byla přidána.",
  updated: "Destinace byla upravena.",
  moved: "Pořadí destinací bylo změněno.",
  primary: "Hlavní destinace byla změněna.",
  removed: "Destinace byla odebrána.",
  boundary: "Destinace už je na kraji seznamu.",
  "no-change": "Tato destinace už je hlavní.",
  "last-destination": "Poslední destinaci nelze odebrat.",
  "primary-destination": "Nejdřív zvolte jinou hlavní destinaci.",
  invalid: "Zkontrolujte údaje destinace.",
  error: "Změnu destinace se nepodařilo uložit.",
} as const;

export default async function TripSettingsPage({ params, searchParams }: TripSettingsPageProps) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  const detail = await getTripDetail(tripId);
  if (!detail) notFound();

  const membership = detail.members.find((member) => member.user_id === detail.currentUserId);
  const role = membership?.role ?? "viewer";
  const isArchived = detail.trip.status === "archived";
  const canEdit = (role === "owner" || role === "editor") && !isArchived;
  const destinationMessage = query.destination
    ? destinationMessages[query.destination as keyof typeof destinationMessages] ?? destinationMessages.error
    : null;
  const success = ["added", "updated", "moved", "primary", "removed"].includes(query.destination ?? "");
  const cover = await getTripCover(detail.trip);
  const coverMessage = query.cover === "uploaded" ? "Obrázek cesty byl nahrán." : query.cover === "removed" ? "Obrázek cesty byl odstraněn." : query.cover ? "Obrázek se nepodařilo změnit. Zkontrolujte formát a velikost souboru." : null;

  return (
    <div>
      <Link href={`/app/trips/${tripId}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden="true" /> Zpět na přehled cesty
      </Link>

      <header className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-primary uppercase">{detail.trip.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">Nastavení cesty</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Upravte základní údaje, vzhled a pořadí destinací na jednom místě.</p>
        </div>
        <StatusPill tone={canEdit ? "brand" : "neutral"}>{memberRoleLabel(role)}</StatusPill>
      </header>

      {isArchived ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4 text-sm text-amber-100"><Archive className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p>Cesta je archivovaná. Veškerý obsah je pouze pro čtení; vlastník ji může níže obnovit.</p></div> : !canEdit ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/8 p-4 text-sm text-muted-foreground"><Eye className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><p>Máte přístup pouze pro čtení. Nastavení i destinace můžete prohlížet, ale ne měnit.</p></div> : null}
      {query.settings === "saved" ? <Feedback success>Základní nastavení bylo uloženo.</Feedback> : null}
      {coverMessage ? <Feedback success={query.cover === "uploaded" || query.cover === "removed"}>{coverMessage}</Feedback> : null}
      {query.lifecycle === "error" ? <Feedback success={false}>Akci se nepodařilo provést. Ověřte stav cesty a zkuste to znovu.</Feedback> : null}
      {destinationMessage ? <Feedback success={success}>{destinationMessage}</Feedback> : null}

      <div className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.85fr)]">
        <Surface depth="panel" className="p-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><Settings2 className="size-5" aria-hidden="true" /></span><div><h2 className="text-xl font-semibold">Základní údaje</h2><p className="mt-1 text-sm text-muted-foreground">Název, termín, měna, stav a barevný motiv.</p></div></div>
          <TripSettingsForm canEdit={canEdit} cover={cover} trip={detail.trip} />
        </Surface>

        <Surface depth="panel" className="p-5 sm:p-6">
          <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><MapPinned className="size-5" aria-hidden="true" /></span><div><h2 className="text-xl font-semibold">Destinace</h2><p className="mt-1 text-sm text-muted-foreground">Hlavní místo a navazující zastávky v pořadí cesty.</p></div></div>
          <TripDestinations canEdit={canEdit} destinations={detail.destinations} tripId={tripId} />
        </Surface>
      </div>
      {role === "owner" ? <TripLifecyclePanel archived={isArchived} tripId={tripId} tripName={detail.trip.name} /> : null}
    </div>
  );
}

function Feedback({ children, success }: { children: React.ReactNode; success: boolean }) {
  return <div role="status" className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm", success ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-300" : "border-amber-400/20 bg-amber-400/8 text-amber-200")}>{children}</div>;
}
