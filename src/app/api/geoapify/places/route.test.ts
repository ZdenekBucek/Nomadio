import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, searchMock } = vi.hoisted(() => ({ createClientMock: vi.fn(), searchMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/features/places/geoapify", () => ({
  GeoapifySearchError: class GeoapifySearchError extends Error {
    constructor(public kind: "provider" | "timeout", public status?: number) { super(); }
  },
  searchGeoapifyPlaces: searchMock,
}));
import { GET } from "./route";
import { GeoapifySearchError } from "@/features/places/geoapify";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const originalKey = process.env.GEOAPIFY_API_KEY;

function client({ role = "owner", user = true }: { role?: string; user?: boolean } = {}) {
  const results = {
    trips: { data: { id: tripId, status: "planning" }, error: null },
    trip_members: { data: { role }, error: null },
    trip_destinations: { data: [{ country_code: "CZ" }], error: null },
  };
  return {
    auth: { getUser: vi.fn(async () => ({ data: { user: user ? { id: "user" } : null } })) },
    from: vi.fn((table: keyof typeof results) => {
      const builder = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => table === "trip_destinations" ? Promise.resolve(results[table]) : builder),
        maybeSingle: vi.fn(async () => results[table]),
      };
      return builder;
    }),
  };
}

beforeEach(() => {
  process.env.GEOAPIFY_API_KEY = "not-a-secret";
  createClientMock.mockReset();
  searchMock.mockReset();
});

afterEach(() => {
  if (originalKey === undefined) delete process.env.GEOAPIFY_API_KEY;
  else process.env.GEOAPIFY_API_KEY = originalKey;
});

describe("Geoapify places route", () => {
  it("rejects short and oversized queries before authentication", async () => {
    expect((await GET(new Request(`http://localhost/api/geoapify/places?q=ab&tripId=${tripId}`))).status).toBe(400);
    expect((await GET(new Request(`http://localhost/api/geoapify/places?q=${"a".repeat(101)}&tripId=${tripId}`))).status).toBe(400);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("handles a missing API key safely", async () => {
    delete process.env.GEOAPIFY_API_KEY;
    createClientMock.mockResolvedValue(client());
    const response = await GET(new Request(`http://localhost/api/geoapify/places?q=Praha&tripId=${tripId}`));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: "not_configured" });
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("blocks viewers before a provider request", async () => {
    createClientMock.mockResolvedValue(client({ role: "viewer" }));
    const response = await GET(new Request(`http://localhost/api/geoapify/places?q=Praha&tripId=${tripId}`));
    expect(response.status).toBe(403);
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("normalizes whitespace and supplies trip country context", async () => {
    createClientMock.mockResolvedValue(client());
    searchMock.mockResolvedValue([{ name: "Praha" }]);
    const response = await GET(new Request(`http://localhost/api/geoapify/places?q=%20Hotel%20%20Praha%20&tripId=${tripId}`));
    expect(response.status).toBe(200);
    expect(searchMock).toHaveBeenCalledWith(expect.objectContaining({ countryCodes: ["CZ"], query: "Hotel Praha" }));
  });

  it.each([
    [new Error("provider"), 502],
    [new GeoapifySearchError("timeout"), 504],
  ])("returns only a safe provider error", async (error, expectedStatus) => {
    createClientMock.mockResolvedValue(client());
    searchMock.mockRejectedValue(error);
    const response = await GET(new Request(`http://localhost/api/geoapify/places?q=Praha&tripId=${tripId}`));
    expect(response.status).toBe(expectedStatus);
    expect(JSON.stringify(await response.json())).not.toContain("not-a-secret");
  });
});
