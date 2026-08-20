import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedProfile: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/features/auth/session", () => ({
  getAuthenticatedProfile: mocks.getAuthenticatedProfile,
}));

import Home from "./page";

describe("root route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects an unauthenticated visitor to the login screen", async () => {
    mocks.getAuthenticatedProfile.mockResolvedValue(null);

    await expect(Home()).rejects.toThrow("REDIRECT:/login");
    expect(mocks.redirect).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });

  it("redirects an authenticated visitor to the app", async () => {
    mocks.getAuthenticatedProfile.mockResolvedValue({
      id: "00000000-0000-0000-0000-000000000001",
      profile: {},
    });

    await expect(Home()).rejects.toThrow("REDIRECT:/app");
    expect(mocks.redirect).toHaveBeenCalledOnce();
    expect(mocks.redirect).toHaveBeenCalledWith("/app");
  });
});
