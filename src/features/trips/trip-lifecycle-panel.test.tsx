import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./lifecycle-actions", () => ({
  archiveTrip: vi.fn(),
  deleteTrip: vi.fn(async () => ({ error: null })),
  restoreTrip: vi.fn(),
}));

import { TripLifecyclePanel } from "./trip-lifecycle-panel";

afterEach(cleanup);

describe("TripLifecyclePanel", () => {
  it("offers archival and a name-confirmed deletion for an active trip", () => {
    render(<TripLifecyclePanel archived={false} tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" tripName="Norsko 2027" />);

    expect(screen.getByRole("button", { name: "Archivovat cestu" })).toBeInTheDocument();
    expect(screen.getAllByText("Trvale odstranit cestu")).toHaveLength(2);
    expect(screen.getByLabelText("Pro potvrzení napište přesně Norsko 2027")).toBeRequired();
  });

  it("offers restoration for an archived trip", () => {
    render(<TripLifecyclePanel archived tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" tripName="Norsko 2027" />);

    expect(screen.getByRole("button", { name: "Obnovit cestu" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archivovat cestu" })).not.toBeInTheDocument();
  });
});
