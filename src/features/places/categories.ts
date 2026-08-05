import type { PlaceCategory } from "@/lib/supabase/database.types";

export const placeCategories = [
  "accommodation",
  "sight",
  "activity",
  "food",
  "transport",
  "shopping",
  "nature",
  "charging",
  "custom",
] as const satisfies readonly PlaceCategory[];

export const placeCategoryLabels = {
  accommodation: "Ubytování",
  activity: "Aktivita",
  charging: "Nabíjecí místo",
  custom: "Vlastní místo",
  food: "Restaurace a jídlo",
  nature: "Příroda",
  shopping: "Nákupy",
  sight: "Památka",
  transport: "Doprava",
} as const satisfies Record<PlaceCategory, string>;

export const placeCategoryLayerLabels = {
  accommodation: "Ubytování",
  activity: "Aktivity",
  charging: "Nabíjení",
  custom: "Vlastní místa",
  food: "Jídlo",
  nature: "Příroda",
  shopping: "Nákupy",
  sight: "Památky",
  transport: "Doprava",
} as const satisfies Record<PlaceCategory, string>;

const categorySet = new Set<string>(placeCategories);

export function isPlaceCategory(value: string): value is PlaceCategory {
  return categorySet.has(value);
}

function matches(categories: string[], prefixes: string[]) {
  return categories.some((category) =>
    prefixes.some((prefix) => category === prefix || category.startsWith(`${prefix}.`)),
  );
}

export function categoryForGeoapify(providerCategories: string[]): PlaceCategory {
  const categories = providerCategories.map((category) => category.trim().toLowerCase()).filter(Boolean);
  if (matches(categories, ["service.vehicle.charging_station"])) return "charging";
  if (matches(categories, ["accommodation"])) return "accommodation";
  if (matches(categories, ["catering.restaurant", "catering.cafe", "catering.fast_food"])) return "food";
  if (matches(categories, ["tourism.attraction", "entertainment.museum", "entertainment.culture", "heritage", "building.historic"])) return "sight";
  if (matches(categories, ["leisure.park", "natural", "beach", "national_park"])) return "nature";
  if (matches(categories, ["commercial"])) return "shopping";
  if (matches(categories, ["public_transport", "airport", "parking", "railway", "transportation"])) return "transport";
  return "custom";
}
