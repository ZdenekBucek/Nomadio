# Navigace, režimy a responzivita

## Dva navigační kontexty

Nomadio rozlišuje globální prostor a prostor otevřené cesty. Navigace se nemá
snažit zobrazit oba kontexty současně v plném rozsahu.

### Globální desktopová navigace

- Moje cesty
- Kalendář cest
- Archiv
- Profil
- Nastavení

Dole je profil uživatele, stav úložiště nebo offline dat a případně volba
vzhledu. Samostatná položka „Sdílené se mnou“ se nepoužívá.

### Navigace uvnitř cesty na desktopu

- Přehled
- Itinerář
- Mapa
- Ubytování
- Doprava
- Rozpočet
- Dokumenty
- Checklist
- Poznámky
- Nastavení cesty

### Globální mobilní navigace

- Cesty
- Kalendář
- Dokumenty
- Profil

### Navigace uvnitř cesty na mobilu

- Přehled
- Itinerář
- Mapa
- Rozpočet
- Více

Položka **Více** obsahuje ubytování, dopravu, dokumenty, checklist, poznámky a
nastavení cesty.

## Planning mode

Planning mode je výchozí před cestou. Upřednostňuje:

- stav příprav,
- chybějící rezervace,
- nezaplacené položky a splatnosti,
- plánování itineráře a variant dnů,
- dokumenty a checklist,
- stažení nebo aktualizaci offline balíku.

Na desktopu může používat paralelní panely, drag-and-drop a širší kontext.

## Travel mode

Travel mode se může aktivovat automaticky podle termínu nebo ručně. Nejde o
jinou databázi ani kopii obsahu. Mění se pouze priorita a prezentace:

- dnešní program,
- aktuální a následující bod,
- nejbližší přesun,
- aktuální ubytování,
- rychlé otevření jízdenky, rezervace nebo dokumentu,
- navigace,
- rychlé přidání výdaje,
- zřetelný offline a synchronizační stav.

Dokončené body se utlumí. Dlouhé editační formuláře nejsou v Travel mode
primární; uživatel může přejít do běžného editačního režimu.

## Responzivní pravidla

- Rozhraní musí fungovat od šířky `320px` po velký desktop.
- Mobil není zmenšený desktop. Vedlejší panely se skládají, otevírají jako
  sheet nebo jsou pod položkou Více.
- Dotykové cíle mají nejméně `44px`.
- Drag-and-drop nesmí být jediný způsob přesunu; mobil používá i explicitní
  akci „Přesunout“.
- Kritická informace nesmí existovat pouze v hover stavu.
- Hlavní CTA má být snadno dosažitelné, ale na jedné obrazovce nemá soutěžit
  několik stejně výrazných akcí.

## Rychlé přidání uvnitř cesty

Na desktopu může být tlačítko **+ Přidat**, na mobilu plovoucí nebo jinak
snadno dostupná akce. Nabídka obsahuje podle dostupných modulů:

- bod itineráře,
- ubytování,
- dopravu,
- výdaj,
- dokument,
- poznámku,
- položku checklistu.

Nabídka nemá ukazovat nefunkční akce jako aktivní.
