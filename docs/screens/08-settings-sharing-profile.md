# Nastavení cesty, sdílení, cestovatelé a profil

## Nastavení cesty

### Základní informace

- název a popis,
- hlavní destinace, další země a města,
- automaticky navržený a ručně upravitelný světadíl,
- termín,
- časové pásmo,
- hlavní měna,
- cover: owner/editor může nahrát JPEG, PNG nebo WebP do 5 MB. Soubory jsou v privátním bucketu `trip-covers`; UI používá krátkodobou podepsanou URL a při chybě vždy zobrazí barevný fallback. Viewer ani archivovaná cesta obrázek nemění.
- stav cesty.

Model má počítat s cestou přes více zemí a případně více světadílů.

### Archivace a odstranění

- archivovat,
- duplikovat (mimo MVP; funkce byla vědomě odložena),
- převést vlastnictví,
- odstranit.

Odstranit cestu může pouze vlastník a akce vyžaduje potvrzení. Editor nesmí
odebrat vlastníka ani převést vlastnictví.

## Členové s přístupem

Člen je již registrovaný uživatel Nomadia s oprávněním k datům cesty.

Role:

- `owner` — plná správa včetně členů a destruktivních akcí,
- `editor` — běžná práce s obsahem, ne vlastnictví a odstranění,
- `viewer` — pouze čtení.

Vlastník přidá člena podle přesné shody jeho ověřeného Google e-mailu. Členství
vznikne okamžitě a cesta se uživateli zobrazí v běžném seznamu **Moje cesty**.
Pokud účet ještě neexistuje, žádné čekající členství se nevytvoří. Nomadio
neodesílá e-mailové pozvánky.

Neexistuje samostatná hlavní sekce „Sdílené se mnou“.

## Cestovatelé

Cestovatel je osoba účastnící se cesty a nemusí mít účet ani přístup k
aplikaci. Může mít:

- jméno,
- avatar,
- kontakt,
- výchozí podíl nákladů,
- volitelnou vazbu na uživatelský účet.

Členství a cestovatelé se nesmí sloučit do jedné tabulky nebo jednoho
oprávnění. Dítě nebo další účastník může být cestovatel bez účtu; viewer může
mít přístup a přitom vůbec necestovat.

## Výchozí pravidla rozpočtu

- hlavní měna,
- způsob dělení,
- společný účet zapnutý/vypnutý,
- cílová rezerva,
- výchozí plátce.

## Offline a notifikace

Nastavení cesty může obsahovat výběr offline obsahu, aktualizaci jen přes Wi-Fi
a odstranění balíku po archivaci. Budoucí notifikace zahrnují platby, změny
itineráře, dokumenty, úkoly, pozvánky a check-in.

## Globální profil

- jméno a avatar převzaté z Google s možností produktově schválené úpravy,
- jazyk a oblast,
- časová zóna,
- výchozí měna,
- jednotky a formát data,
- vzhled: tmavý, světlý nebo podle systému,
- přehled úložiště a offline dat,
- export dat, odpojení účtu a bezpečné smazání účtu.

Google slouží k autentizaci. Oprávnění a cesty spravuje Nomadio ve své
databázi.

## MVP

- editace základních údajů cesty,
- owner/editor/viewer,
- přímé přidání existujícího uživatele podle přesného e-mailu,
- oddělení členů a cestovatelů,
- archivace a bezpečné odstranění,
- profil s jazykem, časovým pásmem a výchozí měnou.
