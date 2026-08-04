import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, signOutMock } = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signOut: signOutMock,
    },
  })),
}));

import { signOut } from "./actions";

describe("signOut", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    signOutMock.mockReset();
  });

  it("ends only the current browser session and returns to login", async () => {
    await signOut();

    expect(signOutMock).toHaveBeenCalledWith({ scope: "local" });
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
