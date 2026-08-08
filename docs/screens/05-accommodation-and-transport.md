# Ubytování a doprava

## Ubytování — účel

Sekce odpovídá na čtyři otázky:

- kde se kterou noc spí,
- kdy je check-in a check-out,
- co je zaplacené a co čeká,
- kde je potvrzení a potřebné instrukce.

## Přehled ubytování

Chronologická osa celé cesty ukazuje pobyty i úseky bez ubytování, například
noční let. Systém upozorní na nepokrytou noc a překrývající se rezervace.

Karta ubytování obsahuje:

- název a typ,
- termín a počet nocí,
- oblast/adresu,
- check-in a check-out,
- počet hostů a pokoj,
- snídani,
- cenu, zaplaceno a zbývá,
- stav rezervace a platby,
- dostupnost potvrzení offline,
- nejdůležitější storno nebo platební termín.

## Přidání a detail ubytování

Uživatel může vyhledat reálné místo nebo přidat vlastní ubytování ručně. Detail
počítá s:

- adresou, mapou, telefonem a webem,
- termínem, počtem nocí, hostů a pokojů,
- časem a instrukcemi check-in/out,
- typem pokoje, stravou, parkováním, Wi-Fi a poznámkou,
- rezervačním portálem, kódem, PINem, storno podmínkami a odkazem,
- cenou v původní měně a jednoduchým platebním stavem,
- dokumenty.

Citlivé údaje jako přístupový kód mohou být ve výchozím stavu skryté.

Ubytování se propojuje s itinerářem, mapou, rozpočtem a dokumenty. Check-in a
check-out se mohou zobrazovat v itineráři jako odkazy na tentýž záznam, ne jako
nesynchronizované kopie.

## MVP ubytování

- seznam a časová osa,
- vyhledání i ruční přidání,
- termín, adresa, check-in/out, snídaně,
- cena a jednoduchá platba,
- rezervační kód, poznámka a dokument,
- kontrola nepokrytých nocí,
- vazba na mapu, itinerář a rozpočet.

Více splátek a automatické storno notifikace mohou přijít později.

## Aktuálně implementovaný první řez

Route `/app/trips/{tripId}/accommodation` používá společný Nomadio App Shell a
zobrazuje rezervace chronologicky. Souhrn uvádí počet rezervací, součet nocí a
počet nezaplacených nebo částečně zaplacených pobytů. Informativní kontrola
termínu cesty hlásí nepokryté noci a překrývající se rezervace, ale uložení
neblokuje.

Owner a editor mohou rezervaci přidat, upravit a po potvrzení odstranit. Viewer
a člen archivované cesty mají read-only detail. Místo lze vybrat z existujících
`trip_places` nebo vyhledat přes serverovou Geoapify integraci. Výsledek se
normalizuje do interního místa a náhled renderuje Mapbox. Smazání rezervace
nikdy automaticky nemaže propojené místo.

Sekce Cena a platba ukládá `total_price`, `paid_amount`, měnu, explicitní
`payment_status` a volitelné `balance_due_date`. Toto datum obecně znamená
splatnost celé zbývající částky: při nulové platbě jde o plánovanou platbu celé
ceny, při částečné platbě o termín doplatku. Zbývající doplatek je vždy
dopočítaný jako rozdíl celkové a zaplacené částky a v databázi nemá vlastní
sloupec. Formulář při změně částek odvodí `unpaid`, `partially_paid` nebo `paid`;
explicitní `pay_on_site` nikdy automaticky nepřepíše a datum u něj může zůstat
prázdné. Databáze současně odmítá zjevné rozpory.

V budoucím Budget řezu bude ubytování zdrojem celkového nákladu, zaplacené a
zbývající částky, splatnosti, měny a platebního stavu. `budget_items` ani
automatická synchronizace se nyní nevytvářejí.

Tento řez zatím neobsahuje dokumenty, vícestupňový platební kalendář,
automatické check-in/check-out položky itineráře, úkoly, citlivé přístupové kódy,
storno pravidla ani automatické připomínky.

---

## Doprava — účel

Sekce eviduje rezervované nebo zásadní přesuny, nikoli každou spontánní jízdu
MHD. Typy:

- let,
- vlak,
- autobus,
- trajekt,
- půjčené auto,
- vlastní auto,
- taxi nebo objednaný transfer,
- jiný významný přesun.

## Přehled dopravy

Výchozí je chronologická timeline celé cesty. Alternativy jsou kalendář a mapa
hlavní trasy. Každá položka ukazuje typ, datum, odkud/kam, rezervační a platební
stav a offline dostupnost dokumentu.

## Rezervace a segmenty

Jedna rezervace může mít více segmentů se společným kódem, cenou a dokumentem.
Například let s přestupem není několik nesouvisejících rezervací.

Společná rezervace obsahuje:

- typ, název a dopravce,
- rezervační kód,
- stav rezervace a platby,
- celkovou cenu a měnu,
- cestující a dokumenty.

Segment obsahuje:

- místo odjezdu a příjezdu,
- datum a čas,
- číslo spoje,
- terminál, gate nebo nástupiště,
- vůz, sedadlo, třídu a zavazadla podle typu,
- pořadí.

## Specifika typů

- Let: aerolinka, číslo letu, letiště, terminály, třída, zavazadla, sedadlo,
  check-in a boarding informace.
- Vlak/autobus: dopravce, stanice, nástupiště, vůz a sedadlo.
- Trajekt: přístavy, nalodění, vozidlo, kajuta a cestující.
- Půjčené auto: půjčovna, vyzvednutí/vrácení, řidiči, kauce, pojištění,
  palivová politika a limit kilometrů.
- Vlastní auto: vozidlo, kilometry, spotřeba, známky, mýto a parkování.
- Transfer: poskytovatel, kontakt na řidiče, místo vyzvednutí a poznámka.

## Stavy dopravy

- Nápad
- Plánováno
- Rezervováno
- Zaplaceno
- Odbaveno
- Dokončeno
- Zrušeno

Rezervační a platební stav jsou oddělené významy.

## Propojení a kontroly

Doprava se zobrazuje v itineráři jako tentýž doménový záznam. Systém může
kontrolovat překryvy, návaznosti, check-in/out, chybějící přesun, dokument nebo
nezaplacenou rezervaci. Upozornění jsou informativní, ne agresivní.

## MVP dopravy

- hlavní typy dopravy,
- rezervace s více segmenty,
- časy, místa a číslo spoje,
- cena a platba,
- volitelná zavazadla a sedadla,
- dokumenty,
- vazba na itinerář, mapu a rozpočet,
- základní kontroly návazností.

Živé změny spojů, import PDF a přímé integrace s dopravci patří později.
