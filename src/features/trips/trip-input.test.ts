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
        country: " Japonsko ",
        currency: "jpy",
        endDate: "2027-05-30",
        name: " Japonsko 2027 ",
        startDate: "2027-05-15",
      }),
    );

    expect(result).toEqual({
      data: {
        cities: ["Tokio"],
        countries: ["Japonsko"],
        currency: "JPY",
        endDate: "2027-05-30",
        name: "Japonsko 2027",
        startDate: "2027-05-15",
      },
      success: true,
    });
  });

  it("rejects an end date before the start date", () => {
    expect(
      parseNewTrip(
        createForm({
          currency: "CZK",
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
          name: " ",
          startDate: "2027-02-30",
        }),
      ),
    ).toEqual({ error: "invalid", success: false });
  });
});
