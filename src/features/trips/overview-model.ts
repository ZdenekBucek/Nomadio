import { accommodationCoverage, accommodationSummary, type AccommodationWithPlace } from "@/features/accommodation/accommodation-model";
import type { TripBudgetDashboard } from "@/features/budget/budget-dashboard-model";
import type { BudgetPaymentItem } from "@/features/budget/budget-domain";
import { formatBudgetMoney } from "@/features/budget/budget-model";
import { summarizePacking, summarizeTasks, type ChecklistPackingItem, type ChecklistTask } from "@/features/checklist/checklist-model";
import { documentSummary, type DocumentWithLink } from "@/features/documents/document-model";
import type { ItineraryDayRow, ItineraryItemRow } from "@/lib/supabase/database.types";
import type { TransportBookingWithSegments } from "@/features/transport/transport-model";
import { formatDateOnly } from "@/lib/date-time";

export type OverviewAlert = { href: string; id: string; title: string; detail: string };

const today = () => new Date().toISOString().slice(0, 10);

function paymentHref(item: BudgetPaymentItem) {
  return item.sourceType === "accommodation" || item.sourceType === "transport"
    ? `/app/trips/${item.tripId}/${item.sourceType}?edit=${item.sourceId}`
    : `/app/trips/${item.tripId}/budget?tab=payments`;
}

function overviewFinance(dashboard: TripBudgetDashboard) {
  const currencies = new Set([
    ...dashboard.comparison.byCurrency.map((item) => item.currency),
    ...dashboard.payments.paidAmountsByCurrency.map((item) => item.currency),
    ...dashboard.payments.remainingAmountsByCurrency.map((item) => item.currency),
  ]);
  return [...currencies].sort().map((currency) => {
    const comparison = dashboard.comparison.byCurrency.find((item) => item.currency === currency);
    return {
      currency,
      paidAmount: dashboard.payments.paidAmountsByCurrency.find((item) => item.currency === currency)?.amount ?? 0,
      planAmount: comparison?.plannedAmount ?? 0,
      realityAmount: comparison?.realityAmount ?? 0,
      remainingBudget: comparison?.difference ?? 0,
      remainingPayment: dashboard.payments.remainingAmountsByCurrency.find((item) => item.currency === currency)?.amount ?? 0,
    };
  });
}

export function buildTripOverview(input: { accommodations: AccommodationWithPlace[]; budgetDashboard: TripBudgetDashboard; documents: DocumentWithLink[]; itineraryDays: ItineraryDayRow[]; itineraryItems: ItineraryItemRow[]; tasks: ChecklistTask[]; packingItems: ChecklistPackingItem[]; timezone: string; transport: TransportBookingWithSegments[]; tripEnd: string | null; tripId: string; tripStart: string | null }) {
  const now = today();
  const coverage = accommodationCoverage(input.accommodations, input.tripStart, input.tripEnd);
  const accommodation = accommodationSummary(input.accommodations);
  const finance = overviewFinance(input.budgetDashboard);
  const nearestPayment = input.budgetDashboard.payments.overduePayments[0]
    ?? input.budgetDashboard.payments.upcomingPayments[0]
    ?? null;
  const daysWithItems = new Set(input.itineraryItems.map((item) => item.day_id));
  const datedDays = input.itineraryDays.filter((day) => day.day_date !== null);
  const plannedDays = datedDays.filter((day) => daysWithItems.has(day.id));
  const selectedDay = [...plannedDays].sort((left, right) => (left.day_date ?? "9999").localeCompare(right.day_date ?? "9999"))[0] ?? null;
  const dayItems = selectedDay ? input.itineraryItems.filter((item) => item.day_id === selectedDay.id).sort((left, right) => left.sort_order - right.sort_order).slice(0, 4) : [];
  const nearestTransport = input.transport.flatMap((booking) => booking.segments.map((segment) => ({ booking, segment }))).filter(({ segment }) => segment.departure_at && segment.departure_at >= new Date().toISOString()).sort((left, right) => (left.segment.departure_at ?? "").localeCompare(right.segment.departure_at ?? ""))[0] ?? null;
  const upcomingAccommodation = input.accommodations.find((item) => item.check_out_date >= now) ?? null;
  const openTasks = input.tasks.filter((task) => task.status !== "completed" && task.status !== "cancelled").sort((left, right) => {
    const leftOverdue = Boolean(left.due_date && left.due_date < now); const rightOverdue = Boolean(right.due_date && right.due_date < now);
    if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;
    if (left.priority !== right.priority) return left.priority === "high" ? -1 : right.priority === "high" ? 1 : 0;
    return (left.due_date ?? "9999").localeCompare(right.due_date ?? "9999");
  });
  const alerts: OverviewAlert[] = [];
  if (nearestPayment?.dueDate && nearestPayment.dueDate < now) alerts.push({ detail: `${formatBudgetMoney(nearestPayment.remainingAmount ?? 0, nearestPayment.currency)} bylo splatné ${formatDateOnly(nearestPayment.dueDate)}.`, href: paymentHref(nearestPayment), id: `payment:${nearestPayment.id}`, title: nearestPayment.title });
  if (coverage.gapNights) alerts.push({ detail: `Chybí ubytování na ${coverage.gapNights} ${coverage.gapNights === 1 ? "noc" : "noci"}.`, href: `/app/trips/${input.tripId}/accommodation`, id: "accommodation-gap", title: "Ubytování není pokryté" });
  if (coverage.overlapCount) alerts.push({ detail: `${coverage.overlapCount} překrývající se rezervace.`, href: `/app/trips/${input.tripId}/accommodation`, id: "accommodation-overlap", title: "Překrývající se ubytování" });
  for (const task of openTasks.filter((task) => task.due_date && task.due_date < now).slice(0, 2)) alerts.push({ detail: `Termín ${formatDateOnly(task.due_date)} už uplynul.`, href: `/app/trips/${input.tripId}/checklist?editTask=${task.id}`, id: `task:${task.id}`, title: task.title });
  for (const document of input.documents.filter((item) => item.is_important && !item.offline_enabled).slice(0, 2)) alerts.push({ detail: "Důležitý dokument není označený pro offline použití.", href: `/app/trips/${input.tripId}/documents/${document.id}`, id: `document:${document.id}`, title: document.name });
  return { accommodation, alerts, dayItems, document: documentSummary(input.documents), finance, itinerary: { items: input.itineraryItems.length, plannedDays: plannedDays.length, totalDays: datedDays.length }, nearestPayment, nearestTransport, openTasks: openTasks.slice(0, 3), packing: summarizePacking(input.packingItems), selectedDay, task: summarizeTasks(input.tasks), timezone: input.timezone, upcomingAccommodation, coverage };
}
