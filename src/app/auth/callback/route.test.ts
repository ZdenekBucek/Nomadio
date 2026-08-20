import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { exchangeCodeForSession: mocks.exchangeCodeForSession },
  })),
}));

import { GET } from "./route";

describe("Google OAuth callback", () => {
  beforeEach(() => {
    mocks.exchangeCodeForSession.mockReset();
  });

  it("continues to the app on the production request origin", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new Request(
        "https://nomadio.vercel.app/auth/callback?code=oauth-code&next=%2Fapp",
      ),
    );

    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    expect(response.headers.get("location")).toBe(
      "https://nomadio.vercel.app/app",
    );
  });

  it("keeps localhost for a local callback", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });

    const response = await GET(
      new Request(
        "http://localhost:3000/auth/callback?code=oauth-code&next=%2Fapp",
      ),
    );

    expect(response.headers.get("location")).toBe("http://localhost:3000/app");
  });

  it("returns callback failures to login on the same origin", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({
      error: new Error("exchange failed"),
    });

    const response = await GET(
      new Request("https://nomadio.vercel.app/auth/callback?code=bad-code"),
    );

    expect(response.headers.get("location")).toBe(
      "https://nomadio.vercel.app/login?error=callback",
    );
  });
});
