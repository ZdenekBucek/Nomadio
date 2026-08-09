import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock, getUserMock, redirectMock, revalidatePathMock, rpcMock, storageFromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  getUserMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  revalidatePathMock: vi.fn(),
  rpcMock: vi.fn(),
  storageFromMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    from: fromMock,
    rpc: rpcMock,
    storage: { from: storageFromMock },
  })),
}));

import {
  addTripDestination,
  moveTripDestination,
  removeTripDestination,
  updateTripDestination,
  updateTripSettings,
  uploadTripCover,
} from "./settings-actions";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const destinationId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

function settingsForm() {
  const formData = new FormData();
  formData.set("tripId", tripId);
  formData.set("name", "Norsko 2027");
  formData.set("description", "Severská cesta");
  formData.set("startDate", "2027-06-01");
  formData.set("endDate", "2027-06-14");
  formData.set("currency", "NOK");
  formData.set("timezone", "Europe/Oslo");
  formData.set("status", "ready");
  formData.set("coverVariant", "ocean");
  return formData;
}

function destinationForm() {
  const formData = new FormData();
  formData.set("tripId", tripId);
  formData.set("destinationId", destinationId);
  formData.set("countryCode", "SE");
  formData.set("city", "Abisko");
  return formData;
}

describe("trip settings actions", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    redirectMock.mockClear();
    revalidatePathMock.mockReset();
    rpcMock.mockReset();
    fromMock.mockReset();
    storageFromMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("uploads a permitted cover and only then updates metadata", async () => {
    const uploadMock = vi.fn().mockResolvedValue({ error: null });
    storageFromMock.mockReturnValue({ upload: uploadMock, remove: vi.fn() });
    rpcMock.mockResolvedValue({ data: "updated", error: null });
    const form = new FormData();
    form.set("tripId", tripId);
    form.set("cover", new File(["image"], "fjord.webp", { type: "image/webp" }));

    await expect(uploadTripCover(form)).rejects.toThrow(`REDIRECT:/app/trips/${tripId}/settings?cover=uploaded`);
    expect(uploadMock).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`^trips/${tripId}/cover/.+\\.webp$`)), expect.any(File), expect.objectContaining({ contentType: "image/webp", upsert: false }));
    expect(rpcMock).toHaveBeenCalledWith("set_trip_cover_upload", expect.objectContaining({ target_trip_id: tripId }));
  });

  it("rejects invalid or oversized cover files before authentication", async () => {
    const form = new FormData(); form.set("tripId", tripId); form.set("cover", new File(["x"], "cover.svg", { type: "image/svg+xml" }));
    await expect(uploadTripCover(form)).rejects.toThrow(`REDIRECT:/app/trips/${tripId}/settings?cover=invalid`);
    expect(storageFromMock).not.toHaveBeenCalled();
  });

  it("updates valid settings and refreshes every trip view", async () => {
    rpcMock.mockResolvedValue({ data: "updated", error: null });

    await expect(updateTripSettings({ error: null }, settingsForm())).rejects.toThrow(
      `REDIRECT:/app/trips/${tripId}/settings?settings=saved`,
    );

    expect(rpcMock).toHaveBeenCalledWith("update_trip_settings", {
      target_trip_id: tripId,
      trip_cover_variant: "ocean",
      trip_currency: "NOK",
      trip_description: "Severská cesta",
      trip_end_date: "2027-06-14",
      trip_name: "Norsko 2027",
      trip_start_date: "2027-06-01",
      trip_status: "ready",
      trip_timezone: "Europe/Oslo",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/app/trips/${tripId}/settings`);
  });

  it("returns validation feedback without navigating or losing form values", async () => {
    const formData = settingsForm();
    formData.set("endDate", "2027-05-01");

    await expect(updateTripSettings({ error: null }, formData)).resolves.toEqual({
      error: "dates",
    });
    expect(getUserMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("adds a normalized destination", async () => {
    rpcMock.mockResolvedValue({ data: destinationId, error: null });

    await expect(addTripDestination(destinationForm())).rejects.toThrow(
      `REDIRECT:/app/trips/${tripId}/settings?destination=added`,
    );
    expect(rpcMock).toHaveBeenCalledWith("add_trip_destination", {
      destination_city: "Abisko",
      destination_continent: "europe",
      destination_continent_overridden: false,
      destination_country_code: "SE",
      destination_country_name: "Švédsko",
      target_trip_id: tripId,
    });
  });

  it("updates an existing destination", async () => {
    rpcMock.mockResolvedValue({ data: "updated", error: null });

    await expect(updateTripDestination(destinationForm())).rejects.toThrow(
      `REDIRECT:/app/trips/${tripId}/settings?destination=updated`,
    );
    expect(rpcMock).toHaveBeenCalledWith(
      "update_trip_destination",
      expect.objectContaining({ target_destination_id: destinationId }),
    );
  });

  it("moves a destination in the requested direction", async () => {
    const formData = destinationForm();
    formData.set("direction", "up");
    rpcMock.mockResolvedValue({ data: "moved", error: null });

    await expect(moveTripDestination(formData)).rejects.toThrow(
      `REDIRECT:/app/trips/${tripId}/settings?destination=moved`,
    );
    expect(rpcMock).toHaveBeenCalledWith("move_trip_destination", {
      direction: -1,
      target_destination_id: destinationId,
    });
  });

  it("reports an attempt to remove the primary destination", async () => {
    rpcMock.mockResolvedValue({ data: "primary_destination", error: null });

    await expect(removeTripDestination(destinationForm())).rejects.toThrow(
      `REDIRECT:/app/trips/${tripId}/settings?destination=primary-destination`,
    );
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("removes a secondary destination", async () => {
    rpcMock.mockResolvedValue({ data: "removed", error: null });

    await expect(removeTripDestination(destinationForm())).rejects.toThrow(
      `REDIRECT:/app/trips/${tripId}/settings?destination=removed`,
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/trips");
  });

  it("returns an unauthenticated user to login with the exact settings route", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(addTripDestination(destinationForm())).rejects.toThrow(
      `REDIRECT:/login?next=/app/trips/${tripId}/settings`,
    );
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
