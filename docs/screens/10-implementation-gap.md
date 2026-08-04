# Rozdíl mezi specifikací a současnou implementací

Aktualizováno po rozšíření základních údajů a karet „Moje cesty“. Tento dokument brání tomu, aby se
technický základ omylem považoval za schválenou finální obrazovku.

## Již implementováno

- Google přihlášení a chráněný aplikační prostor.
- Profil a základní globální shell.
- Responzivní desktopová a mobilní navigace.
- Tabulky `trips`, `trip_members` a normalizované `trip_destinations`.
- Role owner/editor/viewer a základní RLS.
- Automatické vlastnické členství.
- Jednotný seznam dostupných cest.
- Atomické vytvoření soukromé cesty a vlastnického členství.
- Tříkrokový průvodce vytvořením cesty.
- Název, popis, první země/město, světadíl, termín, timezone, měna a fáze cesty.
- Barevné covery s předem definovanými variantami a připravená cover metadata.
- Filtry Nadcházející/Probíhající/Dokončené/Všechny/Archiv.
- Odvozený stav, odpočet, délka cesty, hlavní destinace a soukromí na kartě.
- Bezeztrátová migrace starých polí `countries` a `cities` do destinací.

## Moje cesty — chybějící potvrzený obsah

- správa více destinací v rozhraní (datový model ji již podporuje),
- cestovatelé oddělení od členů,
- cover upload nebo licenčně bezpečný obrazový návrh,
- avatary cestovatelů a informace o sdílení,
- progres příprav a důležitá upozornění,
- archivace, odstranění, duplikace a menu karty,
- plnohodnotný klikací detail cesty.

## Datový model — známé mezery

Původní `countries` a `cities` zůstávají dočasně pouze kvůli bezpečné zpětné
kompatibilitě. Autoritativní struktura `trip_destinations` už obsahuje pořadí,
country code, světadíl, ruční přepsání i hlavní destinaci. Chybí ještě:

- tabulka cestovatelů,
- pozvánky a jejich stav,
- následné entity itineráře, míst a modulů.

Změna modelu musí proběhnout verzovanou migrací s RLS a testy; stávající data
se nesmí ztratit.

## Doporučené nejbližší pořadí

1. Přidat cestovatele oddělené od členů.
2. Doplnit pozvánky a informace o sdílení na kartách.
3. Vytvořit routu a hlavičku detailu cesty.
4. Přidat správu více destinací a akce archivace/duplikace.
5. Teprve potom stavět dashboard přehledu a další moduly.

## Pravidlo aktualizace

Po každém dokončeném řezu se položky přesunou z mezery do části „Již
implementováno“. Pokud implementace vědomě mění specifikaci, nejdřív se upraví
příslušný screen dokument a zaznamená důvod.
