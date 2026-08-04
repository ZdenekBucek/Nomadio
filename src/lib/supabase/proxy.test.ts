import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

type CookieToSet = {
  name: string;
  value: string;
  options?: {
    maxAge?: number;
    path?: string;
  };
};

const authState = vi.hoisted(() => ({
  subject: null as string | null,
  cookiesToSet: [] as CookieToSet[],
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _publishableKey: string,
    options: {
      cookies: {
        setAll: (cookies: CookieToSet[]) => void;
      };
    },
  ) => ({
    auth: {
      getClaims: async () => {
        options.cookies.setAll(authState.cookiesToSet);

        return {
          data: authState.subject
            ? { claims: { sub: authState.subject } }
            : { claims: null },
        };
      },
    },
  }),
}));

vi.mock("./config", () => ({
  getSupabaseConfig: () => ({
    url: "https://example.supabase.co",
    publishableKey: "synthetic-public-key",
  }),
}));

import { updateSession } from "./proxy";

describe("updateSession", () => {
  beforeEach(() => {
    authState.subject = null;
    authState.cookiesToSet = [];
  });

  it("redirects an invalid private session and preserves its cookie cleanup", async () => {
    authState.cookiesToSet = [
      {
        name: "sb-example-auth-token",
        value: "",
        options: { maxAge: 0, path: "/" },
      },
    ];

    const response = await updateSession(
      new NextRequest("http://localhost:3000/app?view=upcoming"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?next=%2Fapp%3Fview%3Dupcoming",
    );
    expect(response.cookies.get("sb-example-auth-token")?.value).toBe("");
  });

  it("redirects an authenticated user away from the login page", async () => {
    authState.subject = "00000000-0000-0000-0000-000000000001";

    const response = await updateSession(
      new NextRequest("http://localhost:3000/login?next=%2Fapp"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/app");
  });
});
