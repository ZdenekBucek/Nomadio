import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { TripMapModel } from "./map-view-model";
import { TripMap } from "./trip-map";

const model: TripMapModel = {
  mapped: [
    {
      address: "Most 1",
      category: "nature",
      city: "Bodø",
      countryCode: "NO",
      id: "saltstraumen",
      latitude: 67.23,
      longitude: 14.61,
      name: "Saltstraumen",
    },
    {
      address: null,
      category: "accommodation",
      city: "Bodø",
      countryCode: "NO",
      id: "hotel",
      latitude: 67.28,
      longitude: 14.4,
      name: "Hotel Bodø",
    },
  ],
  withoutCoordinates: [{ id: "missing", name: "Místo bez GPS" }],
};

afterEach(cleanup);

describe("TripMap", () => {
  it("keeps locations and filters usable without a public token", () => {
    render(<TripMap accessToken={null} model={model} />);

    expect(screen.getByText("Mapa čeká na připojení Mapboxu")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Saltstraumen/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Příroda, 1 míst/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Místo bez GPS")).toBeInTheDocument();
  });

  it("selects a place from the accessible list", () => {
    render(<TripMap accessToken={null} model={model} />);

    fireEvent.click(screen.getByRole("button", { name: /Hotel Bodø/ }));

    expect(screen.getByRole("button", { name: /Hotel Bodø/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("offers charging places as a dedicated map layer", () => {
    const charging = {
      ...model.mapped[0]!,
      category: "charging" as const,
      id: "charger",
      name: "Ionity",
    };
    render(
      <TripMap
        accessToken={null}
        model={{ mapped: [charging], withoutCoordinates: [] }}
      />,
    );

    expect(screen.getByRole("button", { name: /Nabíjení, 1 míst/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("Nabíjecí místo")).toBeInTheDocument();
  });

  it("filters the visible list by category and restores all layers", () => {
    render(<TripMap accessToken={null} model={model} />);

    fireEvent.click(screen.getByRole("button", { name: /Příroda, 1 míst/ }));

    expect(screen.queryByRole("button", { name: /Saltstraumen/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Hotel Bodø/ })).toBeInTheDocument();
    expect(screen.getByText("1 z 2 na mapě")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Vše/ }));
    expect(screen.getByRole("button", { name: /Saltstraumen/ })).toBeInTheDocument();
    expect(screen.getByText("2 z 2 na mapě")).toBeInTheDocument();
  });

  it("shows a layer-empty state when the last active category is disabled", () => {
    render(
      <TripMap
        accessToken="public-token"
        model={{ mapped: [model.mapped[0]!], withoutCoordinates: [] }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Příroda, 1 míst/ }));

    expect(screen.getByText("Žádná aktivní vrstva")).toBeInTheDocument();
    expect(screen.getByText("Zapněte vrstvu s uloženými místy.")).toBeInTheDocument();
  });

  it("shows the empty state without coordinates", () => {
    render(
      <TripMap
        accessToken={null}
        model={{ mapped: [], withoutCoordinates: [] }}
      />,
    );

    expect(screen.getByText("Zatím není co zobrazit")).toBeInTheDocument();
  });
});
