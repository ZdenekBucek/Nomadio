# Rozdíl mezi specifikací a současnou implementací

Aktualizováno po přidání interních míst a vazby na timeline. Tento dokument brání tomu, aby se
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
- Chráněná obrazovka itineráře s datovanými dny a celými plány bez data.
- Název, oblast, stav a rezervní příznak dne; přiřazení data i návrat bez data.
- Automatické kalendářní řazení datovaných dnů a atomické ruční pořadí plánů bez data.
- Owner/editor mohou itinerář spravovat, viewer a člen archivované cesty jej pouze čtou.
- Detail dne se základní timeline aktivit, přesunů a poznámek.
- Volitelný čas od/do, textová poznámka, úprava, odstranění a atomické pořadí bodů.
- Provider-neutrální model uložených míst s kategorií Nomadia, adresou a souřadnicemi.
- Ruční správa vlastních míst a bezpečné propojení bodu timeline s místem stejné cesty.
- Chráněné Mapbox Geocoding v6 vyhledávání adres a geografických míst s
  kontextem zemí cesty a bezpečným mapováním permanentních výsledků.
- Samostatná mapa celé cesty s číslovanými piny, automatickým výřezem,
  přístupným seznamem a stavem pro místa bez souřadnic nebo chybějící token.
- Mapa konkrétního dne s pořadím propojených bodů timeline, zvýrazněním výběru,
  návratem na program a přímou spojnicí plánovaného pořadí.
- Kategoriální vrstvy celé cesty s reálnými počty a společným filtrováním pinů,
  seznamu míst, výběru a mapového výřezu.
- Nabíjecí místa jako samostatná databázová i aplikační kategorie včetně
  ručního zadání, Mapbox normalizace a mapových vrstev.

## Moje cesty — chybějící potvrzený obsah

- cover upload nebo licenčně bezpečný obrazový návrh,
- progres příprav a důležitá upozornění,
- rozšířené menu karty,
- plnohodnotné přehledové moduly, progres příprav a upozornění v detailu cesty.

## Datový model — známé mezery

Původní `countries` a `cities` zůstávají dočasně pouze kvůli bezpečné zpětné
kompatibilitě. Autoritativní struktura `trip_destinations` už obsahuje pořadí,
country code, světadíl, ruční přepsání i hlavní destinaci. Chybí ještě:

- POI vyhledávání po vyjasnění licenčních práv.

Změna modelu musí proběhnout verzovanou migrací s RLS a testy; stávající data
se nesmí ztratit.

## Doporučené nejbližší pořadí

1. Doplnit přesun bodů mezi dny a následně kontextové údaje rezervací.
2. Rozhodnout licenční režim POI katalogu a teprve potom připojit Search Box.
3. Postupně stavět skutečné přehledové moduly a další části cesty.

Duplikace cesty byla produktovým rozhodnutím vyřazena z MVP; současný model ani
rozhraní s ní proto nepočítají.

## Pravidlo aktualizace

Po každém dokončeném řezu se položky přesunou z mezery do části „Již
implementováno“. Pokud implementace vědomě mění specifikaci, nejdřív se upraví
příslušný screen dokument a zaznamená důvod.
