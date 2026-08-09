import { CalendarDays, Download, ExternalLink, FileWarning, Link2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { formatTripDateTime } from "@/lib/date-time";
import { DocumentForm } from "./document-form";
import { documentCategoryLabels, documentTypeLabel, formatDocumentSize, type DocumentLinkOption, type DocumentWithLink } from "./document-model";

export function DocumentDetail({ canEdit, document, linkOptions, signedUrl, timezone }: { canEdit: boolean; document: DocumentWithLink; linkOptions: DocumentLinkOption[]; signedUrl: string | null; timezone: string }) {
  const date = formatTripDateTime(document.created_at, timezone);
  return <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
    <Surface depth="panel" className="min-w-0 overflow-hidden p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Soukromý náhled</p><h2 className="mt-2 text-xl font-semibold">{document.name}</h2></div>{signedUrl ? <a href={signedUrl} download className={buttonVariants()}><Download /> Stáhnout</a> : null}</div>
      {signedUrl ? <object className="mt-5 h-[60vh] min-h-80 w-full rounded-xl border border-border bg-white" data={signedUrl} type={document.mime_type} aria-label={`Náhled dokumentu ${document.name}`}><a href={signedUrl} className="p-4 text-primary">Otevřít dokument <ExternalLink className="inline size-4" /></a></object> : <div className="mt-5 grid min-h-72 place-items-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground"><div><FileWarning className="mx-auto size-8 text-amber-300" /><p className="mt-3">Náhled se nepodařilo bezpečně připravit. Metadata zůstávají dostupná.</p></div></div>}
    </Surface>
    <div className="grid content-start gap-6"><Surface className="p-4 sm:p-5"><h2 className="font-medium">Metadata</h2><dl className="mt-4 grid gap-3 text-sm"><Meta label="Kategorie" value={documentCategoryLabels[document.category]} /><Meta label="Typ a velikost" value={`${documentTypeLabel(document.mime_type)} · ${formatDocumentSize(document.size_bytes)}`} /><Meta label="Vazba" value={document.linkedEntityLabel} icon={<Link2 className="size-3.5" />} /><Meta label="Nahráno" value={date} icon={<CalendarDays className="size-3.5" />} /><Meta label="Důležitý" value={document.is_important ? "Ano" : "Ne"} /><Meta label="Offline balík" value={document.offline_enabled ? "Vybráno" : "Nevybráno"} /></dl></Surface><Surface className="p-4 sm:p-5"><h2 className="font-medium">Upravit dokument</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Soubor nelze nahradit; můžete bezpečně změnit jeho metadata a vazbu.</p><div className="mt-5"><DocumentForm canEdit={canEdit} document={document} linkOptions={linkOptions} tripId={document.trip_id} /></div></Surface></div>
  </div>;
}

function Meta({ icon, label, value }: { icon?: React.ReactNode; label: string; value: string }) { return <div className="flex min-w-0 items-start justify-between gap-4 border-b border-border/60 pb-3 last:border-0 last:pb-0"><dt className="flex shrink-0 items-center gap-1.5 text-muted-foreground">{icon}{label}</dt><dd className="min-w-0 text-right font-medium break-words">{value}</dd></div>; }
