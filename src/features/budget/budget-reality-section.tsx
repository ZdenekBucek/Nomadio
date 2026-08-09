"use client";

import { Dialog } from "@base-ui/react/dialog";
import { BedDouble, CircleDollarSign, ExternalLink, Pencil, Plane, Plus, ReceiptText, TrendingUp, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import { budgetCategoryLabels, budgetCategoryPathLabel } from "./budget-categories";
import type { TripBudgetDashboard } from "./budget-dashboard-model";
import type { BudgetManualExpenseItem, BudgetRealityItem } from "./budget-domain";
import { BudgetExpenseForm } from "./budget-expense-form";
import { formatBudgetMoney } from "./budget-model";

export type ExpenseTimelineGroup = {
  date: string;
  items: BudgetManualExpenseItem[];
  label: string;
};

export function groupExpensesByDate(items: BudgetManualExpenseItem[], today: string): ExpenseTimelineGroup[] {
  const yesterdayDate = new Date(`${today}T00:00:00Z`);
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1);
  const yesterday = yesterdayDate.toISOString().slice(0, 10);
  const groups = new Map<string, BudgetManualExpenseItem[]>();
  for (const item of items) {
    const date = item.occurredAt.slice(0, 10);
    groups.set(date, [...(groups.get(date) ?? []), item]);
  }
  return [...groups.entries()]
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([date, dateItems]) => ({
      date,
      items: dateItems,
      label: date === today
        ? "Dnes"
        : date === yesterday
          ? "Včera"
          : new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${date}T00:00:00Z`)),
    }));
}

export function BudgetRealitySection({ canEdit, comparison, reality, today, tripCurrency, tripId }: {
  canEdit: boolean;
  comparison: TripBudgetDashboard["comparison"];
  reality: TripBudgetDashboard["reality"];
  today: string;
  tripCurrency: string;
  tripId: string;
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<BudgetManualExpenseItem | null>(null);
  const timeline = groupExpensesByDate(reality.manualExpenses, today);
  const confirmed = [...reality.accommodationItems, ...reality.transportItems]
    .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt) || left.title.localeCompare(right.title, "cs"));

  function openCreate() {
    setSelected(null);
    setOpen(true);
  }

  function openEdit(item: BudgetManualExpenseItem) {
    setSelected(item);
    setOpen(true);
  }

  return <div className="min-w-0 space-y-7">
    <section aria-labelledby="reality-total-title">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 id="reality-total-title" className="text-xl font-semibold">Skutečné náklady</h2><p className="mt-1 text-sm text-muted-foreground">Vzniklé výdaje bez ohledu na stav platby.</p></div>
        {canEdit ? <Button type="button" size="lg" className="hidden sm:inline-flex" onClick={openCreate}><Plus aria-hidden="true" /> Výdaj</Button> : null}
      </div>
      {comparison.byCurrency.length ? <div className={cn("mt-4 grid gap-3", comparison.byCurrency.length > 1 && "lg:grid-cols-2")}>
        {comparison.byCurrency.map((group) => {
          const percentage = group.plannedAmount > 0 ? Math.round((group.realityAmount / group.plannedAmount) * 100) : null;
          return <Surface key={group.currency} className="min-w-0 p-4">
            <div className="flex min-w-0 items-end justify-between gap-4"><div className="min-w-0"><p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">{group.currency}</p><p className="mt-1 truncate text-2xl font-semibold tabular-nums">{formatBudgetMoney(group.realityAmount, group.currency)}</p></div><p className={cn("shrink-0 text-sm font-medium", group.status === "over_budget" ? "text-destructive" : "text-muted-foreground")}>{percentage === null ? "Bez plánu" : `${percentage} % plánu`}</p></div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted/70"><div className={cn("h-full rounded-full", group.status === "over_budget" ? "bg-destructive" : "bg-primary")} style={{ width: `${percentage === null ? 0 : Math.min(percentage, 100)}%` }} /></div>
          </Surface>;
        })}
      </div> : <Surface className="mt-4 p-4 text-sm text-muted-foreground">Zatím nejsou evidované žádné skutečné náklady.</Surface>}
      {comparison.byCurrency.length > 1 ? <p className="mt-2 text-xs text-muted-foreground">Měny jsou oddělené. Bez FX kurzu nevzniká společný total.</p> : null}
    </section>

    <section aria-labelledby="manual-expenses-title">
      <h2 id="manual-expenses-title" className="text-lg font-semibold">Výdaje</h2>
      {timeline.length ? <div className="mt-3 space-y-5">{timeline.map((group) => <div key={group.date}><h3 className="mb-2 text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">{group.label}</h3><div className="overflow-hidden rounded-2xl border border-border bg-card/55">{group.items.map((item, index) => <ExpenseRow key={item.id} canEdit={canEdit} item={item} onEdit={() => openEdit(item)} separated={index > 0} />)}</div></div>)}</div> : <Surface className="mt-3 flex items-start gap-3 p-5 text-sm text-muted-foreground"><ReceiptText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="font-medium text-foreground">Žádné manuální výdaje.</p><p className="mt-1">Rychlý výdaj můžete přidat částkou a kategorií.</p></div></Surface>}
    </section>

    <ConfirmedCosts items={confirmed} tripId={tripId} />
    <CategoryComparison items={comparison.byCategory} />

    {canEdit ? <Button type="button" size="lg" className="sticky bottom-20 z-20 w-full sm:hidden" onClick={openCreate}><Plus aria-hidden="true" /> Výdaj</Button> : null}

    <Dialog.Root open={open} onOpenChange={(nextOpen) => { setOpen(nextOpen); if (!nextOpen) setSelected(null); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/72 backdrop-blur-sm transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto sm:items-center sm:p-5">
          <Dialog.Popup className="relative max-h-[94dvh] w-full overflow-y-auto rounded-t-[1.75rem] border border-border bg-card p-5 outline-none shadow-[0_30px_100px_-30px_rgba(0,0,0,0.95)] transition data-ending-style:translate-y-4 data-ending-style:opacity-0 data-starting-style:translate-y-4 data-starting-style:opacity-0 sm:max-w-xl sm:rounded-[1.75rem] sm:p-6">
            <div className="pr-12"><p className="text-xs font-medium tracking-[0.16em] text-primary uppercase">Realita</p><Dialog.Title className="mt-2 text-2xl font-semibold">{selected ? "Upravit výdaj" : "Nový výdaj"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Pro rychlé uložení stačí částka a kategorie.</Dialog.Description></div>
            <Dialog.Close aria-label="Zavřít výdaj" className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl border border-border bg-background/75 text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"><X className="size-4" aria-hidden="true" /></Dialog.Close>
            <BudgetExpenseForm key={selected?.id ?? "new"} item={selected} tripCurrency={tripCurrency} tripId={tripId} />
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  </div>;
}

function ExpenseRow({ canEdit, item, onEdit, separated }: { canEdit: boolean; item: BudgetManualExpenseItem; onEdit: () => void; separated: boolean }) {
  return <article className={cn("flex min-w-0 items-center gap-3 p-4", separated && "border-t border-border/70")}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CircleDollarSign className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><h4 className="truncate font-medium">{item.enteredTitle ?? budgetCategoryLabels[item.category]}</h4><p className="mt-0.5 truncate text-xs text-muted-foreground">{budgetCategoryPathLabel(item.category, item.subcategory)} · {new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric" }).format(new Date(item.occurredAt))}</p></div><div className="shrink-0 text-right"><p className="font-semibold tabular-nums">{formatBudgetMoney(item.amount, item.currency)}</p>{canEdit ? <button type="button" onClick={onEdit} className="mt-1 inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground outline-none transition hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"><Pencil className="size-3.5" aria-hidden="true" /> Upravit</button> : null}</div></article>;
}

function ConfirmedCosts({ items, tripId }: { items: BudgetRealityItem[]; tripId: string }) {
  return <section aria-labelledby="confirmed-costs-title"><div className="flex items-center gap-2"><TrendingUp className="size-5 text-primary" aria-hidden="true" /><h2 id="confirmed-costs-title" className="text-lg font-semibold">Potvrzené náklady</h2></div>{items.length ? <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card/55">{items.map((item, index) => { const accommodation = item.origin === "accommodation"; const Icon = accommodation ? BedDouble : Plane; const sourcePath = `/app/trips/${tripId}/${accommodation ? "accommodation" : "transport"}`; const href = item.sourceId ? `${sourcePath}?edit=${item.sourceId}` : sourcePath; return <article key={item.id} className={cn("flex min-w-0 items-center gap-3 p-4", index > 0 && "border-t border-border/70")}><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted/55 text-muted-foreground"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><h3 className="truncate font-medium">{item.title}</h3><p className="mt-0.5 text-xs text-muted-foreground">{accommodation ? "Ubytování" : "Doprava"} · pouze pro čtení</p></div><div className="shrink-0 text-right"><p className="font-semibold tabular-nums">{formatBudgetMoney(item.amount, item.currency)}</p><Link href={href} className="mt-1 inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground outline-none transition hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary">Zdroj <ExternalLink className="size-3" aria-hidden="true" /></Link></div></article>; })}</div> : <Surface className="mt-3 p-4 text-sm text-muted-foreground">Ubytování ani Doprava zatím nemají potvrzený náklad.</Surface>}</section>;
}

function CategoryComparison({ items }: { items: TripBudgetDashboard["comparison"]["byCategory"] }) {
  return <section aria-labelledby="category-comparison-title"><h2 id="category-comparison-title" className="text-lg font-semibold">Plán vs Realita</h2>{items.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{items.map((item) => <Surface key={`${item.currency}-${item.category}`} className="min-w-0 p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-medium">{budgetCategoryLabels[item.category]}</h3><p className="mt-1 text-xs text-muted-foreground">{formatBudgetMoney(item.plannedAmount, item.currency)} plán</p><p className="mt-0.5 text-xs text-muted-foreground">{formatBudgetMoney(item.realityAmount, item.currency)} realita</p></div>{item.status === "over_budget" ? <span className="shrink-0 rounded-lg bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">Překročeno</span> : item.status === "no_plan" && item.realityAmount > 0 ? <span className="shrink-0 rounded-lg bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-200">Bez plánu</span> : null}</div></Surface>)}</div> : <Surface className="mt-3 p-4 text-sm text-muted-foreground">Kategorie zatím nemají finanční data.</Surface>}</section>;
}
