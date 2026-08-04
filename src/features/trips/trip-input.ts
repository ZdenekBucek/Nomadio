export type NewTripInput = {
  cities: string[];
  countries: string[];
  currency: string;
  endDate: string | null;
  name: string;
  startDate: string | null;
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
  const country = optionalText(formData.get("country"));
  const city = optionalText(formData.get("city"));
  const currency = formData.get("currency")?.toString().trim().toUpperCase() ?? "";
  const startDate = optionalText(formData.get("startDate"));
  const endDate = optionalText(formData.get("endDate"));

  if (
    name.length < 1 ||
    name.length > 120 ||
    !/^[A-Z]{3}$/.test(currency) ||
    !isIsoDate(startDate) ||
    !isIsoDate(endDate)
  ) {
    return { error: "invalid", success: false };
  }

  if (startDate && endDate && endDate < startDate) {
    return { error: "dates", success: false };
  }

  return {
    data: {
      cities: city ? [city] : [],
      countries: country ? [country] : [],
      currency,
      endDate,
      name,
      startDate,
    },
    success: true,
  };
}
