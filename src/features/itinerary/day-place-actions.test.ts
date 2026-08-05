import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, redirectMock, revalidatePathMock, rpcMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  redirectMock: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
  revalidatePathMock: vi.fn(),
  rpcMock: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ auth: { getUser: getUserMock }, rpc: rpcMock })) }));

import { addExternalPlaceToDay, addManualPlaceToDay } from "./day-place-actions";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const dayId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function externalForm() {
  const form = new FormData();
  form.set("tripId", tripId);
  form.set("dayId", dayId);
  form.set("provider", "geoapify");
  form.set("providerPlaceId", "geo-place-1");
  form.set("providerCategory", "catering.restaurant");
  form.set("suggestedCategory", "food");
  form.set("category", "sight");
  form.set("name", "Restaurace U Mostu");
  form.set("address", "Mostecká 1, Praha, Česko");
  form.set("city", "Praha");
  form.set("countryCode", "CZ");
  form.set("latitude", "50.087");
  form.set("longitude", "14.407");
  form.set("attribution", "Powered by Geoapify · © OpenStreetMap contributors");
  form.set("startTime", "19:00");
  form.set("endTime", "20:30");
  form.set("notes", "Rezervace");
  return form;
}

describe("day place actions", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "user" } } });
    rpcMock.mockReset().mockResolvedValue({ data: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", error: null });
    redirectMock.mockClear();
    revalidatePathMock.mockReset();
  });

  it("atomically adds a normalized external place with item details", async () => {
    await expect(addExternalPlaceToDay(externalForm())).rejects.toThrow("item=place-added");
    expect(rpcMock).toHaveBeenCalledWith("add_place_to_itinerary_day", expect.objectContaining({
      target_trip_id: tripId,
      target_day_id: dayId,
      source_provider: "geoapify",
      source_provider_place_id: "geo-place-1",
      place_category: "sight",
      suggested_place_category: "food",
      item_start_time: "19:00",
      item_end_time: "20:30",
      item_notes: "Rezervace",
    }));
    expect(revalidatePathMock).toHaveBeenCalledWith(`/app/trips/${tripId}/map`);
  });

  it("adds a manual fallback without coordinates", async () => {
    const form = new FormData();
    form.set("tripId", tripId);
    form.set("dayId", dayId);
    form.set("name", "Vlastní místo");
    form.set("category", "custom");
    await expect(addManualPlaceToDay(form)).rejects.toThrow("item=place-added");
    expect(rpcMock).toHaveBeenCalledWith("add_place_to_itinerary_day", expect.objectContaining({
      source_provider: "manual",
      place_latitude: null,
      place_longitude: null,
    }));
  });

  it("rejects invalid day details before database access", async () => {
    const form = externalForm();
    form.set("startTime", "99:00");
    await expect(addExternalPlaceToDay(form)).rejects.toThrow("item=place-invalid");
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
