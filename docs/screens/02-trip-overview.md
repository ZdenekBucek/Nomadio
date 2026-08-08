# Přehled konkrétní cesty

## Účel

Přehled je hlavní rozcestník otevřené cesty. Musí okamžitě ukázat, co je
aktuální, co chybí a kam se uživatel potřebuje dostat. Obsah se přizpůsobuje
Planning a Travel mode.

## Hlavička cesty

- cover fotografie s tmavým gradientem,
- název,
- termín a počet dní,
- hlavní destinace a světadíl,
- počet cestovatelů a avatary,
- stav cesty,
- odpočet nebo aktuální den cesty,
- progres příprav,
- sdílení a menu,
- stav offline balíku.

## Implementovaný řídicí přehled

Přehled je kompaktní server-renderovaný dashboard, nikoli druhé místo pro
editaci dat. Čtyři horní souhrny vedou do Rozpočtu, Ubytování, Itineráře a
Checklistu. Finance používají normalizované Budget řádky a zobrazuje částky po
měnách bez FX součtu. Ubytování používá coverage helper, Itinerář počítá jen
datované dny s položkou a Checklist zobrazuje úkoly a balení odděleně.

Sekce **Vyžaduje pozornost** řadí pouze odvoditelné stavy: prošlé platby,
mezery nebo překryvy ubytování, prošlé úkoly a důležité dokumenty neoznačené
pro offline použití. Každá položka odkazuje na zdrojový modul. Pod ní jsou
nejbližší platba, přesun, ubytování, itinerář, otevřené úkoly, dokumenty a
odkaz na Mapu. Mobilní pořadí přednostně ukazuje hero, pozornost, souhrny,
itinerář, dopravu a ubytování; desktop používá hlavní a vedlejší sloupec.

Travel Mode ani skutečný Offline Pack nejsou implementované. Offline údaj proto
znamená výhradně počet dokumentů označených `offline_enabled`.

## Karty přehledu

### Nejbližší důležitá událost

Před cestou typicky odlet, splatnost nebo první rezervace. Během cesty se mění
na dnešní stav a první relevantní bod.

### Itinerář

- před cestou nejbližší naplánovaný den,
- během cesty dnešní itinerář,
- několik nejbližších bodů a přesunů,
- otevření detailu dne.

### Rozpočet

- celkový plán nebo rozpočet,
- zaplaceno,
- zbývá,
- cena na osobu,
- potřebná částka na společném účtu,
- jednoduchý progres a odkaz do rozpočtu.

### Ubytování

- nejbližší nebo aktuální ubytování,
- termín,
- adresa,
- check-in nebo check-out,
- snídaně,
- platební stav,
- upozornění na chybějící potvrzení nebo platbu.

### Doprava

- nejbližší hlavní přesun,
- čas, odkud a kam,
- číslo spoje,
- terminál, nástupiště nebo zavazadlo podle typu.

### Dokumenty

- počet dokumentů,
- počet dostupný offline,
- chybějící důležitý dokument.

### Checklist

- počet dokončených úkolů,
- několik nejbližších nebo nejdůležitějších položek.

### Mapa

Menší náhled celé cesty nebo aktuálního dne. Na desktopu může být v pravém
kontextovém panelu, na mobilu jako samostatná karta.

## Offline sekce

Stavy:

- Nestaženo
- Stahování
- Připraveno offline
- Dostupná aktualizace
- Chyba synchronizace

Hlavní akce je **Stáhnout celou cestu offline** nebo **Aktualizovat offline
balík**. Podrobnosti popisuje `09-offline-and-travel-mode.md`.

## Planning versus Travel mode

Planning mode zvýrazní nezaplacené položky, chybějící rezervace, přípravu,
checklist a dokumenty. Travel mode zvýrazní dnešní program, nejbližší přesun,
aktuální hotel, navigaci a rychlý přístup k dokumentům.

## MVP

- hlavička cesty,
- odpočet a stav,
- progres příprav,
- nejbližší událost,
- souhrny itineráře, rozpočtu, ubytování a dopravy,
- dokumenty a checklist,
- offline stav,
- rychlé přidání dostupných typů obsahu.
