import { describe, expect, it } from "vitest";
import { maxDocumentSizeBytes, parseDocumentMetadata, safeDocumentFilename, validateDocumentFile } from "./document-input";

function metadata(overrides: Record<string, string> = {}) {
  const data = new FormData();
  data.set("name", overrides.name ?? "Letenka");
  data.set("category", overrides.category ?? "transport");
  if (overrides.linkedEntity) data.set("linkedEntity", overrides.linkedEntity);
  if (overrides.isImportant) data.set("isImportant", overrides.isImportant);
  if (overrides.offlineEnabled) data.set("offlineEnabled", overrides.offlineEnabled);
  return data;
}

describe("document input", () => {
  it("parses flags and accommodation/transport links", () => {
    expect(parseDocumentMetadata(metadata({ linkedEntity: "accommodation:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", isImportant: "on", offlineEnabled: "on" }))).toEqual({ success: true, data: expect.objectContaining({ linkedEntityType: "accommodation", isImportant: true, offlineEnabled: true }) });
    expect(parseDocumentMetadata(metadata({ linkedEntity: "transport:bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" }))).toEqual({ success: true, data: expect.objectContaining({ linkedEntityType: "transport" }) });
  });

  it("rejects invalid metadata links", () => {
    expect(parseDocumentMetadata(metadata({ linkedEntity: "transport:not-a-uuid" }))).toEqual({ success: false });
    expect(parseDocumentMetadata(metadata({ name: " " }))).toEqual({ success: false });
  });

  it("accepts valid PDF, JPG and PNG signatures", async () => {
    const pdf = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])], "voucher.pdf", { type: "application/pdf" });
    const jpg = new File([new Uint8Array([0xff, 0xd8, 0xff])], "ticket.jpeg", { type: "image/jpeg" });
    const png = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], "visa.png", { type: "image/png" });
    await expect(validateDocumentFile(pdf)).resolves.toMatchObject({ success: true, safeFilename: "voucher.pdf" });
    await expect(validateDocumentFile(jpg)).resolves.toMatchObject({ success: true, safeFilename: "ticket.jpg" });
    await expect(validateDocumentFile(png)).resolves.toMatchObject({ success: true, safeFilename: "visa.png" });
  });

  it("rejects empty, oversized, unsafe and spoofed files", async () => {
    await expect(validateDocumentFile(new File([], "empty.pdf", { type: "application/pdf" }))).resolves.toEqual({ success: false });
    await expect(validateDocumentFile(new File([new Uint8Array(maxDocumentSizeBytes + 1)], "large.pdf", { type: "application/pdf" }))).resolves.toEqual({ success: false });
    await expect(validateDocumentFile(new File(["hello"], "bad.html", { type: "text/html" }))).resolves.toEqual({ success: false });
    await expect(validateDocumentFile(new File(["not pdf"], "spoofed.pdf", { type: "application/pdf" }))).resolves.toEqual({ success: false });
  });

  it("normalizes a safe storage filename", () => {
    expect(safeDocumentFilename("Potvrzení hotelu 2026.PDF", "application/pdf")).toBe("Potvrzeni-hotelu-2026.pdf");
    expect(safeDocumentFilename("../../", "image/png")).toBe("document.png");
  });
});
