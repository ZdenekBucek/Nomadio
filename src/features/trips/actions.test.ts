import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getUserMock,
  rpcMock,
  redirectMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  rpcMock: vi.fn(),
  redirectMock: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  revalidatePathMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: getUserMock },
    rpc: rpcMock,
  })),
}));

import { createTrip } from "./actions";

function validForm() {
  const formData = new FormData();
  formData.set("name", "Japonsko 2027");
  formData.set("countryCode", "JP");
  formData.set("city", "Tokio");
  formData.set("description", "Jarní cesta");
  formData.set("currency", "JPY");
  formData.set("startDate", "2027-05-15");
  formData.set("endDate", "2027-05-30");
  formData.set("status", "planning");
  formData.set("coverVariant", "ocean");
  return formData;
}

describe("createTrip", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    rpcMock.mockReset();
    redirectMock.mockClear();
    revalidatePathMock.mockReset();

    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    rpcMock.mockResolvedValue({ data: "trip-1", error: null });
  });

  it("creates a private trip for the authenticated user", async () => {
    await expect(createTrip(validForm())).rejects.toThrow(
      /REDIRECT:\/app\/trips\?created=/,
    );

    expect(rpcMock).toHaveBeenCalledWith("create_private_trip", {
      destination_city: "Tokio",
      destination_continent: "asia",
      destination_continent_overridden: false,
      destination_country_code: "JP",
      destination_country_name: "Japonsko",
      trip_cover_variant: "ocean",
      trip_currency: "JPY",
      trip_description: "Jarní cesta",
      trip_end_date: "2027-05-30",
      trip_name: "Japonsko 2027",
      trip_start_date: "2027-05-15",
      trip_status: "planning",
      trip_timezone: "Europe/Prague",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/trips");
  });

  it("returns an unauthenticated user to login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(createTrip(validForm())).rejects.toThrow(
      "REDIRECT:/login?next=/app/trips",
    );
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("does not call Supabase when validation fails", async () => {
    const formData = validForm();
    formData.set("endDate", "2027-05-01");

    await expect(createTrip(formData)).rejects.toThrow(
      "REDIRECT:/app/trips?error=dates",
    );
    expect(getUserMock).not.toHaveBeenCalled();
  });
});
