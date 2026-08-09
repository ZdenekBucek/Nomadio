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
  it("offers the create CTA only when editing is allowed and there are no bookings", () => {
    const { rerender } = render(<TransportList canEdit items={[]} trip={trip} />);
    expect(screen.getByText("Zatím nemáte přidanou žádnou dopravu.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Přidat dopravu" })).toHaveAttribute("href", `/app/trips/${trip.id}/transport?new=1`);
    rerender(<TransportList canEdit={false} items={[]} trip={trip} />);
    expect(screen.queryByRole("link", { name: "Přidat dopravu" })).not.toBeInTheDocument();
  });

  it("shows payment details and booking metadata on the card", () => {
    render(<TransportList canEdit={false} items={[booking()]} trip={trip} />);
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

  it("uses DateTimePicker values while preserving the segments JSON contract", () => {
    const { container } = render(<TransportForm booking={booking()} canEdit geoapifyConfigured={false} places={[]} trip={trip} />);
    expect(screen.queryByDisplayValue("2026-08-25T10:00")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Odjezd / odlet" }));
    fireEvent.change(screen.getByLabelText("Čas"), { target: { value: "11:45" } });
    fireEvent.click(screen.getByRole("button", { name: "Potvrdit" }));
    const hidden = container.querySelector<HTMLInputElement>('input[name="segments"]');
    expect(JSON.parse(hidden!.value)[0].departureAt).toBe("2026-08-25T11:45");
    expect(screen.getByRole("button", { name: /^Segment 1/ })).toHaveAccessibleName(expect.stringMatching(/11:45/));
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

  it("opens only the first existing segment and keeps the collapsed summary useful", () => {
    const first = booking().segments[0]!;
    const second = { ...first, arrival_at: null, departure_at: "2026-08-26T09:30:00Z", id: "segment-2", service_number: "EC 170" };
    render(<TransportForm booking={booking({ segments: [first, second] })} canEdit geoapifyConfigured={false} places={[]} trip={trip} />);

    const headers = screen.getAllByRole("button", { name: /^Segment/ });
    expect(headers[0]).toHaveAttribute("aria-expanded", "true");
    expect(headers[1]).toHaveAttribute("aria-expanded", "false");
    expect(headers[1]).toHaveAccessibleName("Segment 2: Trasa zatím není vyplněná, 11:30 · EC 170");

    fireEvent.click(headers[1]!);
    expect(headers[1]).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(headers[1]!);
    expect(headers[1]).toHaveAttribute("aria-expanded", "false");
    fireEvent.invalid(screen.getAllByLabelText("Číslo letu / spoje")[1]!);
    expect(headers[1]).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Segment obsahuje chybu")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Číslo letu / spoje")[1]).toHaveValue("EC 170");
  });

  it("opens a newly added segment without changing the existing segment", () => {
    render(<TransportForm booking={null} canEdit geoapifyConfigured={false} places={[]} trip={trip} />);
    fireEvent.click(screen.getByRole("button", { name: "Přidat segment" }));
    const headers = screen.getAllByRole("button", { name: /^Segment/ });
    expect(headers).toHaveLength(2);
    expect(headers[0]).toHaveAttribute("aria-expanded", "true");
    expect(headers[1]).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Odstranit segment 2" }));
    expect(screen.getAllByRole("button", { name: /^Segment/ })).toHaveLength(1);
  });

  it("opens the server-reported DST error segment and labels the affected picker", () => {
    render(<TransportForm booking={null} canEdit dateTimeError={{ field: "departure", segmentIndex: 0 }} geoapifyConfigured={false} places={[]} trip={trip} />);
    expect(screen.getByRole("button", { name: /^Segment 1/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Segment obsahuje chybu")).toBeInTheDocument();
    expect(screen.getByText(/Tento čas v časovém pásmu Europe\/Prague neexistuje/)).toBeInTheDocument();
  });

  it("keeps one segment and exposes Geoapify fallback safely when not configured", () => {
    render(<TransportForm booking={null} canEdit geoapifyConfigured={false} places={[]} trip={trip} />);
    expect(screen.getByRole("button", { name: "Odstranit segment 1" })).toBeDisabled();
    fireEvent.click(screen.getAllByRole("button", { name: "Geoapify" })[0]!);
    expect(screen.getByText(/Geoapify není na serveru nakonfigurované/)).toBeInTheDocument();
  });
});
