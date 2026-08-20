import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUserMock, eqMock, redirectMock, revalidatePathMock } = vi.hoisted(() => ({
  getUserMock: vi.fn(), eqMock: vi.fn(), redirectMock: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }), revalidatePathMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({ auth: { getUser: getUserMock }, from: vi.fn(() => ({ update: vi.fn(() => ({ eq: eqMock })) })) })) }));

import { updateQuickExpenseFabPreference } from "./preferences-actions";

describe("quick expense FAB preference", () => {
  beforeEach(() => { getUserMock.mockResolvedValue({ data: { user: { id: "user" } } }); eqMock.mockResolvedValue({ error: null }); redirectMock.mockClear(); revalidatePathMock.mockClear(); });

  it("updates only the current user's boolean preference", async () => {
    const form = new FormData(); form.set("quickExpenseFabEnabled", "true");
    await expect(updateQuickExpenseFabPreference(form)).rejects.toThrow("REDIRECT:/app/settings?preference=saved");
    expect(eqMock).toHaveBeenCalledWith("id", "user");
    expect(revalidatePathMock).toHaveBeenCalledWith("/app", "layout");
  });

  it("rejects non-boolean input", async () => {
    const form = new FormData(); form.set("quickExpenseFabEnabled", "yes");
    await expect(updateQuickExpenseFabPreference(form)).rejects.toThrow("preference=invalid");
  });
});
