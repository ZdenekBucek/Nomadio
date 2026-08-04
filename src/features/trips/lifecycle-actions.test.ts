import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, redirectMock, revalidatePathMock, rpcMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  revalidatePathMock: vi.fn(),
  rpcMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    rpc: rpcMock,
  })),
}));

import { archiveTrip, deleteTrip, restoreTrip } from "./lifecycle-actions";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function tripForm() {
  const formData = new FormData();
  formData.set("tripId", tripId);
  return formData;
}

describe("trip lifecycle actions", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    redirectMock.mockClear();
    revalidatePathMock.mockReset();
    rpcMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
  });

  it("archives a trip and opens the archive filter", async () => {
    rpcMock.mockResolvedValue({ data: "archived", error: null });

    await expect(archiveTrip(tripForm())).rejects.toThrow(
      "REDIRECT:/app/trips?filter=archive&lifecycle=archived",
    );
    expect(rpcMock).toHaveBeenCalledWith("archive_trip", { target_trip_id: tripId });
    expect(revalidatePathMock).toHaveBeenCalledWith(`/app/trips/${tripId}`);
  });

  it("restores a trip and returns to the regular list", async () => {
    rpcMock.mockResolvedValue({ data: "restored", error: null });

    await expect(restoreTrip(tripForm())).rejects.toThrow(
      "REDIRECT:/app/trips?filter=all&lifecycle=restored",
    );
    expect(rpcMock).toHaveBeenCalledWith("restore_trip", { target_trip_id: tripId });
  });

  it("keeps a trip when its confirmation name does not match", async () => {
    const formData = tripForm();
    formData.set("confirmationName", "Nesprávný název");
    rpcMock.mockResolvedValue({ data: "name_mismatch", error: null });

    await expect(deleteTrip({ error: null }, formData)).resolves.toEqual({ error: "mismatch" });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("deletes a trip after exact confirmation", async () => {
    const formData = tripForm();
    formData.set("confirmationName", "Norsko 2027");
    rpcMock.mockResolvedValue({ data: "deleted", error: null });

    await expect(deleteTrip({ error: null }, formData)).rejects.toThrow(
      "REDIRECT:/app/trips?filter=all&lifecycle=deleted",
    );
    expect(rpcMock).toHaveBeenCalledWith("delete_trip", {
      confirmation_name: "Norsko 2027",
      target_trip_id: tripId,
    });
  });

  it("rejects invalid input before authentication", async () => {
    const formData = tripForm();
    formData.set("confirmationName", "");

    await expect(deleteTrip({ error: null }, formData)).resolves.toEqual({ error: "invalid" });
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it("returns an unauthenticated user to the exact settings route", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(archiveTrip(tripForm())).rejects.toThrow(
      `REDIRECT:/login?next=/app/trips/${tripId}/settings`,
    );
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
