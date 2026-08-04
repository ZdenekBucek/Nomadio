import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./place-actions", () => ({ createMapboxTripPlace: vi.fn() }));
import { PlaceSearch } from "./place-search";

afterEach(cleanup);

describe("PlaceSearch", () => {
  it("shows a useful fallback without configuration", () => {
    render(<PlaceSearch configured={false} tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" />);
    expect(screen.getByText("Vyhledávání míst zatím není připojené")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("offers an accessible search field when configured", () => {
    render(<PlaceSearch configured tripId="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" />);
    expect(screen.getByRole("textbox", { name: "Vyhledat adresu nebo místo" })).toBeInTheDocument();
    expect(screen.getByText(/permanentního geocodingu/)).toBeInTheDocument();
  });
});
