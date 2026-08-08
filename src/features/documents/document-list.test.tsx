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
    render(<DocumentList filter="all" items={[document]} tripId={document.trip_id} />);
    expect(screen.getByText("Hotelový voucher")).toBeInTheDocument();
    expect(screen.getByText("PDF · 2 kB")).toBeInTheDocument();
    expect(screen.getByText("Hotel Oslo")).toBeInTheDocument();
    expect(screen.getByText("Vybráno")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Hotelový voucher/ })).toHaveAttribute("href", `/app/trips/${document.trip_id}/documents/${document.id}`);
  });

  it("applies important and category filters", () => {
    const { rerender } = render(<DocumentList filter="important" items={[document]} tripId={document.trip_id} />);
    expect(screen.getByText("Hotelový voucher")).toBeInTheDocument();
    rerender(<DocumentList filter="transport" items={[document]} tripId={document.trip_id} />);
    expect(screen.queryByText("Hotelový voucher")).not.toBeInTheDocument();
    expect(screen.getByText("Žádné dokumenty v tomto filtru")).toBeInTheDocument();
  });
});
