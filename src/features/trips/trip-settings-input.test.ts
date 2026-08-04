import { describe, expect, it } from "vitest";

import { parseDestination, parseTripSettings } from "./trip-settings-input";

function settingsForm() {
  const formData = new FormData();
  formData.set("name", "Norsko 2027");
  formData.set("description", "Severská cesta");
  formData.set("startDate", "2027-06-01");
  formData.set("endDate", "2027-06-14");
  formData.set("currency", "nok");
  formData.set("timezone", "Europe/Oslo");
  formData.set("status", "ready");
  formData.set("coverVariant", "ocean");
  return formData;
}

describe("parseTripSettings", () => {
  it("normalizes valid editable settings", () => {
    expect(parseTripSettings(settingsForm())).toEqual({
      data: {
        coverVariant: "ocean",
        currency: "NOK",
        description: "Severská cesta",
        endDate: "2027-06-14",
        name: "Norsko 2027",
        startDate: "2027-06-01",
        status: "ready",
        timezone: "Europe/Oslo",
      },
      success: true,
    });
  });

  it("rejects dates in reverse order", () => {
    const formData = settingsForm();
    formData.set("endDate", "2027-05-31");
    expect(parseTripSettings(formData)).toEqual({ error: "dates", success: false });
  });

  it("rejects archived status from basic settings", () => {
    const formData = settingsForm();
    formData.set("status", "archived");
    expect(parseTripSettings(formData)).toEqual({ error: "invalid", success: false });
  });
});

describe("parseDestination", () => {
  it("derives the continent from a known country", () => {
    const formData = new FormData();
    formData.set("countryCode", "se");
    formData.set("city", "Abisko");

    expect(parseDestination(formData)).toMatchObject({
      data: {
        city: "Abisko",
        continent: "europe",
        continentOverridden: false,
        countryCode: "SE",
      },
      success: true,
    });
  });

  it("preserves an explicit continent override", () => {
    const formData = new FormData();
    formData.set("countryCode", "TR");
    formData.set("continentOverride", "europe");

    expect(parseDestination(formData)).toMatchObject({
      data: { continent: "europe", continentOverridden: true },
      success: true,
    });
  });

  it("rejects an unknown country", () => {
    const formData = new FormData();
    formData.set("countryCode", "XX");
    expect(parseDestination(formData)).toEqual({ error: "invalid", success: false });
  });
});
