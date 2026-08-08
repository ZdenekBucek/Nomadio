"use client";

import { LoaderCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import type { BudgetCategory, BudgetPaymentStatus, BudgetSubcategory } from "@/lib/supabase/database.types";
import { createBudgetItem, deleteBudgetItem, updateBudgetItem } from "./budget-actions";
import {
  budgetCategories,
  budgetCategoryLabels,
  budgetSubcategoriesFor,
  isSubcategoryForCategory,
} from "./budget-categories";
import {
  budgetPaymentStatuses,
  budgetPaymentStatusLabels,
  deriveBudgetPaymentStatus,
  remainingBudgetAmount,
  type BudgetRow,
} from "./budget-model";

const fieldClass = "mt-2 h-11 w-full min-w-0 rounded-xl border border-input bg-background/55 px-3 text-sm outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-65";
const labelClass = "text-xs font-medium text-muted-foreground";
const amountFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });

function numberValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function BudgetForm({ canEdit, item, tripCurrency, tripId }: { canEdit: boolean; item: BudgetRow | null; tripCurrency: string; tripId: string }) {
  const [estimated, setEstimated] = useState(item?.estimatedAmount?.toString() ?? "");
  const [actual, setActual] = useState(item?.actualAmount?.toString() ?? "");
  const [paid, setPaid] = useState(item?.paidAmount?.toString() ?? "");
  const [currency, setCurrency] = useState(item?.currency ?? tripCurrency);
  const [paymentStatus, setPaymentStatus] = useState<BudgetPaymentStatus>(item?.paymentStatus ?? "unknown");
  const [category, setCategory] = useState<BudgetCategory>(item?.category ?? "other");
  const [subcategory, setSubcategory] = useState<BudgetSubcategory | "">(item?.subcategory ?? "");
  const subcategories = budgetSubcategoriesFor(category);
  const actualAmount = numberValue(actual);
  const estimatedAmount = numberValue(estimated);
  const paidAmount = numberValue(paid);
  const effectivePaymentStatus = deriveBudgetPaymentStatus(actualAmount, estimatedAmount, paidAmount, paymentStatus);
  const remaining = remainingBudgetAmount(actualAmount, estimatedAmount, paidAmount, effectivePaymentStatus);

  const action = item ? updateBudgetItem : createBudgetItem;
  return <form action={action} className="mt-5 min-w-0 space-y-5">
    <input type="hidden" name="tripId" value={tripId} />
    {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
    <fieldset disabled={!canEdit} className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className={`${labelClass} sm:col-span-2`}>Název<input className={fieldClass} name="name" maxLength={160} defaultValue={item?.name ?? ""} required /></label>
      <label className={labelClass}>Kategorie<select className={fieldClass} name="category" value={category} onChange={(event) => { const next = event.target.value as BudgetCategory; setCategory(next); if (subcategory && !isSubcategoryForCategory(next, subcategory)) setSubcategory(""); }} required>{budgetCategories.map((value) => <option key={value} value={value}>{budgetCategoryLabels[value]}</option>)}</select></label>
      <label className={labelClass}>Podkategorie<select className={fieldClass} name="subcategory" value={subcategory} onChange={(event) => setSubcategory(event.target.value as BudgetSubcategory | "")}><option value="">Bez podkategorie</option>{subcategories.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
      <label className={labelClass}>Odhadovaná částka<input className={fieldClass} name="estimatedAmount" inputMode="decimal" value={estimated} onChange={(event) => setEstimated(event.target.value)} /></label>
      <label className={labelClass}>Skutečná částka<input className={fieldClass} name="actualAmount" inputMode="decimal" value={actual} onChange={(event) => setActual(event.target.value)} /></label>
      <label className={labelClass}>Měna<input className={`${fieldClass} uppercase`} name="currency" pattern="[A-Za-z]{3}" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} required /></label>
      <label className={labelClass}>Již zaplaceno<input className={fieldClass} name="paidAmount" inputMode="decimal" value={paid} onChange={(event) => setPaid(event.target.value)} /></label>
      <label className={labelClass}>Zbývá zaplatit<output aria-live="polite" className={`${fieldClass} flex items-center bg-muted/30 text-foreground`}>{remaining === null ? "Nelze zatím určit" : `${amountFormatter.format(remaining)} ${currency}`}</output></label>
      <label className={labelClass}>Datum splatnosti zbývající částky<input className={fieldClass} name="balanceDueDate" type="date" defaultValue={item?.balanceDueDate ?? ""} /></label>
      <label className={labelClass}>Stav platby<select className={fieldClass} name="paymentStatus" value={effectivePaymentStatus} onChange={(event) => setPaymentStatus(event.target.value as BudgetPaymentStatus)}>{budgetPaymentStatuses.map((status) => <option key={status} value={status}>{budgetPaymentStatusLabels[status]}</option>)}</select></label>
      <label className={`${labelClass} sm:col-span-2 lg:col-span-3`}>Poznámka<textarea className="mt-2 min-h-24 w-full min-w-0 rounded-xl border border-input bg-background/55 px-3 py-2 text-sm outline-none transition focus:border-primary/55 focus:ring-3 focus:ring-primary/15" name="notes" maxLength={4000} defaultValue={item?.notes ?? ""} /></label>
    </fieldset>
    {canEdit ? <div className="flex flex-wrap items-center justify-between gap-3"><SubmitButton label={item ? "Uložit změny" : "Přidat položku"} />{item ? <button type="submit" formAction={deleteBudgetItem} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-destructive/30 px-3 text-sm text-destructive transition hover:bg-destructive/10"><Trash2 className="size-4" /> Smazat položku</button> : null}</div> : null}
  </form>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin" /> : null}{pending ? "Ukládám…" : label}</Button>;
}
