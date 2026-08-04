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
- Vlastní místo

Mapový provider může vrátit více technických kategorií. Nomadio navrhne jednu
srozumitelnou kategorii, kterou lze ručně změnit.

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
