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

import { createTrip, shareTrip } from "./actions";

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
  formData.append("travelerName", "Anna");
  formData.append("travelerName", "Petr");
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
      traveler_names: ["Anna", "Petr"],
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

describe("shareTrip", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    rpcMock.mockReset();
    redirectMock.mockClear();
    revalidatePathMock.mockReset();

    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    rpcMock.mockResolvedValue({ data: "added", error: null });
  });

  function shareForm() {
    const formData = new FormData();
    formData.set("tripId", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    formData.set("email", " Editor@Example.com ");
    formData.set("role", "editor");
    formData.set("filter", "upcoming");
    return formData;
  }

  it("adds an existing account by normalized email", async () => {
    await expect(shareTrip(shareForm())).rejects.toThrow(
      "REDIRECT:/app/trips?share=added&filter=upcoming",
    );

    expect(rpcMock).toHaveBeenCalledWith("add_trip_member_by_email", {
      target_email: "editor@example.com",
      target_role: "editor",
      target_trip_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/trips");
  });

  it("reports an account that does not exist without revalidation", async () => {
    rpcMock.mockResolvedValue({ data: "user_not_found", error: null });

    await expect(shareTrip(shareForm())).rejects.toThrow(
      "REDIRECT:/app/trips?share=user-not-found&filter=upcoming",
    );
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects invalid input before contacting Supabase", async () => {
    const formData = shareForm();
    formData.set("email", "not-an-email");

    await expect(shareTrip(formData)).rejects.toThrow(
      "REDIRECT:/app/trips?share=invalid&filter=upcoming",
    );
    expect(getUserMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
