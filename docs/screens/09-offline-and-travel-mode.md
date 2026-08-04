# Offline balík a Travel mode

## Záměr

Uživatel musí mít před cestou jistotu, že kritický obsah jedné cesty bude
dostupný bez sítě. Offline režim není pouze cache poslední otevřené stránky.
Jde o vědomě spravovaný a verzovaný balík konkrétního uživatele a tripu.

## Obsah offline balíku

- itinerář a plány dnů,
- místa, adresy a kontakty,
- ubytování,
- doprava,
- checklist,
- poznámky,
- vybrané dokumenty,
- základní mapová data pouze v mezích licence providera.

Velké dokumenty a mapové oblasti musí mít odhad velikosti a možnost výběru.

## Stavy

- Nestaženo
- Připravuji
- Stahování
- Připraveno offline
- Dostupná aktualizace
- Synchronizuji změny
- Konflikt
- Chyba

UI ukazuje poslední úspěšnou synchronizaci, verzi balíku a odhad velikosti.

## Chování bez sítě

- Aplikace načítá dostupná data z lokální databáze i při přechodu mezi domovskou
  obrazovkou a jednotlivými moduly.
- Zřetelně, ale klidně označí offline stav.
- Povolené změny ukládá do outboxu a po návratu sítě je bezpečně opakuje.
- Nesmí dojít k tichému přepsání konfliktu nebo ztrátě změny.
- Při odhlášení nebo ztrátě přístupu musí jít soukromá lokální data odstranit.

## Travel mode

Travel mode používá offline data jako první zdroj pro rychlé otevření:

- dnešního programu,
- nejbližšího přesunu,
- aktuálního hotelu,
- navigačních adres,
- jízdenek a rezervací,
- rychlého výdaje.

Planning mode a Travel mode jsou dvě prezentace stejného doménového modelu,
nikoli dvě nesynchronizované kopie.

## Platforma

První platformou je instalovatelná PWA. Service worker, IndexedDB a manifest
musí zachovat možnost budoucího zabalení přes Capacitor bez přepisování domény.

## MVP

- explicitní „Stáhnout cestu“,
- verzovaný lokální balík,
- itinerář, ubytování, doprava, checklist a poznámky offline,
- výběr důležitých dokumentů,
- stav, velikost a poslední synchronizace,
- základní outbox změn,
- bezpečné odstranění lokálních dat.

Pokročilé mapové balíky a automatické řešení složitých konfliktů patří až po
stabilizaci datového modelu.
