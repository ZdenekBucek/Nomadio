import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./document-actions", () => ({ deleteDocument: vi.fn(), updateDocumentMetadata: vi.fn(), uploadDocument: vi.fn() }));
import { DocumentForm } from "./document-form";

afterEach(cleanup);

describe("DocumentForm", () => {
  it("shows safe upload fields and entity choices for editors", () => {
    render(<DocumentForm canEdit tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" linkOptions={[{ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", label: "Hotel Oslo", type: "accommodation" }]} />);
    expect(screen.getByLabelText(/Soubor/)).toHaveAttribute("accept", "application/pdf,image/jpeg,image/png");
    expect(screen.getByLabelText("Patří k")).toHaveTextContent("Hotel Oslo");
    expect(screen.getByLabelText("Důležitý dokument")).toBeInTheDocument();
    expect(screen.getByLabelText("Označit pro offline balík")).toBeInTheDocument();
  });

  it("disables upload for a viewer", () => {
    render(<DocumentForm canEdit={false} tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" linkOptions={[]} />);
    expect(screen.getByLabelText(/Soubor/)).toBeDisabled();
    expect(screen.queryByRole("button", { name: /Nahrát dokument/ })).not.toBeInTheDocument();
  });
});
