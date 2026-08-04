import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createClientMock, searchMock } = vi.hoisted(() => ({ createClientMock: vi.fn(), searchMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("@/features/places/mapbox", () => ({
  MapboxSearchError: class MapboxSearchError extends Error { constructor(public status: number) { super(); } },
  searchMapboxPlaces: searchMock,
}));
import { GET } from "./route";

const tripId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const originalToken = process.env.MAPBOX_ACCESS_TOKEN;

function client({ role = "owner", user = true }: { role?: string; user?: boolean } = {}) {
  const results = {
    trips: { data: { id: tripId, status: "planning" }, error: null },
    trip_members: { data: { role }, error: null },
    trip_destinations: { data: [{ country_code: "NO" }], error: null },
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
  process.env.MAPBOX_ACCESS_TOKEN = "test-token";
  createClientMock.mockReset();
  searchMock.mockReset();
});
afterEach(() => {
  if (originalToken === undefined) delete process.env.MAPBOX_ACCESS_TOKEN;
  else process.env.MAPBOX_ACCESS_TOKEN = originalToken;
});

describe("Mapbox places route", () => {
  it("rejects malformed requests before authentication", async () => {
    const response = await GET(new Request("http://localhost/api/mapbox/places?q=ab&tripId=bad"));
    expect(response.status).toBe(400);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("requires authentication", async () => {
    createClientMock.mockResolvedValue(client({ user: false }));
    const response = await GET(new Request(`http://localhost/api/mapbox/places?q=Bodo&tripId=${tripId}`));
    expect(response.status).toBe(401);
  });

  it("does not let viewers spend provider requests", async () => {
    createClientMock.mockResolvedValue(client({ role: "viewer" }));
    const response = await GET(new Request(`http://localhost/api/mapbox/places?q=Bodo&tripId=${tripId}`));
    expect(response.status).toBe(403);
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("searches with the trip country context", async () => {
    createClientMock.mockResolvedValue(client());
    searchMock.mockResolvedValue([{ name: "Bodø" }]);
    const response = await GET(new Request(`http://localhost/api/mapbox/places?q=Bodo&tripId=${tripId}`));
    expect(response.status).toBe(200);
    expect(searchMock).toHaveBeenCalledWith(expect.objectContaining({ accessToken: "test-token", countryCodes: ["NO"], query: "Bodo" }));
  });
});
