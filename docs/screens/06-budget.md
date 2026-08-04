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
