import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, requestOrigin, signInWithOAuthMock, signOutMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  requestOrigin: { value: "http://localhost:3000" },
  signInWithOAuthMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers({ origin: requestOrigin.value })),
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
    requestOrigin.value = "http://localhost:3000";
    signOutMock.mockReset();
    signInWithOAuthMock.mockReset();
  });

  it("uses the production request origin for the Google OAuth callback", async () => {
    requestOrigin.value = "https://nomadio.vercel.app";
    signInWithOAuthMock.mockResolvedValue({ data: { url: "https://accounts.google.test/continue" }, error: null });
    const formData = new FormData();
    formData.set("next", "/app/trips");

    await signInWithGoogle(formData);

    expect(signInWithOAuthMock).toHaveBeenCalledWith(expect.objectContaining({ provider: "google", options: { redirectTo: "https://nomadio.vercel.app/auth/callback?next=%2Fapp%2Ftrips" } }));
    expect(redirectMock).toHaveBeenCalledWith("https://accounts.google.test/continue");
  });

  it("keeps the local request origin during development", async () => {
    signInWithOAuthMock.mockResolvedValue({ data: { url: "https://accounts.google.test/continue" }, error: null });

    await signInWithGoogle(new FormData());

    expect(signInWithOAuthMock).toHaveBeenCalledWith(expect.objectContaining({
      options: { redirectTo: "http://localhost:3000/auth/callback?next=%2Fapp" },
    }));
  });

  it("ends only the current browser session and returns to login", async () => {
    await signOut();

    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
