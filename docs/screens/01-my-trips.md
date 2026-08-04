# Obrazovka Moje cesty

## Účel

Globální vstupní obrazovka má působit jako prémiová knihovna cest, ne jako
tabulkový projektový dashboard. Uživatel během několika sekund pozná:

- která cesta je nejbližší nebo právě probíhá,
- jaký má termín a destinace,
- v jakém je stavu,
- co vyžaduje pozornost,
- kdo se jí účastní,
- a jak ji otevřít.

## Jednotný seznam

Seznam obsahuje všechny cesty, ke kterým má uživatel přístup:

- vlastní,
- sdílené,
- soukromé i společné,
- plánované, probíhající, dokončené a archivované.

Nesmí existovat primární rozdělení „Moje“ versus „Sdílené se mnou“. Role
uživatele může být nenápadně uvedená v menu nebo detailu karty.

## Hlavička a filtry

- Nadpis **Moje cesty**.
- Krátké vysvětlení, že vlastní i sdílené cesty jsou na jednom místě.
- Hlavní akce **+ Nová cesta**; na mobilu může být samostatné čtvercové `+`.
- Základní filtry: Nadcházející, Probíhající, Dokončené, Všechny, Archiv.
- Později lze přidat hledání a filtry podle světadílu, země a roku.

## Karta cesty

Potvrzený obsah karty:

- cover fotografie nebo důstojný gradientový fallback,
- název a vlajka hlavní země,
- termín a délka cesty,
- země, města nebo oblasti,
- světadíl,
- počet cestovatelů a jejich avatary,
- stav cesty,
- odpočet nebo informace o probíhající cestě,
- základní progres příprav,
- nejvýše jedno až dvě důležitá upozornění,
- informace o soukromí nebo sdílení.

Příklady stavového textu:

- „Za 77 dní“
- „Právě cestujete · den 4 z 16“
- „Dokončeno“
- „12 704 Kč zbývá uhradit“
- „Platba za hotel do 15. září“

Celá karta otevírá cestu. Menu se třemi tečkami může obsahovat úpravu,
duplikaci, sdílení, offline stažení, archivaci a odstranění podle oprávnění.

## Stavy cesty

- Nápad
- Plánování
- Připraveno
- Probíhá
- Dokončeno
- Archivováno

Probíhá a Dokončeno lze odvozovat z termínu, ale uživatel musí mít možnost
stav v odůvodněných případech ručně upravit.

## Vytvoření nové cesty

Výsledný tok nemá být jeden dlouhý formulář. Cílový návrh je krátký průvodce:

### Krok 1 — základní údaje

- název,
- hlavní destinace,
- další země a města,
- datum od a do — termín může být neznámý,
- hlavní měna,
- počet cestovatelů.

Světadíl se navrhne podle destinace a lze jej ručně změnit. Datový model má
počítat s více zeměmi a případně více světadíly.

### Krok 2 — vzhled

- vlastní cover,
- automaticky navržená fotografie, pokud to dovolí zdroj a licence,
- nebo gradientový fallback,
- případná vlajka či akcent.

### Krok 3 — cestovatelé a sdílení

- jen já,
- přidat cestovatele bez účtu,
- pozvat registrovaného nebo budoucího uživatele e-mailem,
- zvolit oprávnění.

Nový trip zůstává soukromý, dokud uživatel výslovně nepřidá člena s přístupem.

## Mobil

- Logo, notifikace a avatar v horní liště.
- Jedna karta přes téměř celou šířku.
- Pořadí informací: fotografie, název, termín, destinace, členové, progres,
  nejdůležitější upozornění.
- Výchozí pohled zvýrazní nejbližší cesty; dokončené jsou dostupné filtrem.

## MVP

- jednotný seznam dostupných cest,
- vytvoření soukromé cesty,
- cover nebo kvalitní fallback,
- termín, destinace, světadíl a měna,
- stav a odpočet,
- cestovatelé,
- základní progres,
- archivace a bezpečné odstranění.

Chytré počítání progresu a upozornění mohou vznikat postupně, ale karta pro ně
musí mít předem promyšlenou informační hierarchii.
