import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { TripRow } from "@/lib/supabase/database.types";
import { AccommodationList } from "./accommodation-list";

const trip = { end_date: "2026-08-10", id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", start_date: "2026-08-01" } as TripRow;

afterEach(cleanup);

describe("AccommodationList empty state", () => {
  it("shows the create CTA for an editor", () => {
    render(<AccommodationList canEdit items={[]} trip={trip} />);
    expect(screen.getByText("Zatím nemáte přidané žádné ubytování.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Přidat ubytování" })).toHaveAttribute("href", `/app/trips/${trip.id}/accommodation?new=1`);
  });

  it("keeps the empty state read-only when editing is not allowed", () => {
    render(<AccommodationList canEdit={false} items={[]} trip={trip} />);
    expect(screen.queryByRole("link", { name: "Přidat ubytování" })).not.toBeInTheDocument();
  });
});
