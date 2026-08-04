import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  removeTripMember: vi.fn(),
  updateTripMemberRole: vi.fn(),
}));

import type { TripMemberProfileRow } from "@/lib/supabase/database.types";

import { TripMembers } from "./trip-members";

afterEach(cleanup);

const members: TripMemberProfileRow[] = [
  {
    avatar_url: null,
    created_at: "2026-08-04T10:00:00Z",
    display_name: "Vlastník Cesty",
    email: "owner@nomadio.test",
    role: "owner",
    user_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  },
  {
    avatar_url: null,
    created_at: "2026-08-04T11:00:00Z",
    display_name: "Editor Cesty",
    email: "editor@nomadio.test",
    role: "editor",
    user_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  },
];

describe("TripMembers", () => {
  it("shows management controls only for non-owner members to the owner", () => {
    render(
      <TripMembers
        currentUserId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
        isOwner
        members={members}
        tripId="cccccccc-cccc-4ccc-8ccc-cccccccccccc"
      />,
    );

    expect(screen.getByText("Vlastník Cesty")).toBeInTheDocument();
    expect(screen.getByText("Editor Cesty")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Role uživatele Editor Cesty" }))
      .toHaveValue("editor");
    expect(screen.getByText("Odebrat přístup")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Potvrdit odebrání" }))
      .toBeInTheDocument();
    expect(screen.getAllByText("Vy")).toHaveLength(1);
  });

  it("keeps management controls hidden from an editor", () => {
    render(
      <TripMembers
        currentUserId="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
        isOwner={false}
        members={members}
        tripId="cccccccc-cccc-4ccc-8ccc-cccccccccccc"
      />,
    );

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("Odebrat přístup")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Potvrdit odebrání" }))
      .not.toBeInTheDocument();
  });
});
