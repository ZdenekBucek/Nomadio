import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { TripTravelerRow } from "@/lib/supabase/database.types";

import { TravelerStack } from "./traveler-stack";

const traveler = (id: string, display_name: string): TripTravelerRow => ({
  id,
  trip_id: "trip",
  display_name,
  user_id: null,
  avatar_url: null,
  contact: null,
  created_by: "user",
  created_at: "2026-08-04T10:00:00Z",
  sort_order: 0,
  updated_at: "2026-08-04T10:00:00Z",
});

describe("TravelerStack", () => {
  afterEach(cleanup);

  it("shows accessible initials for one traveler", () => {
    render(<TravelerStack travelers={[traveler("one", "Jana Nováková")]} size="hero" tone="cover" />);

    expect(screen.getByLabelText("Cestovatelé")).toBeInTheDocument();
    expect(screen.getByText("JN")).toBeInTheDocument();
    expect(screen.getByText("Jana Nováková")).toHaveClass("sr-only");
  });

  it("limits the mobile hero stack to two avatars and keeps the rest summarized", () => {
    render(<TravelerStack travelers={[traveler("one", "Jana Nováková"), traveler("two", "Petr Novák"), traveler("three", "Eva Nováková")]} size="hero" tone="cover" />);

    expect(screen.getByText("JN")).toBeInTheDocument();
    expect(screen.getByText("PN")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.queryByText("EN")).not.toBeInTheDocument();
  });
});
