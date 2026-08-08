import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { TripRow } from "@/lib/supabase/database.types";
import { TransportForm } from "./transport-form";
import { TransportList } from "./transport-list";
import type { TransportBookingWithSegments } from "./transport-model";

vi.mock("./transport-actions", () => ({ deleteTransportBooking: vi.fn(), saveTransportBooking: vi.fn() }));
const trip = { currency: "CZK", id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", timezone: "Europe/Prague" } as TripRow;

function booking(overrides: Partial<TransportBookingWithSegments> = {}): TransportBookingWithSegments {
  return {
    balance_due_date: "2026-10-15", booking_reference: "DY123", created_at: "2026-01-01T00:00:00Z", created_by: "user", currency: "CZK", id: "booking", notes: null, paid_amount: 5000, payment_status: "partially_paid", provider: "Norwegian", segments: [{ arrival_at: "2026-08-25T10:00:00Z", arrival_place_id: null, arrivalPlace: null, baggage: null, booking_id: "booking", created_at: "", departure_at: "2026-08-25T08:00:00Z", departure_place_id: null, departurePlace: null, id: "segment", notes: null, platform: null, seat: "12A", service_number: "DY123", sort_order: 0, terminal: "2", updated_at: "" }], status: "booked", title: "Let Praha – Oslo", total_price: 18500, transport_type: "flight", trip_id: trip.id, updated_at: "", ...overrides,
  };
}

afterEach(cleanup);

describe("transport UI", () => {
  it("shows payment details and booking metadata on the card", () => {
    render(<TransportList items={[booking()]} trip={trip} />);
    expect(screen.getByText("Let Praha – Oslo")).toBeInTheDocument();
    expect(screen.getByText(/Norwegian · DY123/)).toBeInTheDocument();
    expect(screen.getByText(/18[\s ]500 Kč/)).toBeInTheDocument();
    expect(screen.getByText(/Zaplaceno 5[\s ]000 Kč/)).toBeInTheDocument();
    expect(screen.getByText(/Zbývá 13[\s ]500 Kč/)).toBeInTheDocument();
    expect(screen.getByText(/Doplatek do 15\. 10\. 2026/)).toBeInTheDocument();
  });

  it("recalculates remaining amount and hides due date when fully paid", () => {
    render(<TransportForm booking={booking()} canEdit geoapifyConfigured={false} places={[]} trip={trip} />);
    expect(screen.getByText(/13[\s ]500 CZK/)).toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton", { name: "Již zaplaceno" }), { target: { value: "18500" } });
    expect(screen.getByRole("combobox", { name: "Stav platby" })).toHaveValue("paid");
    expect(screen.queryByLabelText("Datum splatnosti zbývající částky")).not.toBeInTheDocument();
  });

  it("adds and deterministically reorders segment drafts", () => {
    const { container } = render(<TransportForm booking={null} canEdit geoapifyConfigured={false} places={[]} trip={trip} />);
    fireEvent.click(screen.getByRole("button", { name: "Přidat segment" }));
    const serviceNumbers = screen.getAllByLabelText("Číslo letu / spoje");
    fireEvent.change(serviceNumbers[0]!, { target: { value: "FIRST" } });
    fireEvent.change(serviceNumbers[1]!, { target: { value: "SECOND" } });
    fireEvent.click(screen.getByRole("button", { name: "Posunout segment 1 dolů" }));
    const hidden = container.querySelector<HTMLInputElement>('input[name="segments"]');
    expect(JSON.parse(hidden!.value).map((item: { serviceNumber: string }) => item.serviceNumber)).toEqual(["SECOND", "FIRST"]);
  });

  it("keeps one segment and exposes Geoapify fallback safely when not configured", () => {
    render(<TransportForm booking={null} canEdit geoapifyConfigured={false} places={[]} trip={trip} />);
    expect(screen.getByRole("button", { name: "Odstranit segment 1" })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("button", { name: "Geoapify" })[0]!);
    expect(screen.getByText(/Geoapify není na serveru nakonfigurované/)).toBeInTheDocument();
  });
});
