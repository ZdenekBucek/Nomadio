import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteEq: vi.fn(), getUser: vi.fn(), insert: vi.fn(), maybeSingle: vi.fn(), redirect: vi.fn((path: string) => { throw new Error(`REDIRECT:${path}`); }),
  remove: vi.fn(), revalidate: vi.fn(), upload: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn(async () => ({
  auth: { getUser: mocks.getUser },
  from: vi.fn(() => ({
    delete: vi.fn(() => ({ eq: vi.fn(() => ({ eq: mocks.deleteEq })) })),
    insert: mocks.insert,
    select: vi.fn(() => ({ eq: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle: mocks.maybeSingle })) })) })),
  })),
  storage: { from: vi.fn(() => ({ remove: mocks.remove, upload: mocks.upload })) },
})) }));

import { deleteDocument, uploadDocument } from "./document-actions";

function form() {
  const data = new FormData();
  data.set("tripId", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  data.set("name", "Hotelový voucher");
  data.set("category", "accommodation");
  data.set("isImportant", "on");
  data.set("offlineEnabled", "on");
  data.set("file", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], "voucher.pdf", { type: "application/pdf" }));
  return data;
}

describe("document upload action", () => {
  beforeEach(() => {
    mocks.getUser.mockReset().mockResolvedValue({ data: { user: { id: "user-id" } } });
    mocks.upload.mockReset().mockResolvedValue({ error: null });
    mocks.insert.mockReset().mockResolvedValue({ error: null });
    mocks.remove.mockReset().mockResolvedValue({ error: null });
    mocks.maybeSingle.mockReset().mockResolvedValue({ data: { storage_path: "trips/trip/documents/id/file.pdf" }, error: null });
    mocks.deleteEq.mockReset().mockResolvedValue({ error: null });
    mocks.redirect.mockClear(); mocks.revalidate.mockReset();
  });

  it("uploads to the canonical private path and stores metadata", async () => {
    await expect(uploadDocument(form())).rejects.toThrow("documents=created");
    const path = mocks.upload.mock.calls[0]?.[0] as string;
    expect(path).toMatch(/^trips\/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa\/documents\/[0-9a-f-]+\/voucher\.pdf$/);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ is_important: true, offline_enabled: true, mime_type: "application/pdf", storage_path: path }));
  });

  it("removes the uploaded object when metadata persistence fails", async () => {
    mocks.insert.mockResolvedValue({ error: { message: "db" } });
    await expect(uploadDocument(form())).rejects.toThrow("documents=error");
    expect(mocks.remove).toHaveBeenCalledWith([mocks.upload.mock.calls[0]?.[0]]);
  });

  it("deletes the private object and then its metadata", async () => {
    const data = new FormData();
    data.set("tripId", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    data.set("documentId", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    await expect(deleteDocument(data)).rejects.toThrow("documents=removed");
    expect(mocks.remove).toHaveBeenCalledWith(["trips/trip/documents/id/file.pdf"]);
    expect(mocks.deleteEq).toHaveBeenCalledWith("trip_id", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  });
});
