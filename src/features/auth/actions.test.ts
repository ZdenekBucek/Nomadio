import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, signInWithOAuthMock, signOutMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  signInWithOAuthMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signInWithOAuth: signInWithOAuthMock,
      signOut: signOutMock,
    },
  })),
}));

import { signInWithGoogle, signOut } from "./actions";

describe("signOut", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    signOutMock.mockReset();
    signInWithOAuthMock.mockReset();
  });

  it("starts the unchanged Google OAuth flow with a safe callback", async () => {
    signInWithOAuthMock.mockResolvedValue({ data: { url: "https://accounts.google.test/continue" }, error: null });
    const formData = new FormData();
    formData.set("next", "/app/trips");

    await signInWithGoogle(formData);

    expect(signInWithOAuthMock).toHaveBeenCalledWith(expect.objectContaining({ provider: "google", options: expect.objectContaining({ redirectTo: expect.stringContaining("/auth/callback?next=%2Fapp%2Ftrips") }) }));
    expect(redirectMock).toHaveBeenCalledWith("https://accounts.google.test/continue");
  });

  it("ends only the current browser session and returns to login", async () => {
    await signOut();

    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
