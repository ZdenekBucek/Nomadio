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

## Aktuálně implementovaný první řez

Route `/app/trips/{tripId}/budget` skládá tři zdroje do společného
provider-neutrálního finančního řádku:

- `accommodations` jako read-only kategorii Ubytování,
- `transport_bookings` jako read-only kategorii Doprava,
- ruční `budget_items`, které může owner/editor vytvářet, upravovat a mazat.

Ubytování ani Doprava se do `budget_items` nekopírují. Databázová insert politika
v této fázi dovoluje pouze `source_type = manual` a prázdné `source_id`;
automatické řádky se editují ve svém zdrojovém modulu. Zbývající částka se
neukládá. Základem je skutečná částka, a pokud ještě není známá, odhad; od ní se
odečte evidované zaplaceno. U známého stavu `paid`, `unpaid` nebo `pay_on_site`
lze bezpečně doplnit chybějící zaplacenou hodnotu, zatímco `unknown` bez částky
zůstává neurčitý.

Souhrny se počítají samostatně pro každou měnu. Hlavní měna je
`trips.currency`, ale cizí měna zůstává původní a bez uloženého FX kurzu se
nepřepočítává ani nesčítá s ostatními. Čekající platby jsou řazené podle
splatnosti, položky bez data jsou na konci.

Viewer a člen archivované cesty mají jen čtení. Další fáze doplní rozdělení
nákladů mezi cestovatele, společný účet, kdo komu dluží, FX přepočet a více
samostatných plateb. Tyto funkce nejsou součástí aktuálního řezu.

### Hierarchie kategorií

Každá položka má povinnou stabilní hlavní kategorii a volitelnou podkategorii.
Hlavní kategorie jsou: Ubytování, Doprava, Jídlo, Aktivity, Auto, Nákupy,
Cestovní služby, Zdraví, Poplatky a Ostatní. Podkategorie používají stabilní
anglické hodnoty a české labely z centrálního aplikačního katalogu.

Formulář po změně hlavní kategorie zahodí podkategorii, která do nové kategorie
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
