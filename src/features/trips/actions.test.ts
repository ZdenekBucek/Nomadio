import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getUserMock,
  insertMock,
  redirectMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  insertMock: vi.fn(),
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
    from: () => ({
      insert: insertMock,
    }),
  })),
}));

import { createTrip } from "./actions";

function validForm() {
  const formData = new FormData();
  formData.set("name", "Japonsko 2027");
  formData.set("country", "Japonsko");
  formData.set("city", "Tokio");
  formData.set("currency", "JPY");
  formData.set("startDate", "2027-05-15");
  formData.set("endDate", "2027-05-30");
  return formData;
}

describe("createTrip", () => {
  beforeEach(() => {
    getUserMock.mockReset();
    insertMock.mockReset();
    redirectMock.mockClear();
    revalidatePathMock.mockReset();

    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } });
    insertMock.mockResolvedValue({ error: null });
  });

  it("creates a private trip for the authenticated user", async () => {
    await expect(createTrip(validForm())).rejects.toThrow(
      /REDIRECT:\/app\/trips\?created=/,
    );

    expect(insertMock).toHaveBeenCalledWith({
      cities: ["Tokio"],
      countries: ["Japonsko"],
      created_by: "user-1",
      currency: "JPY",
      end_date: "2027-05-30",
      id: expect.any(String),
      name: "Japonsko 2027",
      start_date: "2027-05-15",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/trips");
  });

  it("returns an unauthenticated user to login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });

    await expect(createTrip(validForm())).rejects.toThrow(
      "REDIRECT:/login?next=/app/trips",
    );
    expect(insertMock).not.toHaveBeenCalled();
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
