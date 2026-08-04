import type {
  ContinentCode,
  TripCoverVariant,
  TripStatus,
} from "@/lib/supabase/database.types";

import { getCountryOption } from "./countries";

export type NewTripInput = {
  city: string | null;
  continent: ContinentCode;
  continentOverridden: boolean;
  countryCode: string;
  countryName: string;
  coverVariant: TripCoverVariant;
  currency: string;
  description: string | null;
  endDate: string | null;
  name: string;
  startDate: string | null;
  status: Extract<TripStatus, "idea" | "planning">;
  timezone: string;
};

export type TripInputResult =
  | { data: NewTripInput; success: true }
  | { error: "dates" | "invalid"; success: false };

function optionalText(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text || null;
}

function isIsoDate(value: string | null) {
  if (!value) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function parseNewTrip(formData: FormData): TripInputResult {
  const name = formData.get("name")?.toString().trim() ?? "";
  const description = optionalText(formData.get("description"));
  const countryCode = formData.get("countryCode")?.toString().trim().toUpperCase() ?? "";
  const country = getCountryOption(countryCode);
  const city = optionalText(formData.get("city"));
  const currency = formData.get("currency")?.toString().trim().toUpperCase() ?? "";
  const startDate = optionalText(formData.get("startDate"));
  const endDate = optionalText(formData.get("endDate"));
  const continentOverride = optionalText(formData.get("continentOverride"));
  const status = formData.get("status")?.toString() ?? "planning";
  const coverVariant = formData.get("coverVariant")?.toString() ?? "violet";
  const timezone = formData.get("timezone")?.toString().trim() ?? "Europe/Prague";

  if (
    name.length < 1 ||
    name.length > 120 ||
    (description?.length ?? 0) > 600 ||
    !country ||
    timezone.length < 1 ||
    timezone.length > 80 ||
    !/^[A-Z]{3}$/.test(currency) ||
    !isIsoDate(startDate) ||
    !isIsoDate(endDate) ||
    !["idea", "planning"].includes(status) ||
    !["violet", "ocean", "sunset", "forest"].includes(coverVariant) ||
    (continentOverride &&
      ![
        "africa",
        "antarctica",
        "asia",
        "europe",
        "north_america",
        "south_america",
        "oceania",
      ].includes(continentOverride))
  ) {
    return { error: "invalid", success: false };
  }

  if (startDate && endDate && endDate < startDate) {
    return { error: "dates", success: false };
  }

  return {
    data: {
      city,
      continent: (continentOverride || country.continent) as ContinentCode,
      continentOverridden: Boolean(continentOverride),
      countryCode: country.code,
      countryName: country.name,
      coverVariant: coverVariant as TripCoverVariant,
      currency,
      description,
      endDate,
      name,
      startDate,
      status: status as Extract<TripStatus, "idea" | "planning">,
      timezone,
    },
    success: true,
  };
}
