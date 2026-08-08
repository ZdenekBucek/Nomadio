import type {
  AccommodationType,
  BudgetCategory,
  BudgetSubcategory,
  TransportType,
} from "@/lib/supabase/database.types";

export const budgetCategories: BudgetCategory[] = [
  "accommodation", "transport", "food", "activities", "car",
  "shopping", "travel_services", "health", "fees", "other",
];

export const budgetCategoryLabels: Record<BudgetCategory, string> = {
  accommodation: "Ubytování",
  activities: "Aktivity",
  car: "Auto",
  fees: "Poplatky",
  food: "Jídlo",
  health: "Zdraví",
  other: "Ostatní",
  shopping: "Nákupy",
  transport: "Doprava",
  travel_services: "Cestovní služby",
};

export type BudgetSubcategoryDefinition = {
  category: BudgetCategory;
  label: string;
  value: BudgetSubcategory;
};

export const budgetSubcategoryCatalog: readonly BudgetSubcategoryDefinition[] = [
  { category: "accommodation", label: "Hotel", value: "hotel" },
  { category: "accommodation", label: "Apartmán", value: "apartment" },
  { category: "accommodation", label: "Hostel", value: "hostel" },
  { category: "accommodation", label: "Penzion", value: "guesthouse" },
  { category: "accommodation", label: "Kemp", value: "camping" },
  { category: "accommodation", label: "Jiné ubytování", value: "other_accommodation" },
  { category: "transport", label: "Letenky", value: "flights" },
  { category: "transport", label: "Vlak", value: "train" },
  { category: "transport", label: "Autobus", value: "bus" },
  { category: "transport", label: "Trajekt", value: "ferry" },
  { category: "transport", label: "Místní doprava", value: "local_transport" },
  { category: "transport", label: "Taxi / transfer", value: "taxi_transfer" },
  { category: "transport", label: "Jiná doprava", value: "other_transport" },
  { category: "food", label: "Restaurace", value: "restaurants" },
  { category: "food", label: "Potraviny", value: "groceries" },
  { category: "food", label: "Kavárny", value: "cafes" },
  { category: "food", label: "Nápoje", value: "drinks" },
  { category: "food", label: "Ostatní jídlo", value: "other_food" },
  { category: "activities", label: "Vstupné / památky", value: "entrance_fees" },
  { category: "activities", label: "Výlety / tour", value: "tours" },
  { category: "activities", label: "Wellness / spa", value: "wellness_spa" },
  { category: "activities", label: "Zábava", value: "entertainment" },
  { category: "activities", label: "Příroda", value: "nature" },
  { category: "activities", label: "Jiná aktivita", value: "other_activity" },
  { category: "car", label: "Půjčení auta", value: "rental_car" },
  { category: "car", label: "Palivo", value: "fuel" },
  { category: "car", label: "Nabíjení EV", value: "ev_charging" },
  { category: "car", label: "Parkování", value: "parking" },
  { category: "car", label: "Mýto", value: "tolls" },
  { category: "car", label: "Dálniční známky", value: "road_vignettes" },
  { category: "car", label: "Ostatní auto", value: "car_other" },
  { category: "shopping", label: "Suvenýry", value: "souvenirs" },
  { category: "shopping", label: "Kosmetika", value: "cosmetics" },
  { category: "shopping", label: "Oblečení", value: "clothing" },
  { category: "shopping", label: "Elektronika", value: "electronics" },
  { category: "shopping", label: "Dárky", value: "gifts" },
  { category: "shopping", label: "Ostatní nákupy", value: "other_shopping" },
  { category: "travel_services", label: "Pojištění", value: "insurance" },
  { category: "travel_services", label: "Víza / vstupní poplatky", value: "visa_entry_fees" },
  { category: "travel_services", label: "SIM / eSIM / internet", value: "esim_internet" },
  { category: "travel_services", label: "Zavazadla", value: "luggage" },
  { category: "travel_services", label: "Ostatní cestovní služby", value: "travel_service_other" },
  { category: "health", label: "Lékárna", value: "pharmacy" },
  { category: "health", label: "Lékařská péče", value: "medical" },
  { category: "health", label: "Hygiena", value: "hygiene" },
  { category: "health", label: "Ostatní zdraví", value: "health_other" },
  { category: "fees", label: "Bankovní poplatky", value: "bank_fees" },
  { category: "fees", label: "Směnárenské poplatky", value: "exchange_fees" },
  { category: "fees", label: "Spropitné", value: "tips" },
  { category: "fees", label: "Městská taxa", value: "city_tax" },
  { category: "fees", label: "Rezervační poplatky", value: "booking_fees" },
  { category: "fees", label: "Ostatní poplatky", value: "fee_other" },
  { category: "other", label: "Nouzové výdaje", value: "emergency" },
  { category: "other", label: "Neočekávané výdaje", value: "unexpected" },
  { category: "other", label: "Ostatní", value: "miscellaneous" },
];

const subcategoryByValue = new Map(budgetSubcategoryCatalog.map((item) => [item.value, item]));

export function budgetSubcategoriesFor(category: BudgetCategory) {
  return budgetSubcategoryCatalog.filter((item) => item.category === category);
}

export function isBudgetSubcategory(value: string): value is BudgetSubcategory {
  return subcategoryByValue.has(value as BudgetSubcategory);
}

export function isSubcategoryForCategory(category: BudgetCategory, subcategory: BudgetSubcategory) {
  return subcategoryByValue.get(subcategory)?.category === category;
}

export function budgetCategoryPathLabel(category: BudgetCategory, subcategory: BudgetSubcategory | null) {
  const definition = subcategory ? subcategoryByValue.get(subcategory) : null;
  return definition?.category === category
    ? `${budgetCategoryLabels[category]} · ${definition.label}`
    : budgetCategoryLabels[category];
}

export function budgetSubcategoryLabel(subcategory: BudgetSubcategory | null) {
  return subcategory ? subcategoryByValue.get(subcategory)?.label ?? subcategory : "Bez podkategorie";
}

export function accommodationBudgetClassification(type: AccommodationType): { category: BudgetCategory; subcategory: BudgetSubcategory } {
  if (type === "hotel" || type === "apartment" || type === "hostel" || type === "guesthouse" || type === "camping") {
    return { category: "accommodation", subcategory: type };
  }
  return { category: "accommodation", subcategory: "other_accommodation" };
}

export function transportBudgetClassification(type: TransportType): { category: BudgetCategory; subcategory: BudgetSubcategory } {
  const transport: Partial<Record<TransportType, BudgetSubcategory>> = {
    bus: "bus", ferry: "ferry", flight: "flights", taxi_transfer: "taxi_transfer", train: "train",
  };
  const subcategory = transport[type];
  if (subcategory) return { category: "transport", subcategory };
  if (type === "rental_car") return { category: "car", subcategory: "rental_car" };
  if (type === "private_car") return { category: "car", subcategory: "car_other" };
  return { category: "transport", subcategory: "other_transport" };
}
