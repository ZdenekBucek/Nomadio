import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AccommodationRow, TripRow } from "@/lib/supabase/database.types";

vi.mock("./accommodation-actions", () => ({ createAccommodation: vi.fn(), deleteAccommodation: vi.fn(), updateAccommodation: vi.fn() }));
vi.mock("@/features/places/place-preview-map", () => ({ PlacePreviewMap: () => <div>Mapový náhled</div> }));

import { AccommodationForm } from "./accommodation-form";
import { AccommodationPaymentSummary } from "./accommodation-list";
import type { AccommodationWithPlace } from "./accommodation-model";

const trip = { currency: "CZK", id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" } as TripRow;

function accommodation(overrides: Partial<AccommodationRow> = {}): AccommodationWithPlace {
  return {
    balance_due_date: "2026-10-15",
    currency: "CZK",
    paid_amount: 5000,
    payment_status: "partially_paid",
    total_price: 18500,
    ...overrides,
    place: null,
  } as AccommodationWithPlace;
}

afterEach(cleanup);

describe("accommodation payment UI", () => {
  it("shows editable payment inputs and recalculates the read-only remaining amount", () => {
    render(<AccommodationForm accommodation={accommodation()} canEdit geoapifyConfigured={false} mapAccessToken={null} places={[]} trip={trip} />);
    expect(screen.getByRole("spinbutton", { name: "Celková cena" })).toHaveValue(18500);
    expect(screen.getByRole("spinbutton", { name: "Již zaplaceno" })).toHaveValue(5000);
    expect(screen.getByText(/13[\s ]500 CZK/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Datum splatnosti zbývající částky" })).toHaveTextContent("15. 10. 2026");
    fireEvent.change(screen.getByRole("spinbutton", { name: "Již zaplaceno" }), { target: { value: "6500" } });
    expect(screen.getByText(/12[\s ]000 CZK/)).toBeInTheDocument();
  });

  it("shows and hides the due date while deriving unpaid and paid states", () => {
    render(<AccommodationForm accommodation={accommodation()} canEdit geoapifyConfigured={false} mapAccessToken={null} places={[]} trip={trip} />);
    const paid = screen.getByRole("spinbutton", { name: "Již zaplaceno" });
    const status = screen.getByRole("combobox", { name: "Stav platby" });
    fireEvent.change(paid, { target: { value: "18500" } });
    expect(status).toHaveValue("paid");
    expect(screen.queryByLabelText("Datum splatnosti zbývající částky")).not.toBeInTheDocument();
    fireEvent.change(paid, { target: { value: "0" } });
    expect(status).toHaveValue("unpaid");
    expect(screen.getByLabelText("Datum splatnosti zbývající částky")).toBeInTheDocument();
  });

  it("preserves pay on site without requiring a due date", () => {
    render(<AccommodationForm accommodation={accommodation({ balance_due_date: null, paid_amount: 0, payment_status: "pay_on_site" })} canEdit geoapifyConfigured={false} mapAccessToken={null} places={[]} trip={trip} />);
    expect(screen.getByRole("combobox", { name: "Stav platby" })).toHaveValue("pay_on_site");
    expect(screen.getByText(/Platba na místě\. Datum splatnosti může zůstat prázdné/)).toBeInTheDocument();
    expect(screen.getByLabelText("Datum splatnosti zbývající částky")).toHaveValue("");
  });

  it("uses shared date and time pickers for an editable accommodation stay", () => {
    const { container } = render(
      <AccommodationForm
        accommodation={accommodation({
          check_in_date: "2026-08-14",
          check_in_time: "15:00:00",
          check_out_date: "2026-08-18",
          check_out_time: "10:00:00",
        })}
        canEdit
        geoapifyConfigured={false}
        mapAccessToken={null}
        places={[]}
        trip={trip}
      />,
    );

    expect(screen.getByRole("button", { name: "Pobyt" })).toHaveTextContent("14. 8. 2026 → 18. 8. 2026");
    expect(screen.getByLabelText("Check-in")).toHaveValue("15:00");
    expect(screen.getByLabelText("Check-out")).toHaveValue("10:00");
    expect(container.querySelector('input[name="checkInDate"]')).toHaveValue("2026-08-14");
    expect(container.querySelector('input[name="checkOutDate"]')).toHaveValue("2026-08-18");
    expect(container.querySelectorAll('input[type="date"]')).toHaveLength(0);
  });

  it("prefills a new accommodation stay from the trip date range", () => {
    render(
      <AccommodationForm
        accommodation={null}
        canEdit
        geoapifyConfigured={false}
        mapAccessToken={null}
        places={[]}
        trip={{ ...trip, end_date: "2026-08-28", start_date: "2026-08-14" }}
      />,
    );

    expect(screen.getByRole("button", { name: "Pobyt" })).toHaveTextContent("14. 8. 2026 → 28. 8. 2026");
    expect(screen.getByLabelText("Check-in")).toHaveValue("15:00");
    expect(screen.getByLabelText("Check-out")).toHaveValue("11:00");
    expect(screen.getByRole("spinbutton", { name: "Počet hostů" })).toHaveValue(2);
  });

  it("keeps stored values when editing an accommodation", () => {
    render(
      <AccommodationForm
        accommodation={accommodation({ check_in_time: null, check_out_time: "09:30:00", guest_count: null })}
        canEdit
        geoapifyConfigured={false}
        mapAccessToken={null}
        places={[]}
        trip={trip}
      />,
    );

    expect(screen.getByLabelText("Check-in")).toHaveValue("");
    expect(screen.getByLabelText("Check-out")).toHaveValue("09:30");
    expect(screen.getByRole("spinbutton", { name: "Počet hostů" })).toHaveValue(null);
  });

  it("keeps all accommodation pickers read-only for viewers", () => {
    render(<AccommodationForm accommodation={accommodation()} canEdit={false} geoapifyConfigured={false} mapAccessToken={null} places={[]} trip={trip} />);
    expect(screen.getByRole("button", { name: "Pobyt" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Datum splatnosti zbývající částky" })).toBeDisabled();
    expect(screen.getByLabelText("Check-in")).toBeDisabled();
    expect(screen.getByLabelText("Check-out")).toBeDisabled();
  });

  it("shows total, paid, remaining and due date on a partially paid card", () => {
    render(<AccommodationPaymentSummary item={accommodation()} />);
    expect(screen.getByText(/18[\s ]500 Kč/)).toBeInTheDocument();
    expect(screen.getByText(/Zaplaceno 5[\s ]000 Kč/)).toBeInTheDocument();
    expect(screen.getByText(/Zbývá 13[\s ]500 Kč/)).toBeInTheDocument();
    expect(screen.getByText(/Doplatek do 15\. 10\. 2026/)).toBeInTheDocument();
  });

  it("shows an unpaid balance and general due date without a paid-zero line", () => {
    render(<AccommodationPaymentSummary item={accommodation({ balance_due_date: "2026-09-15", paid_amount: 0, payment_status: "unpaid" })} />);
    expect(screen.getByText(/Zbývá 18[\s ]500 Kč/)).toBeInTheDocument();
    expect(screen.getByText(/Splatnost 15\. 9\. 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/Zaplaceno 0/)).not.toBeInTheDocument();
  });

  it("shows a compact fully-paid state", () => {
    render(<AccommodationPaymentSummary item={accommodation({ paid_amount: 18500, payment_status: "paid" })} />);
    expect(screen.getByText(/18[\s ]500 Kč · Zaplaceno/)).toBeInTheDocument();
    expect(screen.queryByText(/Zbývá/)).not.toBeInTheDocument();
  });
});
