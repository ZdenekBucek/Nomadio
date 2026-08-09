import { Archive, ChevronLeft, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/ui/status-pill";
import { DocumentDetail } from "@/features/documents/document-detail";
import { getDocumentDetail } from "@/features/documents/document-data";
import { getTripDetail } from "@/features/trips/trip-detail";
import { memberRoleLabel } from "@/features/trips/trip-presentation";

type Props = { params: Promise<{ documentId: string; tripId: string }>; searchParams: Promise<{ documents?: string }> };

export default async function DocumentPage({ params, searchParams }: Props) {
  const [{ documentId, tripId }, query] = await Promise.all([params, searchParams]);
  const [trip, detail] = await Promise.all([getTripDetail(tripId), getDocumentDetail(tripId, documentId)]);
  if (!trip || !detail) notFound();
  const role = trip.members.find((member) => member.user_id === trip.currentUserId)?.role ?? "viewer";
  const archived = trip.trip.status === "archived";
  const canEdit = (role === "owner" || role === "editor") && !archived;
  return <div className="min-w-0"><Link href={`/app/trips/${tripId}/documents`} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"><ChevronLeft className="size-4" /> Zpět na dokumenty</Link>
    <header className="mt-3 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><p className="truncate text-xs font-medium tracking-[0.18em] text-primary uppercase">{trip.trip.name}</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl"><FileText className="size-8 shrink-0 text-primary" /> {detail.document.name}</h1></div><StatusPill tone={canEdit ? "brand" : "neutral"}>{memberRoleLabel(role)}</StatusPill></header>
    {archived ? <Notice icon={<Archive className="size-4" />}>Archivovaný trip je pouze pro čtení.</Notice> : !canEdit ? <Notice icon={<Eye className="size-4" />}>Dokument můžete zobrazit a stáhnout.</Notice> : null}
    {query.documents === "updated" ? <div role="status" className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-300">Metadata dokumentu byla upravena.</div> : null}
    <div className="mt-6"><DocumentDetail canEdit={canEdit} document={detail.document} linkOptions={detail.linkOptions} signedUrl={detail.signedUrl} timezone={trip.trip.timezone} /></div>
  </div>;
}

function Notice({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) { return <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/8 p-4 text-sm text-muted-foreground"><span className="mt-0.5 shrink-0 text-primary">{icon}</span><p>{children}</p></div>; }
