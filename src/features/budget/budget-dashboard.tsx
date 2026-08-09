import { CalendarClock, ExternalLink, Pencil, ReceiptText } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { formatDateOnly } from "@/lib/date-time";
import {
  budgetCategoryLabels,
  budgetCategoryPathLabel,
  budgetSubcategoryLabel,
} from "./budget-categories";
import {
  budgetPaymentStatusLabels,
  formatBudgetMoney,
  pendingBudgetPayments,
  summarizeBudgetByCategory,
  summarizeBudgetByCurrency,
  summarizeBudgetBySubcategory,
  type BudgetRow,
} from "./budget-model";

function sourceLabel(item: BudgetRow) {
  if (item.sourceType === "accommodation") return "Zdroj: Ubytování";
  if (item.sourceType === "transport") return "Zdroj: Doprava";
  return "Ruční položka";
}

export function BudgetDashboard({ canEdit, items, tripId }: { canEdit: boolean; items: BudgetRow[]; tripId: string }) {
  const currencies = summarizeBudgetByCurrency(items);
  const categories = summarizeBudgetByCategory(items);
  const pending = pendingBudgetPayments(items);
  const multipleCurrencies = currencies.length > 1;

  return <div className="mt-6 min-w-0 space-y-6">
    {multipleCurrencies ? <div role="note" className="rounded-2xl border border-amber-400/20 bg-amber-400/8 px-4 py-3 text-sm text-amber-100">Položky mají více měn. Součty jsou oddělené a bez FX přepočtu.</div> : null}
    <section aria-labelledby="budget-summary-title"><h2 id="budget-summary-title" className="text-xl font-semibold">Souhrn rozpočtu</h2>{currencies.length ? <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{currencies.flatMap((summary) => [
      ["Celkový odhad", summary.estimated], ["Skutečné náklady", summary.actual], ["Zaplaceno", summary.paid], ["Zbývá zaplatit", summary.remaining],
    ].map(([label, value]) => <Surface key={`${summary.currency}-${label}`} className="min-w-0 p-4"><p className="text-xs text-muted-foreground">{label} · {summary.currency}</p><p className="mt-2 truncate text-xl font-semibold">{formatBudgetMoney(value as number, summary.currency)}</p></Surface>))}</div> : <Empty>Rozpočet zatím neobsahuje žádné finanční položky.</Empty>}</section>

    <section aria-labelledby="budget-categories-title"><h2 id="budget-categories-title" className="text-xl font-semibold">Podle kategorií</h2><div className="mt-3 grid gap-3 lg:grid-cols-2">{categories.map(({ category, currencies: categoryCurrencies }) => { const breakdown = summarizeBudgetBySubcategory(items, category); return <Surface key={category} className="min-w-0 p-4"><h3 className="font-medium">{budgetCategoryLabels[category]}</h3>{categoryCurrencies.length ? <div className="mt-3 space-y-2">{categoryCurrencies.map((summary) => <div key={summary.currency} className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-4"><Amount label="Odhad" value={summary.estimated} currency={summary.currency} /><Amount label="Skutečnost" value={summary.actual} currency={summary.currency} /><Amount label="Zaplaceno" value={summary.paid} currency={summary.currency} /><Amount label="Zbývá" value={summary.remaining} currency={summary.currency} /></div>)}<div className="border-t border-border/70 pt-3"><p className="text-xs font-medium text-muted-foreground">Podkategorie</p><div className="mt-2 space-y-2">{breakdown.map((group) => <div key={group.subcategory ?? "none"} className="rounded-xl bg-muted/25 px-3 py-2"><p className="text-xs font-medium">{budgetSubcategoryLabel(group.subcategory)}</p>{group.currencies.map((summary) => <p key={summary.currency} className="mt-1 text-xs text-muted-foreground">Skutečnost {formatBudgetMoney(summary.actual, summary.currency)} · odhad {formatBudgetMoney(summary.estimated, summary.currency)}</p>)}</div>)}</div></div></div> : <p className="mt-2 text-sm text-muted-foreground">Bez položek</p>}</Surface>; })}</div></section>

    <section aria-labelledby="budget-items-title"><h2 id="budget-items-title" className="text-xl font-semibold">Položky</h2>{items.length ? <div className="mt-3 space-y-3">{items.map((item) => <Surface key={item.id} className="min-w-0 p-4"><div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{item.name}</h3><StatusPill tone="neutral">{budgetCategoryPathLabel(item.category, item.subcategory)}</StatusPill></div><p className="mt-1 text-xs text-muted-foreground">{sourceLabel(item)}</p>{item.notes ? <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p> : null}</div><div className="flex shrink-0 flex-col items-start gap-1 text-sm sm:items-end"><p>{item.actualAmount !== null ? formatBudgetMoney(item.actualAmount, item.currency) : item.estimatedAmount !== null ? `Odhad ${formatBudgetMoney(item.estimatedAmount, item.currency)}` : "Cena neuvedena"}</p><p className="text-xs text-muted-foreground">Zaplaceno {item.paidAmount === null ? "neuvedeno" : formatBudgetMoney(item.paidAmount, item.currency)}</p><p className="text-xs text-muted-foreground">Zbývá {item.remainingAmount === null ? "neuvedeno" : formatBudgetMoney(item.remainingAmount, item.currency)}</p><StatusPill tone={item.paymentStatus === "paid" ? "success" : item.remainingAmount ? "warning" : "neutral"}>{budgetPaymentStatusLabels[item.paymentStatus]}</StatusPill>{item.editable && canEdit ? <Link href={`/app/trips/${tripId}/budget?edit=${item.id}`} className="mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"><Pencil className="size-3.5" /> Upravit</Link> : item.href ? <Link href={item.href} className="mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border px-3 text-xs text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"><ExternalLink className="size-3.5" /> Upravit ve zdroji</Link> : null}</div></div></Surface>)}</div> : <Empty>Zatím nejsou žádné položky.</Empty>}</section>

    <section aria-labelledby="pending-payments-title"><h2 id="pending-payments-title" className="flex items-center gap-2 text-xl font-semibold"><CalendarClock className="size-5 text-primary" /> Čekající platby</h2>{pending.length ? <div className="mt-3 space-y-2">{pending.map((item) => <Surface key={`pending-${item.id}`} className="flex min-w-0 flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{budgetCategoryPathLabel(item.category, item.subcategory)} · {budgetPaymentStatusLabels[item.paymentStatus]}</p></div><div className="shrink-0 text-sm sm:text-right"><p>{formatBudgetMoney(item.remainingAmount!, item.currency)}</p><p className="text-xs text-muted-foreground">{item.balanceDueDate ? `Splatnost ${formatDateOnly(item.balanceDueDate)}` : "Bez zadané splatnosti"}</p></div></Surface>)}</div> : <Empty>Žádné známé čekající platby.</Empty>}</section>
  </div>;
}

function Amount({ currency, label, value }: { currency: string; label: string; value: number }) { return <div className="min-w-0"><p className="text-muted-foreground">{label}</p><p className="truncate font-medium">{formatBudgetMoney(value, currency)}</p></div>; }
function Empty({ children }: { children: React.ReactNode }) { return <Surface className="mt-3 flex items-center gap-3 p-5 text-sm text-muted-foreground"><ReceiptText className="size-5 shrink-0 text-primary" /> {children}</Surface>; }
