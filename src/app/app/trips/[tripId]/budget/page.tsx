import { notFound } from "next/navigation";
import { getTripBudgetDashboard } from "@/features/budget/budget-dashboard-data";
import { BudgetPageView, normalizeBudgetTab } from "@/features/budget/budget-page-view";
import { getTripDetail } from "@/features/trips/trip-detail";
import { memberRoleLabel } from "@/features/trips/trip-presentation";
import { todayInTimeZone } from "@/lib/date-time";

type Props = {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ budget?: string; tab?: string }>;
};

const messages = {
  "expense-created": { success: true, text: "Výdaj byl přidán." },
  "expense-error": { success: false, text: "Výdaj se nepodařilo uložit." },
  "expense-invalid": { success: false, text: "Zkontrolujte částku, kategorii a datum." },
  "expense-removed": { success: true, text: "Výdaj byl odstraněn." },
  "expense-updated": { success: true, text: "Výdaj byl upraven." },
  "plan-created": { success: true, text: "Plánovaná položka byla přidána." },
  "plan-error": { success: false, text: "Plánovanou položku se nepodařilo uložit." },
  "plan-invalid": { success: false, text: "Zkontrolujte kategorii, částku a měnu." },
  "plan-removed": { success: true, text: "Plánovaná položka byla odstraněna." },
  "plan-updated": { success: true, text: "Plánovaná položka byla upravena." },
} as const;

export default async function BudgetPage({ params, searchParams }: Props) {
  const [{ tripId }, query] = await Promise.all([params, searchParams]);
  const [detail, dashboard] = await Promise.all([
    getTripDetail(tripId),
    getTripBudgetDashboard(tripId),
  ]);
  if (!detail || !dashboard) notFound();

  const role = detail.members.find((member) => member.user_id === detail.currentUserId)?.role ?? "viewer";
  const archived = detail.trip.status === "archived";
  const canEdit = (role === "owner" || role === "editor") && !archived;
  const message = query.budget ? messages[query.budget as keyof typeof messages] ?? messages["plan-error"] : null;

  return <BudgetPageView
    activeTab={normalizeBudgetTab(query.tab)}
    archived={archived}
    canEdit={canEdit}
    dashboard={dashboard}
    message={message}
    roleLabel={memberRoleLabel(role)}
    today={todayInTimeZone(detail.trip.timezone)}
    timezone={detail.trip.timezone}
    tripCurrency={detail.trip.currency}
    tripName={detail.trip.name}
  />;
}
