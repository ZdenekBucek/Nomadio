import { Archive, ChevronLeft, Eye, WalletCards } from "lucide-react";
import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";
import { Surface } from "@/components/ui/surface";
import { cn } from "@/lib/utils";
import type { TripBudgetDashboard } from "./budget-dashboard-model";
import { BudgetPlanSection } from "./budget-plan-section";
import { BudgetRealitySection } from "./budget-reality-section";
import { formatBudgetMoney } from "./budget-model";

export type BudgetTab = "plan" | "reality" | "payments";

export function normalizeBudgetTab(value: string | undefined): BudgetTab {
  return value === "reality" || value === "payments" ? value : "plan";
}

export function BudgetPageView({ activeTab, archived, canEdit, dashboard, message, roleLabel, today, tripCurrency, tripName }: {
  activeTab: BudgetTab;
  archived: boolean;
  canEdit: boolean;
  dashboard: TripBudgetDashboard;
  message: { success: boolean; text: string } | null;
  roleLabel: string;
  today: string;
  tripCurrency: string;
  tripName: string;
}) {
  const tripId = dashboard.tripId;
  return <div className="min-w-0">
    <Link href={`/app/trips/${tripId}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2 text-sm text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"><ChevronLeft className="size-4" aria-hidden="true" /> Zpět na přehled cesty</Link>
    <header className="mt-3 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-xs font-medium tracking-[0.18em] text-primary uppercase">{tripName}</p>
        <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-[-0.05em] sm:text-4xl"><WalletCards className="size-8 shrink-0 text-primary" aria-hidden="true" /> Rozpočet</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Plánované náklady, skutečnost a platební cashflow odděleně.</p>
      </div>
      <StatusPill tone={canEdit ? "brand" : "neutral"}>{roleLabel}</StatusPill>
    </header>

    {archived ? <Notice icon={<Archive className="size-4" aria-hidden="true" />}>Cesta je archivovaná. Rozpočet zůstává pouze pro čtení.</Notice> : !canEdit ? <Notice icon={<Eye className="size-4" aria-hidden="true" />}>Máte přístup pouze pro čtení.</Notice> : null}
    {message ? <div role={message.success ? "status" : "alert"} className={cn("mt-5 rounded-2xl border px-4 py-3 text-sm", message.success ? "border-emerald-400/20 bg-emerald-400/8 text-emerald-300" : "border-amber-400/20 bg-amber-400/8 text-amber-200")}>{message.text}</div> : null}

    <BudgetSummary dashboard={dashboard} />
    <BudgetTabs activeTab={activeTab} tripId={tripId} />

    <div className="mt-5 min-w-0">
      {activeTab === "plan" ? <BudgetPlanSection canEdit={canEdit} items={dashboard.plan.items} tripCurrency={tripCurrency} tripId={tripId} /> : null}
      {activeTab === "reality" ? <BudgetRealitySection canEdit={canEdit} comparison={dashboard.comparison} reality={dashboard.reality} today={today} tripCurrency={tripCurrency} tripId={tripId} /> : null}
      {activeTab === "payments" ? <Placeholder title="Platby">Přehled plateb bude dostupný zde.</Placeholder> : null}
    </div>
  </div>;
}

function BudgetSummary({ dashboard }: { dashboard: TripBudgetDashboard }) {
  const groups = dashboard.comparison.byCurrency;
  return <section aria-labelledby="budget-summary-title" className="mt-6 min-w-0">
    <div className="flex items-center justify-between gap-3">
      <h2 id="budget-summary-title" className="text-sm font-medium text-muted-foreground">Finanční souhrn</h2>
      {groups.length > 1 ? <p className="text-xs text-muted-foreground">Bez FX přepočtu</p> : null}
    </div>
    {groups.length ? <div className={cn("mt-3 grid gap-3", groups.length > 1 && "lg:grid-cols-2")}>
      {groups.map((group) => <CurrencySummary key={group.currency} group={group} multiple={groups.length > 1} />)}
    </div> : <Surface className="mt-3 p-4 text-sm text-muted-foreground">Zatím nejsou evidované žádné plánované ani skutečné náklady.</Surface>}
  </section>;
}

function CurrencySummary({ group, multiple }: { group: TripBudgetDashboard["comparison"]["byCurrency"][number]; multiple: boolean }) {
  const used = group.plannedAmount > 0 ? Math.round((group.realityAmount / group.plannedAmount) * 100) : null;
  const over = group.difference < 0;
  const difference = Math.abs(group.difference);
  const barWidth = used === null ? 0 : Math.min(used, 100);
  return <Surface depth="panel" className="min-w-0 p-4 sm:p-5">
    {multiple ? <p className="mb-3 text-xs font-semibold tracking-[0.14em] text-primary uppercase">{group.currency}</p> : null}
    <div className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      <Metric label="Plán" value={formatBudgetMoney(group.plannedAmount, group.currency)} />
      <Metric label="Realita" value={formatBudgetMoney(group.realityAmount, group.currency)} />
      <Metric label="Využito" value={used === null ? "Bez plánu" : `${used} %`} tone={over ? "danger" : "default"} />
      <Metric label={over ? "Překročeno o" : "Zbývá"} value={formatBudgetMoney(difference, group.currency)} tone={over ? "danger" : "default"} />
    </div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted/70" aria-label={used === null ? `Čerpání ${group.currency} nelze určit bez plánu` : `Využito ${used} procent rozpočtu ${group.currency}`}>
      <div className={cn("h-full rounded-full transition-[width]", over ? "bg-destructive" : "bg-[linear-gradient(90deg,var(--primary),var(--brand-highlight))]")} style={{ width: `${barWidth}%` }} />
    </div>
  </Surface>;
}

function Metric({ label, tone = "default", value }: { label: string; tone?: "danger" | "default"; value: string }) {
  return <div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className={cn("mt-1 truncate text-base font-semibold tabular-nums sm:text-lg", tone === "danger" && "text-destructive")}>{value}</p></div>;
}

function BudgetTabs({ activeTab, tripId }: { activeTab: BudgetTab; tripId: string }) {
  const tabs: Array<{ label: string; value: BudgetTab }> = [
    { label: "Plán", value: "plan" },
    { label: "Realita", value: "reality" },
    { label: "Platby", value: "payments" },
  ];
  return <nav aria-label="Části rozpočtu" className="mt-6 grid grid-cols-3 rounded-xl border border-border bg-muted/25 p-1">
    {tabs.map((tab) => <Link key={tab.value} href={`/app/trips/${tripId}/budget?tab=${tab.value}`} aria-current={activeTab === tab.value ? "page" : undefined} className={cn("flex min-h-10 items-center justify-center rounded-lg px-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-primary", activeTab === tab.value ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")}>{tab.label}</Link>)}
  </nav>;
}

function Placeholder({ children, title }: { children: React.ReactNode; title: string }) {
  return <Surface className="flex min-h-44 items-center justify-center p-6 text-center"><div><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{children}</p></div></Surface>;
}

function Notice({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return <div className="mt-5 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/8 p-4 text-sm text-muted-foreground"><span className="mt-0.5 shrink-0 text-primary">{icon}</span><p>{children}</p></div>;
}
