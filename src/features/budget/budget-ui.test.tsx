import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./budget-actions", () => ({
  createBudgetItem: vi.fn(), deleteBudgetItem: vi.fn(), updateBudgetItem: vi.fn(),
}));

import { BudgetDashboard } from "./budget-dashboard";
import { BudgetForm } from "./budget-form";
import type { BudgetRow } from "./budget-model";

afterEach(cleanup);

function row(overrides: Partial<BudgetRow> = {}): BudgetRow {
  return { actualAmount: 1000, balanceDueDate: "2027-05-15", category: "other", currency: "CZK", editable: true, estimatedAmount: null, href: null, id: "manual", name: "Ruční výdaj", notes: null, paidAmount: 250, paymentStatus: "partially_paid", remainingAmount: 750, sourceId: null, sourceType: "manual", subcategory: null, ...overrides };
}

describe("budget UI", () => {
  it("keeps automatic sources read-only and links editing to their modules", () => {
    render(<BudgetDashboard canEdit items={[
      row({ category: "accommodation", editable: false, href: "/app/trips/trip/accommodation?edit=hotel", id: "accommodation:hotel", name: "Hotel", sourceId: "hotel", sourceType: "accommodation", subcategory: "hotel" }),
      row({ category: "transport", currency: "EUR", editable: false, href: "/app/trips/trip/transport?edit=flight", id: "transport:flight", name: "Let", sourceId: "flight", sourceType: "transport", subcategory: "flights" }),
    ]} tripId="trip" />);
    expect(screen.getByText(/více měn/i)).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Upravit ve zdroji" }).map((link) => link.getAttribute("href"))).toContain("/app/trips/trip/accommodation?edit=hotel");
    expect(screen.queryByRole("link", { name: "Upravit" })).not.toBeInTheDocument();
  });

  it("shows a computed remaining amount in the manual form", () => {
    render(<BudgetForm canEdit item={null} tripCurrency="CZK" tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" />);
    fireEvent.change(screen.getByLabelText("Skutečná částka"), { target: { value: "1000" } });
    fireEvent.change(screen.getByLabelText("Již zaplaceno"), { target: { value: "250" } });
    expect(screen.getByLabelText("Zbývá zaplatit")).toHaveTextContent(/750/);
    expect(screen.getByLabelText("Stav platby")).toHaveValue("partially_paid");
  });

  it("filters subcategories by category and resets an invalid selection", () => {
    render(<BudgetForm canEdit item={null} tripCurrency="CZK" tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" />);
    fireEvent.change(screen.getByLabelText("Kategorie"), { target: { value: "car" } });
    const subcategory = screen.getByLabelText("Podkategorie");
    expect(subcategory).toHaveTextContent("Nabíjení EV");
    fireEvent.change(subcategory, { target: { value: "ev_charging" } });
    expect(subcategory).toHaveValue("ev_charging");
    fireEvent.change(screen.getByLabelText("Kategorie"), { target: { value: "food" } });
    expect(subcategory).toHaveValue("");
    expect(subcategory).not.toHaveTextContent("Nabíjení EV");
  });
});
