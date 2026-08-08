# Rozpočet

První vertikální řez je dostupný na `/app/trips/{tripId}/budget`. Centrální
read model normalizuje ruční položky, Ubytování a Dopravu do jednoho typu
`BudgetRow` se společnými částkami, měnou, platebním stavem a splatností.

## Zdroje a výpočty

- Ruční položky se ukládají do trip-scoped `budget_items`.
- Ubytování a Doprava se čtou přímo ze zdrojových tabulek a nikdy se do
  `budget_items` nekopírují.
- `actual_amount` má přednost před `estimated_amount`. `remaining_amount` se
  odvozuje jako tento základ minus známé `paid_amount` a neukládá se.
- Původní měna zůstává zachovaná. Více měn se sumarizuje odděleně; bez FX kurzu
  nevzniká falešný součet.
- Automatické řádky jsou v Budgetu read-only a editace vede na zdrojovou
  rezervaci.

RLS dovoluje owner/editor CRUD pouze pro manuální řádky, viewerovi čtení a
archivované cestě pouze čtení. Cizí uživatel nevidí nic.

## Kategorie a podkategorie

Reporting používá deset stabilních hlavních kategorií: Ubytování, Doprava,
Jídlo, Aktivity, Auto, Nákupy, Cestovní služby, Zdraví, Poplatky a Ostatní.
Volitelná podkategorie pochází z jediného typovaného katalogu v
`budget-categories.ts`. Formulář nabízí pouze podkategorie vybrané hlavní
kategorie a server stejnou dvojici znovu validuje.

Databáze ověřuje dvojici kompozitním cizím klíčem vůči
`budget_subcategory_catalog`. Díky tomu nelze podvrhnout například `food + fuel`
a katalog lze později rozšířit o další předdefinovaný řádek bez změny schématu.
Vlastní uživatelské podkategorie zatím nejsou podporované.

Accommodation se mapuje podle `accommodation_type`. Běžná doprava se mapuje do
Dopravy, `rental_car` do `Auto · Půjčení auta` a `private_car` do
`Auto · Ostatní auto`. Zdrojové rezervace se tím nemění.

Další fáze doplní rozdělení mezi cestovatele, společný účet, kdo komu dluží,
uložený FX přepočet a více samostatných plateb. Žádná z těchto funkcí se zatím
neimplementuje.
