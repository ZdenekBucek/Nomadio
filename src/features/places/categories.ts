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
