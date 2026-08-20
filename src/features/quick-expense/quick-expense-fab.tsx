"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Plus, ReceiptText, X } from "lucide-react";
import { type CSSProperties, useState } from "react";

import { Button } from "@/components/ui/button";
import { BudgetExpenseForm } from "@/features/budget/budget-expense-form";
import { useVisualViewport } from "@/hooks/use-visual-viewport";
import type { ActiveEditableTrip } from "./active-trips";

export function QuickExpenseFab({ trips }: { trips: ActiveEditableTrip[] }) {
  const [open, setOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<ActiveEditableTrip | null>(trips.length === 1 ? trips[0] ?? null : null);
  const visualViewport = useVisualViewport(open);
  const viewportStyle: CSSProperties | undefined = visualViewport
    ? { height: `${visualViewport.height}px`, top: `${visualViewport.offsetTop}px` }
    : undefined;

  function openFab() {
    setSelectedTrip(trips.length === 1 ? trips[0] ?? null : null);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setSelectedTrip(trips.length === 1 ? trips[0] ?? null : null);
  }

  return <>
    <Button type="button" onClick={openFab} aria-label="Přidat výdaj" title="Přidat výdaj" size="icon-lg" className="fixed right-4 bottom-[var(--mobile-fab-bottom)] z-40 size-14 rounded-full shadow-[0_16px_34px_-12px_var(--brand-glow)] lg:right-8 lg:bottom-8">
      <Plus className="size-6" aria-hidden="true" />
    </Button>
    <Dialog.Root open={open} onOpenChange={(nextOpen) => nextOpen ? setOpen(true) : close()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/72 backdrop-blur-sm transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport
          data-visual-viewport-sheet="quick-expense"
          className="fixed inset-x-0 top-0 z-50 flex h-dvh items-end justify-center overflow-hidden sm:items-center sm:p-5"
          style={viewportStyle}
        >
          <Dialog.Popup className="relative flex max-h-[calc(100%-0.5rem)] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-border bg-card outline-none shadow-[0_30px_100px_-30px_rgba(0,0,0,0.95)] transition data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0 sm:block sm:max-h-[94dvh] sm:max-w-xl sm:overflow-y-auto sm:rounded-[1.75rem]">
            <div className="relative shrink-0 p-5 pb-0 sm:p-6 sm:pb-0">
              <Dialog.Close aria-label="Zavřít rychlý výdaj" className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl border border-border bg-background/75 text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"><X className="size-4" aria-hidden="true" /></Dialog.Close>
              <div className="pr-12"><p className="flex items-center gap-2 text-xs font-medium tracking-[0.16em] text-primary uppercase"><ReceiptText className="size-4" aria-hidden="true" /> Rychlý výdaj</p><Dialog.Title className="mt-2 text-2xl font-semibold">Přidat výdaj</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Stačí částka a kategorie. Podrobnosti můžete doplnit později.</Dialog.Description></div>
            </div>
            <div data-quick-expense-scroll className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-5 pb-[calc(1.25rem+var(--mobile-safe-area-bottom))] sm:overflow-visible sm:px-6 sm:pb-6">
              {selectedTrip ? <>
                <p className="mt-4 rounded-xl border border-border bg-muted/25 px-3 py-2 text-sm text-muted-foreground">Cesta: <strong className="text-foreground">{selectedTrip.name}</strong></p>
                <BudgetExpenseForm defaultOccurredDate={selectedTrip.today} global tripCurrency={selectedTrip.currency} tripId={selectedTrip.id} onGlobalSuccess={close} />
              </> : <TripSelector trips={trips} onSelect={setSelectedTrip} />}
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}

function TripSelector({ trips, onSelect }: { trips: ActiveEditableTrip[]; onSelect: (trip: ActiveEditableTrip) => void }) {
  return <div className="mt-6 space-y-2"><h2 className="text-base font-semibold">Do které cesty přidat výdaj?</h2>{trips.map((trip) => <button key={trip.id} type="button" onClick={() => onSelect(trip)} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-border bg-background/45 px-4 text-left text-sm outline-none transition hover:border-primary/45 hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-primary"><span className="truncate font-medium">{trip.name}</span><span className="ml-3 shrink-0 text-xs text-muted-foreground">{trip.currency}</span></button>)}</div>;
}
