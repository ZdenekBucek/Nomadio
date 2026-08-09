import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DocumentWithLink } from "./document-model";
import { DocumentList } from "./document-list";

const document = {
  category: "accommodation",
  created_at: "2026-08-08T00:00:00Z",
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  is_important: true,
  linked_entity_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  linked_entity_type: "accommodation",
  linkedEntityLabel: "Hotel Oslo",
  mime_type: "application/pdf",
  name: "Hotelový voucher",
  offline_enabled: true,
  size_bytes: 2048,
  storage_path: "trips/a/documents/b/voucher.pdf",
  trip_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  updated_at: "2026-08-08T00:00:00Z",
  uploaded_by: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
} satisfies DocumentWithLink;

afterEach(cleanup);

describe("DocumentList", () => {
  it("shows summary, metadata, link and offline state", () => {
    render(<DocumentList canEdit={false} filter="all" items={[document]} tripId={document.trip_id} />);
    expect(screen.getByText("Hotelový voucher")).toBeInTheDocument();
    expect(screen.getByText("PDF · 2 kB")).toBeInTheDocument();
    expect(screen.getByText("Hotel Oslo")).toBeInTheDocument();
    expect(screen.getByText("Vybráno")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Hotelový voucher/ })).toHaveAttribute("href", `/app/trips/${document.trip_id}/documents/${document.id}`);
  });

  it("applies important and category filters", () => {
    const { rerender } = render(<DocumentList canEdit={false} filter="important" items={[document]} tripId={document.trip_id} />);
    expect(screen.getByText("Hotelový voucher")).toBeInTheDocument();
    rerender(<DocumentList canEdit={false} filter="transport" items={[document]} tripId={document.trip_id} />);
    expect(screen.queryByText("Hotelový voucher")).not.toBeInTheDocument();
    expect(screen.getByText("Žádné dokumenty v tomto filtru")).toBeInTheDocument();
  });

  it("offers upload CTA only to editors when the trip has no documents", () => {
    const { rerender } = render(<DocumentList canEdit filter="all" items={[]} tripId={document.trip_id} />);
    expect(screen.getByRole("link", { name: "Nahrát dokument" })).toHaveAttribute("href", `/app/trips/${document.trip_id}/documents?new=1`);
    rerender(<DocumentList canEdit={false} filter="all" items={[]} tripId={document.trip_id} />);
    expect(screen.queryByRole("link", { name: "Nahrát dokument" })).not.toBeInTheDocument();
  });
});
