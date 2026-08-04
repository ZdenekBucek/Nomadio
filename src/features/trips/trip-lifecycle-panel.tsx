"use client";

import { Archive, ArchiveRestore, Trash2 } from "lucide-react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

import { archiveTrip, deleteTrip, restoreTrip, type TripDeletionActionState } from "./lifecycle-actions";

const initialDeleteState: TripDeletionActionState = { error: null };

export function TripLifecyclePanel({ archived, tripId, tripName }: { archived: boolean; tripId: string; tripName: string }) {
  const [deleteState, deleteAction, deletePending] = useActionState(deleteTrip, initialDeleteState);
  const deleteError = deleteState.error === "mismatch"
    ? "Zadaný název se neshoduje s názvem cesty."
    : deleteState.error === "invalid"
      ? "Pro potvrzení zadejte celý název cesty."
      : deleteState.error === "delete"
        ? "Cestu se nepodařilo odstranit. Zkuste to znovu."
        : null;

  return (
    <Surface depth="panel" className="mt-5 border-destructive/20 p-5 sm:p-6">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] text-destructive uppercase">Nebezpečná zóna</p>
        <h2 className="mt-2 text-xl font-semibold">Životní cyklus cesty</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Tyto akce může provést pouze vlastník cesty.</p>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/22 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium">{archived ? "Obnovit cestu" : "Archivovat cestu"}</h3>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{archived ? "Cesta se vrátí do původního stavu a bude ji možné znovu upravovat." : "Cesta zůstane dostupná v Archivu, ale její obsah bude pouze pro čtení."}</p>
          </div>
          <form action={archived ? restoreTrip : archiveTrip}>
            <input type="hidden" name="tripId" value={tripId} />
            <Button type="submit" variant="outline" size="lg" className="w-full sm:w-auto">{archived ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}{archived ? "Obnovit cestu" : "Archivovat cestu"}</Button>
          </form>
        </div>

        <details className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-destructive marker:hidden"><Trash2 className="size-4" aria-hidden="true" /> Trvale odstranit cestu</summary>
          <div className="mt-4 border-t border-destructive/15 pt-4">
            <p className="text-xs leading-5 text-muted-foreground">Odstraní se cesta, její destinace, cestovatelé i přístupy. Tuto akci nelze vrátit zpět.</p>
            <form action={deleteAction} className="mt-4 grid gap-3">
              <input type="hidden" name="tripId" value={tripId} />
              <label className="text-xs font-medium text-muted-foreground">Pro potvrzení napište přesně <strong className="text-foreground">{tripName}</strong><input className="mt-2 h-11 w-full rounded-xl border border-destructive/25 bg-background/55 px-3 text-sm text-foreground outline-none transition focus:border-destructive/55 focus:ring-3 focus:ring-destructive/15" name="confirmationName" autoComplete="off" maxLength={120} required /></label>
              {deleteError ? <p role="alert" className="text-xs text-destructive">{deleteError}</p> : null}
              <Button type="submit" variant="destructive" size="lg" className="justify-self-start" disabled={deletePending}><Trash2 aria-hidden="true" />{deletePending ? "Odstraňuji…" : "Trvale odstranit cestu"}</Button>
            </form>
          </div>
        </details>
      </div>
    </Surface>
  );
}
