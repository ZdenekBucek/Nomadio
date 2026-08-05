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

import { createExternalTripPlace, createMapboxTripPlace, createTripPlace, removeTripPlace, updateTripPlace } from "./place-actions";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const placeId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
function form() {
  const value = new FormData();
  value.set("tripId", tripId);
  value.set("placeId", placeId);
  value.set("name", "Saltstraumen");
  value.set("category", "nature");
  value.set("countryCode", "NO");
  value.set("latitude", "67.23");
  value.set("longitude", "14.61");
  return value;
}
function mapboxForm() {
  const value = form();
  value.set("providerPlaceId", "dXJuOm1ieGFkcjo1");
  value.set("providerCategory", "address");
  return value;
}
function geoapifyForm() {
  const value = form();
  value.set("provider", "geoapify");
  value.set("providerPlaceId", "geo-place-1");
  value.set("providerCategory", "leisure.park");
  value.set("suggestedCategory", "nature");
  value.set("address", "Park 1, Praha, Česko");
  value.set("city", "Praha");
  value.set("attribution", "Powered by Geoapify · © OpenStreetMap contributors");
  return value;
}

describe("place actions", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    rpcMock.mockReset();
    redirectMock.mockClear();
    revalidatePathMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: "user" } } });
  });
  it("creates a manual place", async () => {
    rpcMock.mockResolvedValue({ data: placeId, error: null });
    await expect(createTripPlace(form())).rejects.toThrow("place=created");
    expect(rpcMock).toHaveBeenCalledWith("create_manual_trip_place", expect.objectContaining({ target_trip_id: tripId, place_latitude: 67.23 }));
  });
  it("creates a normalized Mapbox place", async () => {
    rpcMock.mockResolvedValue({ data: placeId, error: null });
    await expect(createMapboxTripPlace(mapboxForm())).rejects.toThrow("place=mapbox-saved");
    expect(rpcMock).toHaveBeenCalledWith("create_mapbox_trip_place", expect.objectContaining({ source_provider_place_id: "dXJuOm1ieGFkcjo1", place_provider_category: "address" }));
  });
  it("rejects a malformed Mapbox place before calling the database", async () => {
    const value = mapboxForm();
    value.set("latitude", "100");
    await expect(createMapboxTripPlace(value)).rejects.toThrow("place=mapbox-invalid");
    expect(rpcMock).not.toHaveBeenCalled();
  });
  it("stores a Geoapify place through the provider-neutral RPC", async () => {
    rpcMock.mockResolvedValue({ data: placeId, error: null });
    const value = geoapifyForm();
    value.set("category", "sight");
    await expect(createExternalTripPlace(value)).rejects.toThrow("place=geoapify-saved");
    expect(rpcMock).toHaveBeenCalledWith("create_external_trip_place", expect.objectContaining({
      place_category: "sight",
      source_provider: "geoapify",
      source_provider_place_id: "geo-place-1",
      suggested_place_category: "nature",
    }));
  });
  it("updates a place", async () => {
    rpcMock.mockResolvedValue({ data: "updated", error: null });
    await expect(updateTripPlace(form())).rejects.toThrow("place=updated");
  });
  it("reports a linked place", async () => {
    rpcMock.mockResolvedValue({ data: "in_use", error: null });
    await expect(removeTripPlace(form())).rejects.toThrow("place=in-use");
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
  it("removes an unused place", async () => {
    rpcMock.mockResolvedValue({ data: "removed", error: null });
    await expect(removeTripPlace(form())).rejects.toThrow("place=removed");
  });
  it("redirects unauthenticated users", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    await expect(createTripPlace(form())).rejects.toThrow(`/login?next=/app/trips/${tripId}/itinerary`);
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
