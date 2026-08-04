# Nomadio — specifikace obrazovek

Tato složka je verzovaný zdroj pravdy pro obsah, chování a informační
hierarchii produktových obrazovek Nomadia. Vznikla konsolidací produktového
vlákna **Plánování cestovní aplikace**
(`6a68e4e5-e820-83eb-8458-1120ce05ba26`), ve kterém byly obrazovky postupně
procházeny a zpřesňovány.

## Jak dokumentaci používat

Před implementací obrazovky je nutné přečíst:

1. tento rozcestník,
2. [`../product-spec.md`](../product-spec.md),
3. [`../design-system.md`](../design-system.md),
4. specifikaci dané obrazovky,
5. související specifikace, na které dokument odkazuje.

Při rozporu platí toto pořadí:

1. nejnovější výslovné rozhodnutí uživatele,
2. specifikace v `docs/screens/`,
3. obecná produktová specifikace,
4. implementační plán,
5. současný stav rozhraní.

Současná implementace není automaticky produktovým rozhodnutím. Může jít jen
o technický základ nebo první vertikální řez.

## Potvrzené globální principy

- Každá cesta je samostatný bezpečnostní a datový kontext — jeden uzavřený
  „balík“ podobný projektu nebo epicu.
- Desktop je primární pro plánování, mobil pro rychlé používání na cestě.
- Planning mode a Travel mode používají stejná data, ale jinou prioritu obsahu.
- Nová cesta je vždy soukromá.
- Vlastní i sdílené cesty jsou v jednom seznamu **Moje cesty**.
- Uživatelé s přístupem a cestovatelé jsou dvě rozdílné doménové skupiny.
- Místa se ukládají do interního modelu a mapový provider není doménovým
  modelem aplikace.
- Důležité části jedné cesty musí jít vědomě stáhnout jako offline balík.
- Rozhraní je prémiové, tmavé a klidné; fotografie a obsah mají přednost před
  dekorativními efekty.

## Mapa specifikací

| Oblast | Dokument |
| --- | --- |
| Navigace, režimy a responzivita | [`00-navigation-and-modes.md`](./00-navigation-and-modes.md) |
| Moje cesty a vytvoření cesty | [`01-my-trips.md`](./01-my-trips.md) |
| Přehled konkrétní cesty | [`02-trip-overview.md`](./02-trip-overview.md) |
| Itinerář, plány bez data a detail dne | [`03-itinerary-and-day.md`](./03-itinerary-and-day.md) |
| Mapa, místa a vyhledávání | [`04-map-and-places.md`](./04-map-and-places.md) |
| Ubytování a doprava | [`05-accommodation-and-transport.md`](./05-accommodation-and-transport.md) |
| Rozpočet a společný účet | [`06-budget.md`](./06-budget.md) |
| Dokumenty, checklist a poznámky | [`07-documents-checklist-notes.md`](./07-documents-checklist-notes.md) |
| Nastavení, sdílení, cestovatelé a profil | [`08-settings-sharing-profile.md`](./08-settings-sharing-profile.md) |
| Offline balík a Travel mode | [`09-offline-and-travel-mode.md`](./09-offline-and-travel-mode.md) |
| Rozdíl proti současné implementaci | [`10-implementation-gap.md`](./10-implementation-gap.md) |

## Stav požadavků

Každá specifikace rozlišuje:

- **Potvrzeno** — součást zamýšleného produktu.
- **MVP** — očekávaný rozsah první použitelné verze dané oblasti.
- **Později** — požadavek, se kterým má návrh počítat, ale nemá předčasně
  komplikovat aktuální řez.

Pokud nová implementace potřebuje změnit potvrzené chování, musí se nejdřív
aktualizovat tato dokumentace a uvést důvod rozhodnutí.
