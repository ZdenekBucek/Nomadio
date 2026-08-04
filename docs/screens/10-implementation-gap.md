# Rozdíl mezi specifikací a současnou implementací

Aktualizováno po přidání nastavení cesty a správy destinací. Tento dokument brání tomu, aby se
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
- Samostatní cestovatelé bez účtu a automatický cestovatel-vlastník.
- Přidání cestovatelů ve třetím kroku průvodce.
- Počet cestovatelů, avatar nebo iniciály a souhrn na kartě cesty.
- Přímé sdílení s existujícím účtem podle přesného e-mailu jako editor/viewer.
- Ochrana jediného vlastníka a okamžité zobrazení sdílené cesty členovi.
- Stav Soukromá/Sdílená, počet členů a role aktuálního uživatele na kartě.
- Klikací karta a chráněná route detailu cesty s bezpečným stavem „nenalezeno“.
- Kontextová desktopová a mobilní navigace uvnitř cesty; budoucí moduly jsou zřetelně neaktivní.
- Hlavička detailu s reálným stavem, termínem, odpočtem, destinací, cestovateli a přístupem.
- Základní přehled reálných destinací a cestovatelů bez smyšlených rozpočtů nebo progresu.
- Přesun přímého sdílení z karty do přehledu cesty.
- Bezpečný seznam členů s profilem, e-mailem, rolí a označením aktuálního uživatele.
- Změna editor/viewer role a potvrzené odebrání přístupu pouze vlastníkem.
- Okamžitá ztráta přístupu odebraného člena a neměnnost jediného vlastníka.
- Chráněná stránka nastavení se základními údaji, termínem, měnou, stavem a barevným coverem.
- Úpravy nastavení pro owner/editor a režim pouze pro čtení pro viewer.
- Správa více destinací: přidání, úprava, změna hlavní destinace, pořadí a bezpečné odebrání.
- Databázové invarianty jediné hlavní destinace, souvislého pořadí a zákazu odstranění poslední destinace.
- Owner-only archivace, obnovení do předchozího stavu a potvrzené trvalé odstranění cesty.
- Archivované cesty jsou v samostatném filtru a jejich obsah, členové i cestovatelé jsou pouze pro čtení.

## Moje cesty — chybějící potvrzený obsah

- cover upload nebo licenčně bezpečný obrazový návrh,
- progres příprav a důležitá upozornění,
- duplikace a rozšířené menu karty,
- plnohodnotné přehledové moduly, progres příprav a upozornění v detailu cesty.

## Datový model — známé mezery

Původní `countries` a `cities` zůstávají dočasně pouze kvůli bezpečné zpětné
kompatibilitě. Autoritativní struktura `trip_destinations` už obsahuje pořadí,
country code, světadíl, ruční přepsání i hlavní destinaci. Chybí ještě:

- následné entity itineráře, míst a modulů.

Změna modelu musí proběhnout verzovanou migrací s RLS a testy; stávající data
se nesmí ztratit.

## Doporučené nejbližší pořadí

1. Přidat bezpečnou duplikaci cesty bez automatického kopírování členů s přístupem.
2. Postupně stavět skutečné přehledové moduly a další části cesty.

## Pravidlo aktualizace

Po každém dokončeném řezu se položky přesunou z mezery do části „Již
implementováno“. Pokud implementace vědomě mění specifikaci, nejdřív se upraví
příslušný screen dokument a zaznamená důvod.
