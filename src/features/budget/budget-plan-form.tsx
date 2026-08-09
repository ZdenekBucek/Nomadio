"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { BudgetCategory, BudgetSubcategory } from "@/lib/supabase/database.types";
import type { BudgetPlanItem } from "./budget-domain";
import { createBudgetPlanItem, deleteBudgetPlanItem, updateBudgetPlanItem } from "./budget-plan-actions";
import {
  budgetCategories,
  budgetCategoryLabels,
  budgetSubcategoriesFor,
  isSubcategoryForCategory,
} from "./budget-categories";

const controlClass = "mt-2 h-11 w-full min-w-0 rounded-xl border border-input bg-background/55 px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/55 focus:ring-3 focus:ring-primary/15";
const labelClass = "text-xs font-medium text-muted-foreground";

export function BudgetPlanForm({ item, tripCurrency, tripId }: {
  item: BudgetPlanItem | null;
  tripCurrency: string;
  tripId: string;
}) {
  const [category, setCategory] = useState<BudgetCategory>(item?.category ?? "other");
  const [subcategory, setSubcategory] = useState<BudgetSubcategory | "">(item?.subcategory ?? "");
  const [currency, setCurrency] = useState(item?.currency ?? tripCurrency);
  const subcategories = budgetSubcategoriesFor(category);

  return (
    <form action={item ? updateBudgetPlanItem : createBudgetPlanItem} className="mt-5 min-w-0 space-y-5">
      <input type="hidden" name="tripId" value={tripId} />
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
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
        <label className={labelClass}>Podkategorie
          <select className={controlClass} name="subcategory" value={subcategory} onChange={(event) => setSubcategory(event.target.value as BudgetSubcategory | "")}>
            <option value="">Bez podkategorie</option>
            {subcategories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className={`${labelClass} sm:col-span-2`}>Název <span className="font-normal text-muted-foreground/65">(volitelné)</span>
          <input className={controlClass} name="name" maxLength={160} defaultValue={item?.name ?? ""} placeholder={budgetCategoryLabels[category]} />
        </label>
        <label className={labelClass}>Plánovaná částka
          <input className={controlClass} name="plannedAmount" inputMode="decimal" min="0" step="0.01" defaultValue={item?.plannedAmount ?? ""} required />
        </label>
        <label className={labelClass}>Měna
          <input className={`${controlClass} uppercase`} name="currency" pattern="[A-Za-z]{3}" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} required />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>Poznámka <span className="font-normal text-muted-foreground/65">(volitelné)</span>
          <textarea className="mt-2 min-h-24 w-full min-w-0 resize-y rounded-xl border border-input bg-background/55 px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15" name="notes" maxLength={4000} defaultValue={item?.notes ?? ""} />
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SubmitButton label={item ? "Uložit plán" : "Přidat plán"} />
        {item ? <Button
          type="submit"
          variant="destructive"
          formAction={deleteBudgetPlanItem}
          onClick={(event) => {
            if (!window.confirm("Opravdu chcete tuto plánovanou položku odstranit?")) event.preventDefault();
          }}
        ><Trash2 aria-hidden="true" /> Smazat</Button> : null}
      </div>
    </form>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" size="lg" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : null}{pending ? "Ukládám…" : label}</Button>;
}
