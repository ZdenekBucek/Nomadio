import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DayMapModel } from "./day-map-view-model";
import { DayMap } from "./day-map";

const model: DayMapModel = {
  points: [
    {
      address: "Hlavní 1",
      category: "sight",
      city: "Praha",
      countryCode: "CZ",
      itemId: "first",
      itemTitle: "Pražský hrad",
      itemType: "activity",
      latitude: 50.09,
      longitude: 14.4,
      placeId: "castle",
      placeName: "Pražský hrad",
      sequence: 1,
      timeLabel: "09:00–11:00",
    },
    {
      address: null,
      category: "food",
      city: "Praha",
      countryCode: "CZ",
      itemId: "second",
      itemTitle: "Oběd",
      itemType: "activity",
      latitude: 50.08,
      longitude: 14.42,
      placeId: "restaurant",
      placeName: "Lokál",
      sequence: 2,
      timeLabel: "12:00",
    },
  ],
  unlinkedItemCount: 1,
  withoutCoordinates: [
    { itemId: "missing", itemTitle: "Večeře", placeName: "Bistro" },
  ],
};

afterEach(cleanup);

describe("DayMap", () => {
  it("keeps the ordered day points usable without a public token", () => {
    render(<DayMap accessToken={null} model={model} />);

    expect(screen.getByText("Mapa čeká na připojení Mapboxu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Pražský hrad/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Bistro")).toBeInTheDocument();
    expect(screen.getByText(/1 bod timeline není propojený/)).toBeInTheDocument();
  });

  it("selects a point and links back to its timeline item", () => {
    render(<DayMap accessToken={null} model={model} />);

    fireEvent.click(screen.getByRole("button", { name: /Oběd/ }));

    expect(screen.getByRole("button", { name: /Oběd/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("link", { name: "Zobrazit v timeline" })).toHaveAttribute(
      "href",
      "#timeline-item-second",
    );
  });

  it("shows an empty state when the day has no mapped points", () => {
    render(
      <DayMap
        accessToken="public-token"
        model={{ points: [], unlinkedItemCount: 2, withoutCoordinates: [] }}
      />,
    );

    expect(screen.getByText("Den zatím nemá body na mapě")).toBeInTheDocument();
  });
});
