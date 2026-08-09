import { Download, FileImage, FileText, Link2, Plus, Star, WifiOff } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import type { DocumentCategory } from "@/lib/supabase/database.types";
import { cn } from "@/lib/utils";
import { documentCategories, documentCategoryLabels, documentSummary, documentTypeLabel, filterDocuments, formatDocumentSize, type DocumentWithLink } from "./document-model";

export function DocumentList({ canEdit, filter, items, tripId }: { canEdit: boolean; filter: "all" | "important" | DocumentCategory; items: DocumentWithLink[]; tripId: string }) {
  const summary = documentSummary(items);
  const visible = filterDocuments(items, filter);
  const base = `/app/trips/${tripId}/documents`;
  const filters = [{ label: "Všechny", value: "all" }, { label: "Důležité", value: "important" }, ...documentCategories.map((category) => ({ label: documentCategoryLabels[category], value: category }))];
  return <div className="mt-6 grid min-w-0 gap-6">
    <section aria-label="Souhrn dokumentů" className="grid gap-3 sm:grid-cols-3">
      <SummaryCard label="Dokumentů" value={summary.total} />
      <SummaryCard label="Důležitých" value={summary.important} />
      <SummaryCard label="Pro offline" value={summary.offline} />
    </section>
    <nav aria-label="Filtr dokumentů" className="flex max-w-full flex-wrap gap-2">{filters.map((item) => <Link key={item.value} href={item.value === "all" ? base : `${base}?filter=${item.value}`} className={cn("rounded-xl border px-3 py-2 text-xs transition", filter === item.value ? "border-primary/35 bg-primary/12 text-primary" : "border-border text-muted-foreground hover:bg-muted/40 hover:text-foreground")}>{item.label}</Link>)}</nav>
    {visible.length ? <section className="grid min-w-0 gap-3 md:grid-cols-2 xl:grid-cols-3">{visible.map((item) => <DocumentCard key={item.id} item={item} tripId={tripId} />)}</section> : <Surface depth="panel" className="p-5 text-center"><FileText className="mx-auto size-9 text-primary" /><h2 className="mt-4 font-medium">{items.length ? "Žádné dokumenty v tomto filtru" : "Zatím zde nejsou žádné dokumenty."}</h2>{items.length ? <p className="mt-2 text-sm text-muted-foreground">Změňte filtr nebo nahrajte první soukromý dokument.</p> : canEdit ? <Link href={`${base}?new=1`} className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="size-4" /> Nahrát dokument</Link> : null}</Surface>}
  </div>;
}

function SummaryCard({ label, value }: { label: string; value: number }) { return <Surface className="p-4"><p className="text-2xl font-semibold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></Surface>; }

function DocumentCard({ item, tripId }: { item: DocumentWithLink; tripId: string }) {
  const Icon = item.mime_type === "application/pdf" ? FileText : FileImage;
  return <Link href={`/app/trips/${tripId}/documents/${item.id}`} className="min-w-0 rounded-2xl border border-border bg-card/60 p-4 transition hover:border-primary/35 hover:bg-card">
    <div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary"><Icon className="size-5" /></span><div className="min-w-0 flex-1"><h2 className="truncate font-medium">{item.name}</h2><div className="mt-2 flex flex-wrap gap-1.5"><StatusPill tone="neutral">{documentCategoryLabels[item.category]}</StatusPill>{item.is_important ? <StatusPill tone="warning"><Star className="size-3" /> Důležité</StatusPill> : null}</div></div></div>
    <dl className="mt-4 grid gap-2 text-xs text-muted-foreground"><div className="flex justify-between gap-3"><dt>Soubor</dt><dd>{documentTypeLabel(item.mime_type)} · {formatDocumentSize(item.size_bytes)}</dd></div><div className="flex min-w-0 justify-between gap-3"><dt className="shrink-0"><Link2 className="inline size-3.5" /> Vazba</dt><dd className="truncate text-right">{item.linkedEntityLabel}</dd></div><div className="flex justify-between gap-3"><dt><WifiOff className="inline size-3.5" /> Offline</dt><dd>{item.offline_enabled ? "Vybráno" : "Nevybráno"}</dd></div></dl>
    <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary"><Download className="size-3.5" /> Zobrazit a stáhnout</span>
  </Link>;
}
