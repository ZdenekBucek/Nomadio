import { describe, expect, it } from "vitest";

import { resolveActiveEditableTrips } from "./active-trip-model";

const user = "11111111-1111-4111-8111-111111111111";
const trip = (id: string, timezone = "Europe/Prague", status = "planning") => ({ id, name: id, currency: "CZK", timezone, status, start_date: "2026-08-20", end_date: "2026-08-20" });

describe("active editable trips", () => {
  it("includes owner/editor on the first and last date, but not viewers or archived trips", () => {
    const trips = [trip("owner"), trip("editor"), trip("viewer"), trip("archived", "Europe/Prague", "archived"), { ...trip("before"), start_date: "2026-08-19" }, { ...trip("after"), end_date: "2026-08-21" }];
    const members = [
      { user_id: user, trip_id: "owner", role: "owner" as const },
      { user_id: user, trip_id: "editor", role: "editor" as const },
      { user_id: user, trip_id: "viewer", role: "viewer" as const },
      { user_id: user, trip_id: "archived", role: "owner" as const },
    ];
    expect(resolveActiveEditableTrips(trips, members, user, new Date("2026-08-20T12:00:00Z")).map((item) => item.id)).toEqual(["owner", "editor"]);
  });

  it("uses each trip timezone for the date boundary", () => {
    const trips = [
      { ...trip("prague"), start_date: "2026-08-20", end_date: "2026-08-20" },
      { ...trip("seoul", "Asia/Seoul"), start_date: "2026-08-21", end_date: "2026-08-21" },
      { ...trip("new-york", "America/New_York"), start_date: "2026-08-20", end_date: "2026-08-20" },
    ];
    const members = trips.map((item) => ({ user_id: user, trip_id: item.id, role: "owner" as const }));
    const active = resolveActiveEditableTrips(trips, members, user, new Date("2026-08-20T22:30:00Z"));
    expect(active.map((item) => item.id)).toEqual(["seoul", "new-york"]);
  });
});
