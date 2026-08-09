import type {
  ContinentCode,
  TripCoverVariant,
  TripStatus,
} from "@/lib/supabase/database.types";

import { getCountryOption } from "./countries";
import { isValidTimeZone } from "@/features/timezones/timezone-catalog";

export type TripSettingsInput = {
  coverVariant: TripCoverVariant;
  currency: string;
  description: string | null;
  endDate: string | null;
  name: string;
  startDate: string | null;
  status: Extract<TripStatus, "idea" | "planning" | "ready">;
  timezone: string;
};

export type DestinationInput = {
  city: string | null;
  continent: ContinentCode;
  continentOverridden: boolean;
  countryCode: string;
  countryName: string;
};

type InputResult<T> =
  | { data: T; success: true }
  | { error: "dates" | "invalid"; success: false };

function optionalText(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text || null;
}

function isIsoDate(value: string | null) {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function isContinent(value: string): value is ContinentCode {
  return [
    "africa",
    "antarctica",
    "asia",
    "europe",
    "north_america",
    "south_america",
    "oceania",
  ].includes(value);
}

export function parseTripSettings(formData: FormData): InputResult<TripSettingsInput> {
  const name = formData.get("name")?.toString().trim() ?? "";
  const description = optionalText(formData.get("description"));
  const startDate = optionalText(formData.get("startDate"));
  const endDate = optionalText(formData.get("endDate"));
  const currency = formData.get("currency")?.toString().trim().toUpperCase() ?? "";
  const timezone = formData.get("timezone")?.toString().trim() ?? "";
  const status = formData.get("status")?.toString() ?? "";
  const coverVariant = formData.get("coverVariant")?.toString() ?? "";

  if (
    name.length < 1 ||
    name.length > 120 ||
    (description?.length ?? 0) > 600 ||
    !isIsoDate(startDate) ||
    !isIsoDate(endDate) ||
    !/^[A-Z]{3}$/.test(currency) ||
    timezone.length < 1 ||
    timezone.length > 80 ||
    !isValidTimeZone(timezone) ||
    !["idea", "planning", "ready"].includes(status) ||
    !["violet", "ocean", "sunset", "forest"].includes(coverVariant)
  ) {
    return { error: "invalid", success: false };
  }

  if (startDate && endDate && endDate < startDate) {
    return { error: "dates", success: false };
  }

  return {
    data: {
      coverVariant: coverVariant as TripCoverVariant,
      currency,
      description,
      endDate,
      name,
      startDate,
      status: status as TripSettingsInput["status"],
      timezone,
    },
    success: true,
  };
}

export function parseDestination(formData: FormData): InputResult<DestinationInput> {
  const countryCode = formData.get("countryCode")?.toString().trim().toUpperCase() ?? "";
  const country = getCountryOption(countryCode);
  const city = optionalText(formData.get("city"));
  const continentOverride = optionalText(formData.get("continentOverride"));

  if (
    !country ||
    (city?.length ?? 0) > 120 ||
    (continentOverride !== null && !isContinent(continentOverride))
  ) {
    return { error: "invalid", success: false };
  }

  return {
    data: {
      city,
      continent: continentOverride ?? country.continent,
      continentOverridden: continentOverride !== null,
      countryCode: country.code,
      countryName: country.name,
    },
    success: true,
  };
}
