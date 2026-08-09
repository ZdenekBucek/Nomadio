import {
  AlertTriangle,
  BedDouble,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Plane,
} from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { formatDateOnly } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import type { TripBudgetDashboard } from "./budget-dashboard-model";
import type { BudgetPaymentItem } from "./budget-domain";
import { formatBudgetMoney } from "./budget-model";


type SourcePayment = BudgetPaymentItem & {
  sourceType: "accommodation" | "transport";
};

function isSourcePayment(item: BudgetPaymentItem): item is SourcePayment {
  return item.sourceType === "accommodation" || item.sourceType === "transport";
}

function paymentHref(item: SourcePayment) {
  return `/app/trips/${item.tripId}/${item.sourceType}?edit=${item.sourceId}`;
}

function sourceLabel(item: SourcePayment) {
  return item.sourceType === "accommodation" ? "Ubytování" : "Doprava";
}

function formattedDueDate(value: string | null) {
  return value ? formatDateOnly(value) : "Bez data splatnosti";
}

export function BudgetPaymentsSection({ payments }: {
  payments: TripBudgetDashboard["payments"];
}) {
  const sourceItems = payments.items.filter(isSourcePayment);
  const overdue = payments.overduePayments.filter(isSourcePayment);
  const upcoming = payments.upcomingPayments.filter(isSourcePayment);
  const paid = sourceItems
    .filter((item) => item.paidAmount !== null && item.paidAmount > 0)
    .sort((left, right) => left.title.localeCompare(right.title, "cs") || left.id.localeCompare(right.id));

  return <div className="min-w-0 space-y-7">
    <section aria-labelledby="payments-summary-title">
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
          <CircleDollarSign className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="payments-summary-title" className="text-xl font-semibold">Platby</h2>
          <p className="mt-1 text-sm text-muted-foreground">Uhrazené částky a budoucí závazky odděleně od skutečných nákladů.</p>
        </div>
      </div>

      {payments.remainingAmountsByCurrency.length ? <div className={cn("mt-4 grid gap-3", payments.remainingAmountsByCurrency.length > 1 && "sm:grid-cols-2")}>
        {payments.remainingAmountsByCurrency.map((item) => <Surface key={item.currency} className="min-w-0 p-4">
          <p className="text-xs font-medium tracking-[0.12em] text-primary uppercase">{item.currency}</p>
          <p className="mt-2 text-xs text-muted-foreground">Zbývá zaplatit</p>
          <p className="mt-1 truncate text-2xl font-semibold tabular-nums">{formatBudgetMoney(item.amount, item.currency)}</p>
        </Surface>)}
      </div> : <Surface className="mt-4 flex items-start gap-3 p-4 text-sm text-muted-foreground">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-300" aria-hidden="true" />
        <p>{sourceItems.length ? "Není evidovaná žádná známá částka k doplacení." : "Ubytování ani Doprava zatím nemají platební údaje."}</p>
      </Surface>}
      {payments.remainingAmountsByCurrency.length > 1 ? <p className="mt-2 text-xs text-muted-foreground">Měny jsou oddělené. Bez FX kurzu nevzniká společný součet.</p> : null}
    </section>

    {overdue.length ? <PaymentList
      icon={<AlertTriangle className="size-5 text-destructive" aria-hidden="true" />}
      items={overdue}
      mode="overdue"
      title="Po splatnosti"
    /> : <Surface className="flex items-start gap-3 p-4 text-sm text-muted-foreground">
      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-300" aria-hidden="true" />
      <p>Žádná známá platba není po splatnosti.</p>
    </Surface>}

    <PaymentList
      empty="Žádná nadcházející platba ani závazek bez data."
      icon={<CalendarClock className="size-5 text-primary" aria-hidden="true" />}
      items={upcoming}
      mode="upcoming"
      title="Nadcházející"
    />

    <PaymentList
      empty="Zatím není evidovaná žádná zaplacená částka."
      icon={<CheckCircle2 className="size-5 text-emerald-300" aria-hidden="true" />}
      items={paid}
      mode="paid"
      title="Zaplaceno"
    />
  </div>;
}

function PaymentList({ empty, icon, items, mode, title }: {
  empty?: string;
  icon: React.ReactNode;
  items: SourcePayment[];
  mode: "overdue" | "paid" | "upcoming";
  title: string;
}) {
  const sectionId = `payments-${mode}-title`;
  return <section aria-labelledby={sectionId}>
    <div className="flex items-center gap-2">
      {icon}
      <h2 id={sectionId} className="text-lg font-semibold">{title}</h2>
      {items.length ? <span className="text-xs tabular-nums text-muted-foreground">· {items.length}</span> : null}
    </div>
    {items.length ? <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card/55">
      {items.map((item, index) => <PaymentRow item={item} key={`${mode}:${item.id}`} mode={mode} separated={index > 0} />)}
    </div> : <Surface className="mt-3 p-4 text-sm text-muted-foreground">{empty}</Surface>}
  </section>;
}

function PaymentRow({ item, mode, separated }: {
  item: SourcePayment;
  mode: "overdue" | "paid" | "upcoming";
  separated: boolean;
}) {
  const accommodation = item.sourceType === "accommodation";
  const Icon = accommodation ? BedDouble : Plane;
  const amount = mode === "paid" ? item.paidAmount : item.remainingAmount;
  const amountLabel = mode === "paid" ? "Zaplaceno" : "Zbývá";
  const paidInFull = item.remainingAmount === 0;
  const tone = mode === "overdue"
    ? "danger"
    : mode === "paid"
      ? paidInFull ? "success" : "brand"
      : item.paymentStatus === "pay_on_site"
        ? "warning"
        : item.dueDate ? "brand" : "neutral";
  const status = mode === "overdue"
    ? "Po splatnosti"
    : mode === "paid"
      ? paidInFull ? "Zaplaceno" : "Částečně"
      : item.paymentStatus === "pay_on_site"
        ? "Platba na místě"
        : item.dueDate ? "Naplánováno" : "Bez data";

  return <Link href={paymentHref(item)} className={cn("group flex min-w-0 flex-col gap-3 p-4 outline-none transition hover:bg-muted/35 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary sm:flex-row sm:items-center", separated && "border-t border-border/70")}>
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted/55 text-muted-foreground transition group-hover:text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="min-w-0 truncate font-medium">{item.title}</h3>
          <StatusPill tone={tone}>{status}</StatusPill>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{sourceLabel(item)}{mode !== "paid" ? ` · ${formattedDueDate(item.dueDate)}` : ""}</p>
      </div>
    </div>
    <div className="min-w-0 pl-[3.25rem] sm:shrink-0 sm:pl-0 sm:text-right">
      <p className="text-xs text-muted-foreground">{amountLabel}</p>
      <p className={cn("mt-0.5 font-semibold tabular-nums", mode === "overdue" && "text-destructive")}>{formatBudgetMoney(amount ?? 0, item.currency)}</p>
    </div>
  </Link>;
}
