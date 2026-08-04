# Rozdíl mezi specifikací a současnou implementací

Aktualizováno po prvním řezu „Moje cesty“. Tento dokument brání tomu, aby se
technický základ omylem považoval za schválenou finální obrazovku.

## Již implementováno

- Google přihlášení a chráněný aplikační prostor.
- Profil a základní globální shell.
- Responzivní desktopová a mobilní navigace.
- Tabulky `trips` a `trip_members`.
- Role owner/editor/viewer a základní RLS.
- Automatické vlastnické členství.
- Jednotný seznam dostupných cest.
- Základní vytvoření soukromé cesty.
- Název, první země/město, termín a měna.

## Moje cesty — chybějící potvrzený obsah

- filtry Nadcházející/Probíhající/Dokončené/Všechny/Archiv,
- skutečný stav cesty a odpočet,
- více destinací a normalizovaná struktura zemí/měst,
- automatický návrh a ruční změna světadílu,
- cestovatelé oddělení od členů,
- cover upload nebo licenčně bezpečný návrh,
- avatary cestovatelů a informace o sdílení,
- progres příprav a důležitá upozornění,
- průvodce vytvořením namísto jednoho kompaktního formuláře,
- archivace, odstranění, duplikace a menu karty,
- plnohodnotný klikací detail cesty.

## Datový model — známé mezery

Současné `countries` a `cities` jako textová pole/arrays jsou vhodné pouze pro
první řez. Cílová specifikace potřebuje normalizované destinace s pořadím,
country code, světadílem a hlavní destinací. Chybí také:

- stav, popis, timezone a archivace tripu,
- tabulka cestovatelů,
- pozvánky a jejich stav,
- cover metadata,
- následné entity itineráře, míst a modulů.

Změna modelu musí proběhnout verzovanou migrací s RLS a testy; stávající data
se nesmí ztratit.

## Doporučené nejbližší pořadí

1. Dokončit datový model základních údajů a destinací.
2. Přidat cestovatele oddělené od členů.
3. Převést vytvoření cesty na krátký průvodce.
4. Dokončit karty, filtry a stavové informace v Moje cesty.
5. Vytvořit routu a hlavičku detailu cesty.
6. Teprve potom stavět dashboard přehledu a další moduly.

## Pravidlo aktualizace

Po každém dokončeném řezu se položky přesunou z mezery do části „Již
implementováno“. Pokud implementace vědomě mění specifikaci, nejdřív se upraví
příslušný screen dokument a zaznamená důvod.
