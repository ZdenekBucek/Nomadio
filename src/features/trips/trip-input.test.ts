import { describe, expect, it } from "vitest";

import { parseNewTrip } from "./trip-input";

function createForm(entries: Record<string, string>) {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("parseNewTrip", () => {
  it("normalizes a valid private trip", () => {
    const result = parseNewTrip(
      createForm({
        city: " Tokio ",
        continentOverride: "",
        countryCode: "JP",
        coverVariant: "ocean",
        currency: "jpy",
        description: " Jarní cesta ",
        endDate: "2027-05-30",
        name: " Japonsko 2027 ",
        startDate: "2027-05-15",
        status: "planning",
        travelerName: " Anna ",
      }),
    );

    expect(result).toEqual({
      data: {
        city: "Tokio",
        continent: "asia",
        continentOverridden: false,
        countryCode: "JP",
        countryName: "Japonsko",
        coverVariant: "ocean",
        currency: "JPY",
        description: "Jarní cesta",
        endDate: "2027-05-30",
        name: "Japonsko 2027",
        startDate: "2027-05-15",
        status: "planning",
        timezone: "Europe/Prague",
        travelerNames: ["Anna"],
      },
      success: true,
    });
  });

  it("rejects an end date before the start date", () => {
    expect(
      parseNewTrip(
        createForm({
          currency: "CZK",
          countryCode: "CZ",
          endDate: "2027-05-14",
          name: "Cesta",
          startDate: "2027-05-15",
        }),
      ),
    ).toEqual({ error: "dates", success: false });
  });

  it("rejects invalid names, currencies and calendar dates", () => {
    expect(
      parseNewTrip(
        createForm({
          currency: "EURO",
          countryCode: "XX",
          name: " ",
          startDate: "2027-02-30",
        }),
      ),
    ).toEqual({ error: "invalid", success: false });
  });

  it("normalizes and deduplicates additional travelers", () => {
    const formData = createForm({
      countryCode: "CZ",
      currency: "CZK",
      name: "Výlet",
    });
    formData.append("travelerName", " Petr ");
    formData.append("travelerName", "petr");
    formData.append("travelerName", "");

    const result = parseNewTrip(formData);

    expect(result.success && result.data.travelerNames).toEqual(["Petr"]);
  });
});
