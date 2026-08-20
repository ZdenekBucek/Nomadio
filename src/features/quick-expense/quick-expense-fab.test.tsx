import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ActiveEditableTrip } from "./active-trips";
import { QuickExpenseFab } from "./quick-expense-fab";

vi.mock("@/features/budget/budget-expense-actions", () => ({ createExpense: vi.fn(), deleteExpense: vi.fn(), updateExpense: vi.fn() }));

const trips: ActiveEditableTrip[] = [
  { id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", name: "Praha", currency: "CZK", timezone: "Europe/Prague", role: "owner", startDate: "2026-08-20", endDate: "2026-08-20", today: "2026-08-20" },
  { id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", name: "Soul", currency: "KRW", timezone: "Asia/Seoul", role: "editor", startDate: "2026-08-25", endDate: "2026-08-30", today: "2026-08-21" },
];

afterEach(cleanup);

describe("QuickExpenseFab", () => {
  it("opens the expense form directly for one active trip", () => {
    const { container } = render(<QuickExpenseFab trips={[trips[0]!] } />);
    const trigger = screen.getByRole("button", { name: "Přidat výdaj" });
    expect(trigger.className).toContain("bottom-[var(--mobile-fab-bottom)]");
    fireEvent.click(trigger);
    expect(screen.getByText("Cesta:")).toBeInTheDocument();
    expect(screen.getByText("Praha")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /částka/i })).toBeInTheDocument();
    expect(document.querySelector('input[name="occurredDate"]')).toHaveValue("2026-08-20");
    expect(container.ownerDocument.querySelector('[data-visual-viewport-sheet="quick-expense"]')).toHaveClass("h-dvh", "overflow-hidden");
    expect(container.ownerDocument.querySelector("[data-quick-expense-scroll]")).toHaveClass("overflow-y-auto", "overscroll-contain");
  });

  it("shows a compact selector for an active and a future-enabled trip", () => {
    render(<QuickExpenseFab trips={trips} />);
    fireEvent.click(screen.getByRole("button", { name: "Přidat výdaj" }));
    expect(screen.getByText("Do které cesty přidat výdaj?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Soul/ }));
    expect(screen.getByText("KRW")).toBeInTheDocument();
    expect(document.querySelector('input[name="occurredDate"]')).toHaveValue("2026-08-21");
  });
});
