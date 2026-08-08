import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CalendarDashboard } from "./calendar-dashboard";
import type { CalendarAgendaItem } from "./calendar-model";

afterEach(() => { cleanup(); vi.useRealTimers(); });

const trip = { end_date: "2026-10-18", id: "trip-a", name: "Jižní Korea", start_date: "2026-10-14" };
const agenda: CalendarAgendaItem[] = [{ amount: null, currency: null, date: "2099-10-14", href: "/app/trips/trip-a/transport", id: "transport-a", isOverdue: false, startTime: "11:00", subtitle: "DY1042", title: "Let Praha → Soul", tripId: trip.id, tripName: trip.name, type: "transport" }];

describe("calendar dashboard", () => {
  it("renders one horizontal seven-column header and seven day cells per week", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-08-08T12:00:00Z"));
    const { container } = render(<CalendarDashboard initialMonth="2026-08" trips={[]} />);
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual(["Po", "Út", "St", "Čt", "Pá", "So", "Ne"]);
    expect(headers[0]?.parentElement).toHaveAttribute("data-calendar-columns", "7");
    expect(headers[0]?.parentElement).toHaveStyle({ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" });
    const weeks = screen.getAllByTestId("calendar-week-row");
    expect(weeks).toHaveLength(6);
    expect(weeks[0]?.querySelectorAll("[data-calendar-day]")).toHaveLength(7);
    expect(container.querySelector("[data-calendar-day='2026-08-08'] span")).toHaveTextContent("8");
  });

  it("keeps a keyboard-accessible trip link in month mode and exposes the Agenda route", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    render(<CalendarDashboard agenda={agenda} trips={[trip]} />);
    const links = screen.getAllByRole("link", { name: /Jižní Korea/ });
    expect(links[0]).toHaveAttribute("href", "/app/trips/trip-a");
    expect(screen.getByRole("tab", { name: "Agenda" })).toHaveAttribute("href", "/app/calendar?view=agenda");
  });

  it("places a multi-day trip as real grid spans inside its week rows", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-08-08T12:00:00Z"));
    render(<CalendarDashboard initialMonth="2026-08" trips={[{
      end_date: "2026-09-09",
      id: "lofoty",
      name: "Norsko – Lofoty 2026",
      start_date: "2026-08-25",
    }]} />);
    const segments = screen.getAllByRole("link", { name: /Norsko – Lofoty 2026/ });
    expect(segments).toHaveLength(2);
    expect(segments[0]).toHaveAttribute("data-start-column", "2");
    expect(segments[0]).toHaveAttribute("data-end-column", "7");
    expect(segments[0]).toHaveAttribute("href", "/app/trips/lofoty");
    expect(segments[0]).toHaveStyle({ gridColumn: "2 / 8", gridRow: "1" });
    expect(segments[1]).toHaveStyle({ gridColumn: "1 / 8", gridRow: "1" });
  });

  it("moves the displayed month with the month controls", () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    render(<CalendarDashboard agenda={[]} trips={[]} />);
    const before = screen.getByRole("heading", { level: 2 }).textContent;
    fireEvent.click(screen.getByRole("button", { name: "Další měsíc" }));
    expect(screen.getByRole("heading", { level: 2 })).not.toHaveTextContent(before ?? "");
  });
});
