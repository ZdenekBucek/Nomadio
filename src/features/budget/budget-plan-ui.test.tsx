import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { BudgetPlanItem } from "./budget-domain";
import { buildTripBudgetDashboard } from "./budget-dashboard-model";

vi.mock("./budget-plan-actions", () => ({
  createBudgetPlanItem: vi.fn(),
  deleteBudgetPlanItem: vi.fn(),
  updateBudgetPlanItem: vi.fn(),
}));

import { BudgetPageView, normalizeBudgetTab } from "./budget-page-view";

afterEach(cleanup);

function plan(overrides: Partial<BudgetPlanItem> = {}): BudgetPlanItem {
  return {
    category: "accommodation",
    currency: "CZK",
    id: "plan",
    name: "Ubytování",
    notes: "Hotely a apartmány",
    plannedAmount: 30000,
    subcategory: "hotel",
    tripId: "trip",
    ...overrides,
  };
}

function dashboard(items: BudgetPlanItem[] = [plan()]) {
  return buildTripBudgetDashboard({
    accommodations: [],
    expenses: [],
    planItems: items,
    today: "2027-06-01",
    transportBookings: [],
    tripCurrency: "CZK",
    tripId: "trip",
  });
}

function view(overrides: Partial<React.ComponentProps<typeof BudgetPageView>> = {}) {
  return <BudgetPageView
    activeTab="plan"
    archived={false}
    canEdit
    dashboard={dashboard()}
    message={null}
    roleLabel="Vlastník"
    today="2027-06-01"
    tripCurrency="CZK"
    tripName="Jižní Korea 2026"
    {...overrides}
  />;
}

describe("new budget page", () => {
  it("renders the trip header, compact summary and Plan as the default tab", () => {
    expect(normalizeBudgetTab(undefined)).toBe("plan");
    render(view());
    expect(screen.getByRole("heading", { level: 1, name: "Rozpočet" })).toBeInTheDocument();
    expect(screen.getByText("Jižní Korea 2026")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plán" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("heading", { name: "Plánovaný rozpočet" })).toBeInTheDocument();
    expect(screen.getByText("Ubytování", { selector: "h3" })).toBeInTheDocument();
  });

  it("opens the add plan dialog with the required planning fields", () => {
    render(view());
    fireEvent.click(screen.getAllByRole("button", { name: "Přidat plán" })[0]!);
    const dialog = screen.getByRole("dialog", { name: "Přidat plán" });
    expect(within(dialog).getByLabelText("Kategorie")).toBeRequired();
    expect(within(dialog).getByLabelText("Plánovaná částka")).toBeRequired();
    expect(within(dialog).getByLabelText("Měna")).toHaveValue("CZK");
  });

  it("keeps viewer and archived trips read-only", () => {
    const { rerender } = render(view({ canEdit: false, roleLabel: "Čtenář" }));
    expect(screen.getByText(/pouze pro čtení/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Přidat plán" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upravit" })).not.toBeInTheDocument();

    rerender(view({ archived: true, canEdit: false }));
    expect(screen.getByText(/cesta je archivovaná/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Přidat plán" })).not.toBeInTheDocument();
  });

  it("renders the Reality and Payments tabs without fake data", () => {
    const { rerender } = render(view({ activeTab: "reality" }));
    expect(screen.getByRole("heading", { name: "Skutečné náklady" })).toBeInTheDocument();
    rerender(view({ activeTab: "payments" }));
    expect(screen.getByRole("heading", { name: "Platby" })).toBeInTheDocument();
    expect(screen.getByText("Ubytování ani Doprava zatím nemají platební údaje.")).toBeInTheDocument();
  });

  it("keeps currencies separate and displays over-budget percentage above 100", () => {
    const multiCurrency = buildTripBudgetDashboard({
      accommodations: [],
      expenses: [{
        amount: 1200,
        category: "food",
        createdAt: "2027-06-01T00:00:00Z",
        createdBy: "user",
        currency: "CZK",
        id: "expense",
        notes: null,
        occurredAt: "2027-06-01T00:00:00Z",
        paidByTravelerId: null,
        subcategory: null,
        title: "Jídlo",
        tripId: "trip",
        updatedAt: "2027-06-01T00:00:00Z",
      }],
      planItems: [plan({ category: "food", plannedAmount: 1000, subcategory: null }), plan({ currency: "EUR", id: "eur", plannedAmount: 500 })],
      today: "2027-06-01",
      transportBookings: [],
      tripCurrency: "CZK",
      tripId: "trip",
    });
    render(view({ dashboard: multiCurrency }));
    expect(screen.getByText("120 %")).toBeInTheDocument();
    expect(screen.getByText("Bez FX přepočtu")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
  });
});
