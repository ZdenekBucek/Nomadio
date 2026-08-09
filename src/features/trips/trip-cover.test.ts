import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSignedUrlMock } = vi.hoisted(() => ({ createSignedUrlMock: vi.fn() }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({ storage: { from: vi.fn(() => ({ createSignedUrl: createSignedUrlMock })) } })),
}));

import { getTripCover } from "./trip-cover";

const base = { cover_kind: "gradient" as const, cover_storage_path: null, cover_url: null, cover_variant: "violet" as const };

describe("getTripCover", () => {
  beforeEach(() => createSignedUrlMock.mockReset());

  it("returns a short-lived Storage URL for an uploaded cover", async () => {
    createSignedUrlMock.mockResolvedValue({ data: { signedUrl: "https://storage.test/signed" }, error: null });
    await expect(getTripCover({ ...base, cover_kind: "upload", cover_storage_path: "trips/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/cover/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb.webp" })).resolves.toEqual({ imageUrl: "https://storage.test/signed", variant: "violet" });
  });

  it("uses the gradient when no upload exists or signing fails", async () => {
    await expect(getTripCover(base)).resolves.toEqual({ imageUrl: null, variant: "violet" });
    createSignedUrlMock.mockResolvedValue({ data: null, error: new Error("missing") });
    await expect(getTripCover({ ...base, cover_kind: "upload", cover_storage_path: "path" })).resolves.toEqual({ imageUrl: null, variant: "violet" });
  });
});
