import { beforeEach, describe, expect, it, vi } from "vitest";

const { deleteMock, fromMock, getUserMock, insertMock, redirectMock, revalidatePathMock, rpcMock, updateMock } = vi.hoisted(() => ({
  deleteMock: vi.fn(),
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
  insertMock: vi.fn(),
  redirectMock: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
  revalidatePathMock: vi.fn(),
  rpcMock: vi.fn(),
  updateMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ auth: { getUser: getUserMock }, from: fromMock, rpc: rpcMock })) }));

import { createAccommodation, deleteAccommodation, updateAccommodation } from "./accommodation-actions";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const accommodationId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const placeId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function form() {
  const data = new FormData();
  data.set("tripId", tripId);
  data.set("accommodationId", accommodationId);
  data.set("name", "Hotel Nord");
  data.set("accommodationType", "hotel");
  data.set("checkInDate", "2027-06-01");
  data.set("checkOutDate", "2027-06-04");
  data.set("paymentStatus", "unpaid");
  data.set("totalPrice", "18500");
  data.set("paidAmount", "0");
  data.set("balanceDueDate", "2027-05-15");
  data.set("placeMode", "saved");
  data.set("placeId", placeId);
  return data;
}

function externalForm() {
  const data = form();
  data.set("placeMode", "external");
  data.set("provider", "geoapify");
  data.set("providerPlaceId", "geo-hotel-1");
  data.set("providerCategory", "accommodation.hotel");
  data.set("externalName", "Hotel Geo");
  data.set("address", "Přístav 1, Bodø, Norsko");
  data.set("city", "Bodø");
  data.set("countryCode", "NO");
  data.set("latitude", "67.28");
  data.set("longitude", "14.4");
  data.set("suggestedCategory", "accommodation");
  data.set("category", "accommodation");
  data.set("attribution", "Powered by Geoapify · © OpenStreetMap contributors");
  return data;
}

describe("accommodation actions", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "user-id" } } });
    insertMock.mockReset().mockResolvedValue({ error: null });
    rpcMock.mockReset().mockResolvedValue({ data: placeId, error: null });
    updateMock.mockReset().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) });
    deleteMock.mockReset().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) });
    fromMock.mockReset().mockReturnValue({ delete: deleteMock, insert: insertMock, update: updateMock });
    redirectMock.mockClear();
    revalidatePathMock.mockReset();
  });

  it("creates an accommodation with an existing saved place without duplicating it", async () => {
    await expect(createAccommodation(form())).rejects.toThrow("accommodation=created");
    expect(rpcMock).not.toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ balance_due_date: "2027-05-15", name: "Hotel Nord", paid_amount: 0, place_id: placeId, total_price: 18500, trip_id: tripId }));
  });

  it("creates or reuses a normalized Geoapify place before linking it", async () => {
    await expect(createAccommodation(externalForm())).rejects.toThrow("accommodation=created");
    expect(rpcMock).toHaveBeenCalledWith("create_external_trip_place", expect.objectContaining({ source_provider: "geoapify", source_provider_place_id: "geo-hotel-1" }));
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({ place_id: placeId }));
  });

  it("updates only the accommodation link, not the place record", async () => {
    await expect(updateAccommodation(form())).rejects.toThrow("accommodation=updated");
    expect(fromMock).toHaveBeenCalledWith("accommodations");
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ place_id: placeId }));
  });

  it("deletes only the accommodation row", async () => {
    await expect(deleteAccommodation(form())).rejects.toThrow("accommodation=removed");
    expect(fromMock).toHaveBeenCalledTimes(1);
    expect(fromMock).toHaveBeenCalledWith("accommodations");
  });
});
