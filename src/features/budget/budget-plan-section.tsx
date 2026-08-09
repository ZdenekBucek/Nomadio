"use client";

import { Dialog } from "@base-ui/react/dialog";
import type { LucideIcon } from "lucide-react";
import { BedDouble, Car, HeartPulse, Landmark, Pencil, Plane, Plus, ReceiptText, ShieldCheck, ShoppingBag, Ticket, Utensils, WalletCards, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { BudgetCategory } from "@/lib/supabase/database.types";
import type { BudgetPlanItem } from "./budget-domain";
import { BudgetPlanForm } from "./budget-plan-form";
import { budgetCategoryPathLabel } from "./budget-categories";
import { formatBudgetMoney } from "./budget-model";

const categoryIcons: Record<BudgetCategory, LucideIcon> = {
  accommodation: BedDouble,
  activities: Ticket,
  car: Car,
  fees: Landmark,
  food: Utensils,
  health: HeartPulse,
  other: WalletCards,
  shopping: ShoppingBag,
  transport: Plane,
  travel_services: ShieldCheck,
};

export function BudgetPlanSection({ canEdit, items, tripCurrency, tripId }: {
  canEdit: boolean;
  items: BudgetPlanItem[];
  tripCurrency: string;
  tripId: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<BudgetPlanItem | null>(null);

  function openCreate() {
    setSelected(null);
    setOpen(true);
  }

  function openEdit(item: BudgetPlanItem) {
    setSelected(item);
    setOpen(true);
  }

  return (
    <section aria-labelledby="plan-items-title" className="min-w-0">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 id="plan-items-title" className="text-xl font-semibold">Plánovaný rozpočet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Očekávané náklady před cestou.</p>
        </div>
        {canEdit ? <Button type="button" size="lg" className="hidden sm:inline-flex" onClick={openCreate}><Plus aria-hidden="true" /> Přidat plán</Button> : null}
      </div>

      {items.length ? <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card/55">
        {items.map((item, index) => {
          const Icon = categoryIcons[item.category];
          return <article key={item.id} className={`flex min-w-0 items-center gap-3 p-4 ${index ? "border-t border-border/70" : ""}`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium">{item.name}</h3>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{budgetCategoryPathLabel(item.category, item.subcategory)}</p>
              {item.notes ? <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">{item.notes}</p> : null}
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold tabular-nums">{formatBudgetMoney(item.plannedAmount, item.currency)}</p>
              {canEdit ? <button type="button" onClick={() => openEdit(item)} className="mt-1 inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground outline-none transition hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"><Pencil className="size-3.5" aria-hidden="true" /> Upravit</button> : null}
            </div>
          </article>;
        })}
      </div> : <Surface className="mt-4 flex items-start gap-3 p-5 text-sm text-muted-foreground"><ReceiptText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="font-medium text-foreground">Plán je zatím prázdný.</p><p className="mt-1">Přidejte očekávané náklady podle kategorií.</p></div></Surface>}

      {canEdit ? <Button type="button" size="lg" className="sticky bottom-20 z-20 mt-4 w-full sm:hidden" onClick={openCreate}><Plus aria-hidden="true" /> Přidat plán</Button> : null}

      <Dialog.Root open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setSelected(null); }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/72 backdrop-blur-sm transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto sm:items-center sm:p-5">
            <Dialog.Popup className="relative max-h-[94dvh] w-full overflow-y-auto rounded-t-[1.75rem] border border-border bg-card p-5 outline-none shadow-[0_30px_100px_-30px_rgba(0,0,0,0.95)] transition data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0 sm:max-w-xl sm:rounded-[1.75rem] sm:p-6">
              <div className="pr-12">
                <p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Plánovaný náklad</p>
                <Dialog.Title className="mt-2 text-2xl font-semibold">{selected ? "Upravit plán" : "Přidat plán"}</Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-muted-foreground">Částka vyjadřuje očekávaný náklad, nikoli uskutečněnou platbu.</Dialog.Description>
              </div>
              <Dialog.Close aria-label="Zavřít plán" className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl border border-border bg-background/75 text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"><X className="size-4" aria-hidden="true" /></Dialog.Close>
              <BudgetPlanForm key={selected?.id ?? "new"} item={selected} tripCurrency={tripCurrency} tripId={tripId} />
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
