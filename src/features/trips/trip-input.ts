import type {
  ContinentCode,
  TripCoverVariant,
  TripStatus,
} from "@/lib/supabase/database.types";

import { getCountryOption } from "./countries";
import { isValidTimeZone } from "@/features/timezones/timezone-catalog";
import { isValidDateOnly } from "@/lib/date-time";

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
  travelerNames: string[];
};

export type TripInputResult =
  | { data: NewTripInput; success: true }
  | { error: "dates" | "invalid"; success: false };

function optionalText(value: FormDataEntryValue | null) {
  const text = value?.toString().trim();
  return text || null;
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
  const rawTravelerNames = formData
    .getAll("travelerName")
    .map((value) => value.toString().trim())
    .filter(Boolean);
  const seenTravelerNames = new Set<string>();
  const travelerNames = rawTravelerNames.filter((travelerName) => {
    const normalizedName = travelerName.toLocaleLowerCase("cs-CZ");
    if (seenTravelerNames.has(normalizedName)) return false;
    seenTravelerNames.add(normalizedName);
    return true;
  });

  if (
    name.length < 1 ||
    name.length > 120 ||
    (description?.length ?? 0) > 600 ||
    !country ||
    timezone.length < 1 ||
    timezone.length > 80 ||
    !isValidTimeZone(timezone) ||
    travelerNames.length > 10 ||
    travelerNames.some((travelerName) => travelerName.length > 120) ||
    !/^[A-Z]{3}$/.test(currency) ||
    (startDate !== null && !isValidDateOnly(startDate)) ||
    (endDate !== null && !isValidDateOnly(endDate)) ||
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
      travelerNames,
    },
    success: true,
  };
}
