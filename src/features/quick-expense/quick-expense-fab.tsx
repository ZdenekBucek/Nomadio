"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Plus, ReceiptText, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { BudgetExpenseForm } from "@/features/budget/budget-expense-form";
import type { ActiveEditableTrip } from "./active-trips";

export function QuickExpenseFab({ trips }: { trips: ActiveEditableTrip[] }) {
  const [open, setOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<ActiveEditableTrip | null>(trips.length === 1 ? trips[0] ?? null : null);

  function openFab() {
    setSelectedTrip(trips.length === 1 ? trips[0] ?? null : null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setSelectedTrip(trips.length === 1 ? trips[0] ?? null : null);
  }

  return <>
    <Button type="button" onClick={openFab} aria-label="Přidat výdaj" title="Přidat výdaj" size="icon-lg" className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-[0_16px_34px_-12px_var(--brand-glow)] lg:right-8 lg:bottom-8">
      <Plus className="size-6" aria-hidden="true" />
    </Button>
    <Dialog.Root open={open} onOpenChange={(nextOpen) => nextOpen ? setOpen(true) : close()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/72 backdrop-blur-sm transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto sm:items-center sm:p-5">
          <Dialog.Popup className="relative max-h-[94dvh] w-full overflow-y-auto rounded-t-[1.75rem] border border-border bg-card p-5 outline-none shadow-[0_30px_100px_-30px_rgba(0,0,0,0.95)] transition data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0 sm:max-w-xl sm:rounded-[1.75rem] sm:p-6">
            <Dialog.Close aria-label="Zavřít rychlý výdaj" className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl border border-border bg-background/75 text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"><X className="size-4" aria-hidden="true" /></Dialog.Close>
            <div className="pr-12"><p className="flex items-center gap-2 text-xs font-medium tracking-[0.16em] text-primary uppercase"><ReceiptText className="size-4" aria-hidden="true" /> Rychlý výdaj</p><Dialog.Title className="mt-2 text-2xl font-semibold">Přidat výdaj</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Stačí částka a kategorie. Podrobnosti můžete doplnit později.</Dialog.Description></div>
            {selectedTrip ? <>
              <p className="mt-4 rounded-xl border border-border bg-muted/25 px-3 py-2 text-sm text-muted-foreground">Cesta: <strong className="text-foreground">{selectedTrip.name}</strong></p>
              <BudgetExpenseForm defaultOccurredDate={selectedTrip.today} global tripCurrency={selectedTrip.currency} tripId={selectedTrip.id} onGlobalSuccess={close} />
            </> : <TripSelector trips={trips} onSelect={setSelectedTrip} />}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}

function TripSelector({ trips, onSelect }: { trips: ActiveEditableTrip[]; onSelect: (trip: ActiveEditableTrip) => void }) {
  return <div className="mt-6 space-y-2"><h2 className="text-base font-semibold">Do které cesty přidat výdaj?</h2>{trips.map((trip) => <button key={trip.id} type="button" onClick={() => onSelect(trip)} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-background/45 px-4 text-left text-sm outline-none transition hover:border-primary/45 hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-primary"><span className="truncate font-medium">{trip.name}</span><span className="ml-3 shrink-0 text-xs text-muted-foreground">{trip.currency}</span></button>)}</div>;
}
