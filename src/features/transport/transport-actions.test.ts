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

import { deleteTransportBooking, saveTransportBooking } from "./transport-actions";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const bookingId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const placeId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function form() {
  const data = new FormData();
  data.set("tripId", tripId); data.set("bookingId", ""); data.set("title", "Let do Osla"); data.set("transportType", "flight"); data.set("status", "booked");
  data.set("totalPrice", "9800"); data.set("paidAmount", "2000"); data.set("currency", "NOK"); data.set("paymentStatus", "partially_paid"); data.set("balanceDueDate", "2027-05-15");
  data.set("segments", JSON.stringify([{ departurePlace: { mode: "saved", placeId }, arrivalPlace: { mode: "none" }, departureAt: "2027-06-02T08:00", arrivalAt: "2027-06-02T10:00", serviceNumber: "DY123", terminal: "2", platform: "", seat: "12A", baggage: "", notes: "" }]));
  return data;
}

const external = { category: "transport", mode: "external", result: { provider: "geoapify", providerPlaceId: "airport-osl", name: "Oslo lufthavn", formattedAddress: "Gardermoen, Norsko", city: "Gardermoen", countryCode: "NO", latitude: 60.1939, longitude: 11.1004, providerCategories: ["public_transport.air"], category: "transport", attribution: "Powered by Geoapify · © OpenStreetMap contributors" } };

describe("transport actions", () => {
  beforeEach(() => {
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: "user" } } });
    rpcMock.mockReset().mockImplementation(async (name: string) => name === "create_external_trip_place" ? { data: placeId, error: null } : name === "save_transport_booking" ? { data: bookingId, error: null } : { data: "removed", error: null });
    redirectMock.mockClear(); revalidatePathMock.mockReset();
  });

  it("saves a normalized booking and ordered segments through the atomic RPC", async () => {
    await expect(saveTransportBooking(form())).rejects.toThrow("transport=created");
    expect(rpcMock).toHaveBeenCalledWith("save_transport_booking", expect.objectContaining({
      booking_paid_amount: 2000, booking_total_price: 9800, target_booking_id: null, target_trip_id: tripId,
      booking_segments: [expect.objectContaining({ departure_place_id: placeId, service_number: "DY123" })],
    }));
    expect(rpcMock).not.toHaveBeenCalledWith("create_external_trip_place", expect.anything());
  });

  it("creates or reuses one Geoapify place when both ends select the same result", async () => {
    const data = form();
    const segments = JSON.parse(data.get("segments")!.toString()); segments[0].departurePlace = external; segments[0].arrivalPlace = external;
    data.set("segments", JSON.stringify(segments));
    await expect(saveTransportBooking(data)).rejects.toThrow("transport=created");
    expect(rpcMock.mock.calls.filter(([name]) => name === "create_external_trip_place")).toHaveLength(1);
    expect(rpcMock).toHaveBeenCalledWith("save_transport_booking", expect.objectContaining({ booking_segments: [expect.objectContaining({ arrival_place_id: placeId, departure_place_id: placeId })] }));
  });

  it("updates an existing booking through the same RPC", async () => {
    const data = form(); data.set("bookingId", bookingId);
    await expect(saveTransportBooking(data)).rejects.toThrow("transport=updated");
    expect(rpcMock).toHaveBeenCalledWith("save_transport_booking", expect.objectContaining({ target_booking_id: bookingId }));
  });

  it("maps the stable DST marker to a safe segment-level form error", async () => {
    rpcMock.mockImplementation(async (name: string) => name === "save_transport_booking"
      ? { data: null, error: { message: "transport_nonexistent_local_time:departure:1" } }
      : { data: null, error: null });
    await expect(saveTransportBooking(form())).rejects.toThrow("transport=nonexistent-time&field=departure&segment=1");
    expect(redirectMock).toHaveBeenCalledWith(`/app/trips/${tripId}/transport?transport=nonexistent-time&field=departure&segment=1`);
  });

  it("deletes the booking through the dedicated caller-permission RPC", async () => {
    const data = new FormData(); data.set("tripId", tripId); data.set("bookingId", bookingId);
    await expect(deleteTransportBooking(data)).rejects.toThrow("transport=removed");
    expect(rpcMock).toHaveBeenCalledWith("remove_transport_booking", { target_booking_id: bookingId });
  });
});
