"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/date-time/date-picker";
import { calendarDateToDateOnly } from "@/lib/date-time";
import type { BudgetCategory, BudgetSubcategory } from "@/lib/supabase/database.types";
import type { BudgetManualExpenseItem } from "./budget-domain";
import { createExpense, deleteExpense, updateExpense } from "./budget-expense-actions";
import {
  budgetCategories,
  budgetCategoryLabels,
  budgetSubcategoriesFor,
  isSubcategoryForCategory,
} from "./budget-categories";

const controlClass = "mt-2 h-11 w-full min-w-0 rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/55 focus:ring-3 focus:ring-primary/15";
const labelClass = "text-xs font-medium text-muted-foreground";

export function BudgetExpenseForm({ defaultOccurredDate, item, tripCurrency, tripId, global = false, onGlobalSuccess }: {
  defaultOccurredDate?: string;
  item?: BudgetManualExpenseItem | null;
  tripCurrency: string;
  tripId: string;
  global?: boolean;
  onGlobalSuccess?: () => void;
}) {
  const [category, setCategory] = useState<BudgetCategory>(item?.category ?? "other");
  const [subcategory, setSubcategory] = useState<BudgetSubcategory | "">(item?.subcategory ?? "");
  const subcategories = budgetSubcategoriesFor(category);

  const action: (formData: FormData) => void | Promise<void> = global && !item
    ? async (formData: FormData) => {
      const result = await createExpense(formData);
      if (result?.ok) onGlobalSuccess?.();
    }
    : item ? updateExpense : async (formData: FormData) => { await createExpense(formData); };

  return <form action={action} className="mt-5 min-w-0 space-y-4">
    <input type="hidden" name="tripId" value={tripId} />
    {global && !item ? <input type="hidden" name="flow" value="global" /> : null}
    {item?.sourceId ? <input type="hidden" name="itemId" value={item.sourceId} /> : null}
    {item?.paidByTravelerId ? <input type="hidden" name="paidByTravelerId" value={item.paidByTravelerId} /> : null}
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">
      <label className={labelClass} htmlFor="expense-amount">Částka
        <span className="relative mt-2 block">
          <input id="expense-amount" className="h-12 w-full min-w-0 rounded-xl border border-input bg-background/55 pl-3 pr-16 text-lg font-semibold tabular-nums outline-none transition placeholder:text-muted-foreground/45 focus:border-primary/55 focus:ring-3 focus:ring-primary/15" name="amount" inputMode="decimal" min="0.01" step="0.01" defaultValue={item?.amount ?? ""} autoFocus required />
          <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">{tripCurrency}</span>
        </span>
      </label>
      <label className={labelClass}>Kategorie
        <select
          className={controlClass}
          name="category"
          value={category}
          onChange={(event) => {
            const next = event.target.value as BudgetCategory;
            setCategory(next);
            if (subcategory && !isSubcategoryForCategory(next, subcategory)) setSubcategory("");
          }}
          required
        >
          {budgetCategories.map((value) => <option key={value} value={value}>{budgetCategoryLabels[value]}</option>)}
        </select>
      </label>
    </div>

    <details className="rounded-xl border border-border bg-muted/20 p-3" open={item ? true : undefined}>
      <summary className="cursor-pointer text-sm font-medium text-muted-foreground outline-none focus-visible:text-foreground">Doplnit podrobnosti</summary>
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2">
        <label className={labelClass}>Název <span className="font-normal text-muted-foreground/65">(volitelné)</span>
          <input className={controlClass} name="title" maxLength={160} defaultValue={item?.enteredTitle ?? ""} placeholder={budgetCategoryLabels[category]} />
        </label>
        <label className={labelClass}>Podkategorie
          <select className={controlClass} name="subcategory" value={subcategory} onChange={(event) => setSubcategory(event.target.value as BudgetSubcategory | "")}>
            <option value="">Bez podkategorie</option>
            {subcategories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <DatePicker label="Datum" name="occurredDate" defaultValue={item?.occurredAt.slice(0, 10) ?? defaultOccurredDate ?? calendarDateToDateOnly(new Date())} />
        <label className={`${labelClass} sm:col-span-2`}>Poznámka
          <textarea className="mt-2 min-h-20 w-full min-w-0 resize-y rounded-xl border border-input bg-background/55 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15" name="notes" maxLength={4000} defaultValue={item?.notes ?? ""} />
        </label>
      </div>
    </details>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <SubmitButton label="Uložit výdaj" />
      {item ? <Button type="submit" variant="destructive" formAction={deleteExpense} onClick={(event) => { if (!window.confirm("Opravdu chcete tento výdaj odstranit?")) event.preventDefault(); }}><Trash2 aria-hidden="true" /> Smazat</Button> : null}
    </div>
  </form>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}{pending ? "Ukládám…" : label}</Button>;
}
