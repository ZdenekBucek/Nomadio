# Mapa, místa a vyhledávání

## Účel

Mapa je společný prostor pro itinerář, ubytování, dopravu a uložené tipy. Nemá
být jen dekorativním náhledem. Uživatel musí být schopen místo vyhledat, uložit,
zařadit a zobrazit v kontextu dne nebo celé cesty.

## Vyhledávání místa

Našeptávač používá kontext:

- země a města cesty,
- vybraný den,
- aktuální výřez mapy,
- předchozí bod itineráře,
- v Travel mode případně polohu uživatele po udělení oprávnění.

Výsledek ukazuje název, typ, oblast/adresu a případně vzdálenost od kontextového
bodu. Po výběru vznikne pin a interní záznam místa.

## Interní model místa

Minimálně:

- provider,
- provider place ID,
- název,
- adresa,
- země a město,
- zeměpisná šířka a délka,
- původní kategorie providera,
- interní kategorie Nomadia,
- informace, zda kategorii přepsal uživatel,
- volitelně telefon, web a providerem dovolená metadata.

Provider data se při uložení mapují do interního modelu. Změna providera nesmí
rozbít uložený itinerář.

## Kategorie Nomadia

- Ubytování
- Památka
- Aktivita
- Restaurace a jídlo
- Doprava
- Nákupy
- Příroda
- Nabíjecí místo
- Vlastní místo

Mapový provider může vrátit více technických kategorií. Nomadio navrhne jednu
srozumitelnou kategorii, kterou lze ručně změnit.

Seznam kategorií, české názvy a názvy mapových vrstev mají jeden společný
aplikační zdroj. Validace formulářů, Mapbox normalizace i mapové filtry používají
stejný kontrakt, aby další kategorie nebylo nutné udržovat na několika místech.

## Mapa dne

- číslované body podle pořadí,
- ikona nebo střídmá barva podle typu,
- trasa mezi body,
- zvýrazněný vybraný bod,
- ubytování jako referenční bod,
- soulad pořadí mapy a timeline.

## Mapa celé cesty

Může zobrazit vrstvy:

- ubytování,
- hlavní doprava,
- atrakce a aktivity,
- restaurace,
- nabíjecí místa,
- uložená místa,
- body konkrétního dne.

Uživatel může vrstvy filtrovat. Hlavní dopravní mapa ukazuje významné přesuny,
ne každou jízdu městskou dopravou.

## Vlastní místo

Vedle katalogu musí jít:

- kliknout do mapy a vytvořit vlastní bod,
- ručně posunout pin,
- uložit bod, který provider nezná,
- přidat název a poznámku.

## Uložená místa

Samostatný seznam tipů bez přiřazení ke dni. Místa lze později přesunout do
itineráře. Volitelné štítky:

- priorita,
- rezervace nutná,
- dobré za deště,
- večerní program,
- poblíž hotelu.

## Provider a licence

Preferovaný provider je Mapbox kvůli stylování, POI a návaznosti na interaktivní
mapu. Před ukládáním fotografií, otevírací doby, tras nebo offline mapových dat
je nutné ověřit licenční a cache podmínky konkrétního API. Aplikace nesmí
předpokládat, že všechna vrácená data lze trvale uložit.

Pro ukládání adres a geografických míst používá současný řez Geocoding API v6
s parametrem `permanent=true`. Mapbox účet proto musí mít povolené účtování.
Search Box API s POI daty povoluje ve standardním režimu pouze dočasné použití;
jeho výsledky Nomadio nebude ukládat bez odpovídající smlouvy. Viz
[Geocoding API](https://docs.mapbox.com/api/search/geocoding/) a
[Search Box API](https://docs.mapbox.com/api/search/search-box/).

## MVP

- kontextové vyhledávání,
- interní model místa,
- pin a navržená kategorie,
- ruční změna kategorie,
- mapa dne,
- vlastní bod,
- uložená místa bez data.

Optimalizace trasy, živá doprava, automatické otevírací doby a rozsáhlé offline
mapové balíky patří později.

## Stav implementace

Dva dokončené řezy míst obsahují interní provider-neutrální model, kategorie
Nomadia, ruční vytvoření vlastního místa, propojení s body timeline a chráněné
Mapbox Geocoding v6 vyhledávání. Výsledky se omezují zeměmi cesty, normalizují
se na interní model a ukládají s provider ID, technickou kategorií a
souřadnicemi. Bez serverového tokenu rozhraní bezpečně nabídne ruční zadání.
Třetí řez přidává samostatnou mapu celé cesty s číslovanými piny, automatickým
výřezem, výběrem bodu a přístupným seznamem. Záznamy bez souřadnic jsou viditelné
odděleně. Čtvrtý řez přidává mapu konkrétního dne nad propojenými body timeline,
číslování ve stejném pořadí, výběr bodu, návrat na položku programu a přímou
spojnici plánovaného pořadí. Pátý řez doplňuje na mapu celé cesty vrstvy všech
kategorií Nomadia s počty skutečných míst. Vypnutí vrstvy současně aktualizuje
piny, přístupný seznam, vybrané místo a mapový výřez; stav bez aktivní vrstvy je
výslovný a snadno vratný volbou „Vše“. Bez veřejného mapového tokenu obě
obrazovky zobrazí připravená data a plnohodnotný seznam místo nefunkční mapy.
Kategorie nabíjecích míst je součástí interního modelu, ručních formulářů,
Mapbox normalizace i vrstev obou map.
POI katalog Search Box a skutečná navigační trasa zatím implementované nejsou.
