# Rozpočet a společný účet

## Účel

Rozpočet musí odpovědět:

- kolik cesta plánovaně a skutečně stojí,
- kolik stojí na osobu,
- kolik už bylo zaplaceno,
- co a kdy zbývá zaplatit,
- kdo platil,
- kolik má kdo přispět nebo komu dluží,
- kolik má být na společném účtu.

## Hlavní přehled

- plánovaná celková cena,
- skutečná cena,
- zaplaceno,
- zbývá,
- cena na osobu,
- rozdělení podle kategorií,
- nadcházející platby,
- stav společného účtu,
- aktuální vyrovnání mezi cestovateli.

## Položka rozpočtu

- název a kategorie,
- vazba na ubytování, dopravu, aktivitu nebo jinou entitu,
- plánovaná a skutečná částka,
- původní měna,
- uložený kurz a informativní přepočet,
- platební stav a splatnost,
- kdo platil,
- způsob rozdělení mezi cestovatele.

Stejný hotel nebo doprava se nesmí ručně duplikovat v rozpočtu. Rozpočet čte
finanční údaje ze zdrojové entity nebo na ni explicitně odkazuje.

## Peníze a měny

- Částky se ukládají bez ztráty přesnosti, ideálně v nejmenších jednotkách.
- Původní měna rezervace se zachovává.
- Přepočet do hlavní měny je informativní a používá uložený kurz.
- Systém nesmí zpětně měnit historické výsledky bez zřetelné aktualizace kurzu.

## Rozdělení

Podporované cíle:

- rovnoměrně,
- procentem,
- pevnou částkou,
- pouze mezi vybranými cestovateli.

Cestovatel nemusí být uživatelem aplikace. Výpočet musí vždy ověřit, že součet
podílů odpovídá celé položce.

## Společný účet

Zobrazuje:

- aktuální zůstatek,
- budoucí plánované platby,
- cílovou rezervu,
- chybějící částku,
- doporučený příspěvek každého cestovatele.

## Rychlý výdaj na mobilu

Travel mode nabízí krátký formulář pro název, částku, měnu, kategorii, plátce a
základní rozdělení. Detail lze doplnit později.

## Kontroly

- položka bez ceny,
- nesoulad ceny a plateb,
- prošlá splatnost,
- cizí měna bez kurzu,
- záporný společný účet,
- nevyvážené rozdělení,
- duplicitní položka.

## MVP

- kategorie,
- plán a skutečnost,
- celkem a na osobu,
- zaplaceno a zbývá,
- plátce a rozdělení,
- společný účet a příspěvky,
- více měn s uloženým kurzem,
- vazby na ubytování a dopravu,
- rychlý mobilní výdaj,
- export alespoň do CSV.

Více peněženek, OCR účtenek, bankovní integrace a automatický import dokladů
patří později.

## Aktuálně implementovaný Budget UI řez

Route `/app/trips/{tripId}/budget` používá jednotný serverový read model
`getTripBudgetDashboard(tripId)` a rozděluje finance do tří významově odlišných
částí:

- **Plán** — očekávané náklady z `budget_plan_items`,
- **Realita** — skutečně vzniklé náklady z manuálních `expenses` a read-only
  projekcí Ubytování a Dopravy,
- **Platby** — uhrazené částky, odvozený zůstatek a splatnosti ze zdrojových
  rezervací.

První UI fáze plně implementuje Plán. Owner/editor může přes responsivní dialog
vytvářet, upravovat a mazat plánované položky; viewer a archivovaný trip mají
pouze čtení. Název je volitelný a bez zadání se odvodí z kategorie. Kategorie,
podkategorie, částka a měna se validují na serveru a databázové RLS zůstává
autorizačním zdrojem pravdy.

Druhá UI fáze implementuje Realitu. Manuální výdaj lze rychle zadat částkou a
kategorií; trip, autor, serverový čas a hlavní měna tripu se doplní automaticky.
Volitelně lze přidat název, podkategorii, poznámku nebo změnit datum vzniku
nákladu. Manuální expenses jsou seskupené do časové osy a owner/editor je může
upravovat nebo mazat. Náklady Ubytování a Dopravy se zobrazují jako read-only
projekce s odkazem na zdrojovou entitu, takže se jejich data nekopírují.
Kategoriální porovnání používá jednotný dashboard read model a označuje
překročený plán i náklady bez odpovídajícího plánu.

Třetí UI fáze implementuje Platby jako read-only cashflow pohled nad existujícími
finančními poli Ubytování a Dopravy. Zobrazuje známé zaplacené a odvozené
zbývající částky, platby po splatnosti od nejstarší a nadcházející platby od
nejbližší. Závazky bez data splatnosti zůstávají viditelné na konci seznamu.
Každá položka vede do zdrojového modulu; nevzniká tabulka plateb ani kopie
rezervace. Neznámý `paid_amount` se nevydává za nulu a zůstatek se nikdy
neukládá.

Kompaktní souhrn porovnává Plán a Realitu, ukazuje procento využití i překročení
nad 100 %. Každá měna má samostatný blok; bez FX kurzu se nikdy nevytváří
falešný společný total. Stejné pravidlo používá také platební souhrn.

### Hierarchie kategorií

Každá položka má povinnou stabilní hlavní kategorii a volitelnou podkategorii.
Hlavní kategorie jsou: Ubytování, Doprava, Jídlo, Aktivity, Auto, Nákupy,
Cestovní služby, Zdraví, Poplatky a Ostatní. Podkategorie používají stabilní
anglické hodnoty a české labely z centrálního aplikačního katalogu.

Formulář Plánu po změně hlavní kategorie zahodí podkategorii, která do nové kategorie
nepatří. Server validuje stejný katalog a databáze dvojici nezávisle ověřuje
kompozitním cizím klíčem. Podkategoriální breakdown se zobrazuje uvnitř hlavní
kategorie; hlavní reporting se nikdy netříští podle podkategorií.

Ubytování odvozuje podkategorii z `accommodation_type`. Let, vlak, autobus,
trajekt a taxi zůstávají v Dopravě; půjčené a vlastní auto se reportují pod
Autem. Změna se děje pouze v Budget read modelu a neupravuje zdrojovou rezervaci.

Původní ruční hodnoty `local_transport`, `rental_car` a `insurance` se bezpečně
mapují na `transport + local_transport`, `car + rental_car` a
`travel_services + insurance`. Vlastní uživatelské podkategorie nejsou v této
fázi implementované.
