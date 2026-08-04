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

import { createItineraryDay, moveItineraryDay, removeItineraryDay, updateItineraryDay } from "./actions";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const dayId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
function form() { const data = new FormData(); data.set("tripId", tripId); data.set("dayId", dayId); data.set("name", "Přílet"); data.set("city", "Tokio"); data.set("date", "2027-05-01"); data.set("status", "confirmed"); return data; }

describe("itinerary actions", () => {
  beforeEach(() => { getUserMock.mockReset(); rpcMock.mockReset(); redirectMock.mockClear(); revalidatePathMock.mockReset(); getUserMock.mockResolvedValue({ data: { user: { id: "user" } } }); });
  it("creates a normalized day", async () => { rpcMock.mockResolvedValue({ data: dayId, error: null }); await expect(createItineraryDay(form())).rejects.toThrow(`REDIRECT:/app/trips/${tripId}/itinerary?day=created`); expect(rpcMock).toHaveBeenCalledWith("create_itinerary_day", expect.objectContaining({ assigned_date: "2027-05-01", target_trip_id: tripId })); });
  it("maps a duplicate date to useful feedback", async () => { rpcMock.mockResolvedValue({ data: null, error: { code: "23505" } }); await expect(createItineraryDay(form())).rejects.toThrow("day=date-taken"); });
  it("updates a day", async () => { rpcMock.mockResolvedValue({ data: "updated", error: null }); await expect(updateItineraryDay(form())).rejects.toThrow("day=updated"); expect(revalidatePathMock).toHaveBeenCalledWith(`/app/trips/${tripId}/itinerary`); });
  it("moves an undated plan up", async () => { const data = form(); data.set("direction", "up"); rpcMock.mockResolvedValue({ data: "moved", error: null }); await expect(moveItineraryDay(data)).rejects.toThrow("day=moved"); expect(rpcMock).toHaveBeenCalledWith("move_undated_itinerary_day", { direction: -1, target_day_id: dayId }); });
  it("removes a day", async () => { rpcMock.mockResolvedValue({ data: "removed", error: null }); await expect(removeItineraryDay(form())).rejects.toThrow("day=removed"); });
  it("redirects unauthenticated users to the exact itinerary", async () => { getUserMock.mockResolvedValue({ data: { user: null } }); await expect(createItineraryDay(form())).rejects.toThrow(`/login?next=/app/trips/${tripId}/itinerary`); expect(rpcMock).not.toHaveBeenCalled(); });
});
