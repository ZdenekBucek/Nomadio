"use client";

import { LoaderCircle, Trash2, Upload } from "lucide-react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { DocumentRow } from "@/lib/supabase/database.types";
import { deleteDocument, updateDocumentMetadata, uploadDocument } from "./document-actions";
import { maxDocumentSizeBytes } from "./document-input";
import { documentCategories, documentCategoryLabels, documentLinkTypeLabels, type DocumentLinkOption } from "./document-model";

const fieldClass = "mt-2 h-11 w-full min-w-0 rounded-xl border border-input bg-background/55 px-3 text-sm outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-65";
const labelClass = "text-xs font-medium text-muted-foreground";

export function DocumentForm({
  canEdit,
  document,
  linkOptions,
  tripId,
}: {
  canEdit: boolean;
  document?: DocumentRow;
  linkOptions: DocumentLinkOption[];
  tripId: string;
}) {
  const action = document ? updateDocumentMetadata : uploadDocument;
  const linkedValue = document?.linked_entity_type && document.linked_entity_id
    ? `${document.linked_entity_type}:${document.linked_entity_id}`
    : "";
  return <form action={canEdit ? action : undefined} className="grid min-w-0 gap-5">
    <input type="hidden" name="tripId" value={tripId} />
    {document ? <input type="hidden" name="documentId" value={document.id} /> : null}
    <fieldset disabled={!canEdit} className="grid min-w-0 gap-5 disabled:opacity-80">
      {!document ? <label className={labelClass}>Soubor *<input className={`${fieldClass} h-auto py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/15 file:px-3 file:py-2 file:text-xs file:font-medium file:text-primary`} type="file" name="file" accept="application/pdf,image/jpeg,image/png" required /><span className="mt-2 block text-[0.68rem] leading-5">PDF, JPG nebo PNG, maximálně {maxDocumentSizeBytes / 1024 / 1024} MB.</span></label> : null}
      <label className={labelClass}>Název dokumentu *<input className={fieldClass} name="name" required maxLength={200} defaultValue={document?.name ?? ""} /></label>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <label className={labelClass}>Kategorie<select className={fieldClass} name="category" defaultValue={document?.category ?? "other"}>{documentCategories.map((category) => <option key={category} value={category}>{documentCategoryLabels[category]}</option>)}</select></label>
        <label className={labelClass}>Patří k<select className={fieldClass} name="linkedEntity" defaultValue={linkedValue}><option value="">Celá cesta</option>{(["accommodation", "transport", "itinerary_item"] as const).map((type) => <optgroup key={type} label={documentLinkTypeLabels[type]}>{linkOptions.filter((option) => option.type === type).map((option) => <option key={`${type}:${option.id}`} value={`${type}:${option.id}`}>{option.label}</option>)}</optgroup>)}</select></label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-muted/18 px-3 text-sm"><input type="checkbox" name="isImportant" defaultChecked={document?.is_important ?? false} className="size-4 accent-primary" /> Důležitý dokument</label>
        <label className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-muted/18 px-3 text-sm"><input type="checkbox" name="offlineEnabled" defaultChecked={document?.offline_enabled ?? false} className="size-4 accent-primary" /> Označit pro offline balík</label>
      </div>
    </fieldset>
    {canEdit ? <div className="flex flex-wrap items-center justify-between gap-3"><SubmitButton label={document ? "Uložit metadata" : "Nahrát dokument"} />{document ? <Button type="submit" variant="destructive" formAction={deleteDocument} onClick={(event) => { if (!window.confirm("Opravdu chcete dokument trvale odstranit?")) event.preventDefault(); }}><Trash2 /> Smazat dokument</Button> : null}</div> : <p className="rounded-xl border border-border bg-muted/20 p-3 text-sm text-muted-foreground">Metadata jsou dostupná pouze pro čtení.</p>}
  </form>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <><LoaderCircle className="animate-spin" /> Ukládám…</> : <><Upload /> {label}</>}</Button>;
}
