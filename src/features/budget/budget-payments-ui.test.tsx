import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { BudgetPaymentItem } from "./budget-domain";
import { summarizeBudgetPayments } from "./budget-domain";
import { BudgetPaymentsSection } from "./budget-payments-section";

afterEach(cleanup);

function payment(overrides: Partial<BudgetPaymentItem> = {}): BudgetPaymentItem {
  return {
    amount: 1000,
    currency: "CZK",
    dueDate: "2027-06-15",
    id: "accommodation:hotel",
    paidAmount: 250,
    paymentStatus: "partially_paid",
    remainingAmount: 750,
    sourceId: "hotel",
    sourceType: "accommodation",
    title: "Hotel Soul",
    tripId: "trip",
    ...overrides,
  };
}

function model(items: BudgetPaymentItem[]) {
  const summary = summarizeBudgetPayments(items, "2027-06-01");
  return {
    items,
    overduePayments: summary.overduePayments,
    paidAmountsByCurrency: summary.totalPaid,
    remainingAmountsByCurrency: summary.totalDue,
    upcomingPayments: summary.upcomingPayments,
  };
}

describe("Budget Payments UI", () => {
  it("sorts overdue payments oldest first and links both supported sources", () => {
    render(<BudgetPaymentsSection payments={model([
      payment({ dueDate: "2027-05-20", id: "accommodation:hotel", sourceId: "hotel", title: "Hotel Soul" }),
      payment({ currency: "EUR", dueDate: "2027-05-10", id: "transport:flight", sourceId: "flight", sourceType: "transport", title: "Let do Soulu" }),
    ])} />);

    const overdue = screen.getByRole("region", { name: "Po splatnosti" });
    const links = within(overdue).getAllByRole("link");
    expect(links[0]).toHaveTextContent("Let do Soulu");
    expect(links[0]).toHaveAttribute("href", "/app/trips/trip/transport?edit=flight");
    expect(links[1]).toHaveTextContent("Hotel Soul");
    expect(links[1]).toHaveAttribute("href", "/app/trips/trip/accommodation?edit=hotel");
  });

  it("sorts upcoming payments by due date and keeps missing dates last", () => {
    render(<BudgetPaymentsSection payments={model([
      payment({ dueDate: null, id: "accommodation:no-date", sourceId: "no-date", title: "Hotel bez splatnosti" }),
      payment({ dueDate: "2027-07-01", id: "transport:later", sourceId: "later", sourceType: "transport", title: "Pozdější vlak" }),
      payment({ dueDate: "2027-06-10", id: "transport:soon", sourceId: "soon", sourceType: "transport", title: "Nejbližší vlak" }),
    ])} />);

    const upcoming = screen.getByRole("region", { name: "Nadcházející" });
    expect(within(upcoming).getAllByRole("link").map((link) => link.textContent)).toEqual([
      expect.stringContaining("Nejbližší vlak"),
      expect.stringContaining("Pozdější vlak"),
      expect.stringContaining("Hotel bez splatnosti"),
    ]);
    expect(within(upcoming).getByText(/Bez data splatnosti/)).toBeInTheDocument();
  });

  it("shows paid amounts and derives the remaining amount separately", () => {
    render(<BudgetPaymentsSection payments={model([
      payment({ amount: 1000, paidAmount: 250, remainingAmount: 750 }),
      payment({ amount: 800, currency: "EUR", dueDate: null, id: "transport:paid", paidAmount: 800, paymentStatus: "paid", remainingAmount: 0, sourceId: "paid", sourceType: "transport", title: "Zaplacený let" }),
    ])} />);

    expect(screen.getAllByText(/750.*Kč/).length).toBeGreaterThan(0);
    const paid = screen.getByRole("region", { name: "Zaplaceno" });
    expect(within(paid).getByText(/250.*Kč/)).toBeInTheDocument();
    expect(within(paid).getByText(/800.*€/)).toBeInTheDocument();
    expect(within(paid).getByText("Částečně")).toBeInTheDocument();
  });

  it("keeps currency summaries separate without FX and is read-only for viewers", () => {
    render(<BudgetPaymentsSection payments={model([
      payment(),
      payment({ currency: "EUR", id: "transport:flight", sourceId: "flight", sourceType: "transport", title: "Let" }),
    ])} />);

    expect(screen.getByText("CZK")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
    expect(screen.getByText(/Bez FX kurzu nevzniká společný součet/)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/upravit|smazat/i)).not.toBeInTheDocument();
  });
});
