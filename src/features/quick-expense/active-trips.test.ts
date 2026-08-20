import { describe, expect, it } from "vitest";

import { resolveActiveEditableTrips } from "./active-trip-model";

const user = "11111111-1111-4111-8111-111111111111";
const now = new Date("2026-08-20T12:00:00Z");

function trip(
  id: string,
  options: Partial<{
    enabled: boolean;
    endDate: string;
    startDate: string;
    status: string;
    timezone: string;
  }> = {},
) {
  return {
    currency: "CZK",
    end_date: options.endDate ?? "2026-08-20",
    id,
    name: id,
    quick_expense_before_start_enabled: options.enabled ?? false,
    start_date: options.startDate ?? "2026-08-20",
    status: options.status ?? "planning",
    timezone: options.timezone ?? "Europe/Prague",
  };
}

function member(tripId: string, role: "editor" | "owner" | "viewer" = "owner") {
  return { role, trip_id: tripId, user_id: user };
}

describe("active editable trips", () => {
  it("applies active, future override, ended, archived and role rules", () => {
    const trips = [
      trip("future-off", { startDate: "2026-08-25", endDate: "2026-08-30" }),
      trip("future-on", { enabled: true, startDate: "2026-08-25", endDate: "2026-08-30" }),
      trip("active-off"),
      trip("active-on", { enabled: true }),
      trip("ended-on", { enabled: true, startDate: "2026-08-10", endDate: "2026-08-19" }),
      trip("archived-future", { enabled: true, startDate: "2026-08-25", endDate: "2026-08-30", status: "archived" }),
      trip("viewer-future", { enabled: true, startDate: "2026-08-25", endDate: "2026-08-30" }),
      trip("editor-future", { enabled: true, startDate: "2026-08-25", endDate: "2026-08-30" }),
    ];
    const members = trips.map((item) => member(
      item.id,
      item.id === "viewer-future" ? "viewer" : item.id === "editor-future" ? "editor" : "owner",
    ));

    expect(resolveActiveEditableTrips(trips, members, user, now).map((item) => item.id)).toEqual([
      "future-on",
      "active-off",
      "active-on",
      "editor-future",
    ]);
  });

  it("uses each trip timezone at Seoul, Prague and New York date boundaries", () => {
    const trips = [
      trip("prague-future", { enabled: true, startDate: "2026-08-22", endDate: "2026-08-25" }),
      trip("seoul-active", { timezone: "Asia/Seoul", startDate: "2026-08-21", endDate: "2026-08-21" }),
      trip("new-york-ended", { enabled: true, timezone: "America/New_York", startDate: "2026-08-19", endDate: "2026-08-19" }),
      trip("new-york-future-off", { timezone: "America/New_York", startDate: "2026-08-21", endDate: "2026-08-22" }),
    ];
    const members = trips.map((item) => member(item.id));
    const resolved = resolveActiveEditableTrips(trips, members, user, new Date("2026-08-20T22:30:00Z"));

    expect(resolved.map((item) => [item.id, item.today])).toEqual([
      ["prague-future", "2026-08-21"],
      ["seoul-active", "2026-08-21"],
    ]);
  });
});
