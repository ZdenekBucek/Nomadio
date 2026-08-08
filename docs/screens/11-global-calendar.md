# Globální Kalendář

Route `/app/calendar` patří do globálního kontextu Nomadia; nejde o další
varianty trip itineráře. Aktivní položkou globální navigace je **Kalendář**.

## Měsíc

Měsíční režim odpovídá na otázku „kdy probíhá která cesta“. Zobrazuje jen
datované, nearchivované tripy dostupné aktuálnímu uživateli přes RLS v jedné
souvislé mřížce se 7 sloupci a 5–6 řádky. Týden začíná pondělím, trip je
stabilně obarvený z jeho ID a jeho pruh je rozdělený na segmenty jednotlivých
řádků kalendáře. Překryvy získají samostatný lane; po třech lanes následuje
odkaz na zbývající tripy. Kliknutí vždy vede na Přehled tripu, nikoli do
Itineráře.

## Agenda

Agenda odpovídá na „co mě kdy čeká“. Je to pouze odvozený aplikační model,
neexistuje tabulka `calendar_events`. Agreguje začátek/konec tripu, check-in a
check-out ubytování, odjezdy transport segmentů, zbývající platby se
splatností a nedokončené úkoly s termínem. Položky jsou filtrovány podle cesty
a typu, výchozí stav ukazuje dnešek a budoucnost.

Transportní `timestamptz` se převádí na serveru v časové zóně daného tripu.
Ubytování používá uložené datum a čas bez nového klientského timezone systému.

## Další fáze

Neobsahuje itinerářové body, packing položky, dokumenty bez data, synchronizaci
s externím kalendářem ani vlastní kalendářové události. Archivované cesty jsou
v první verzi záměrně vynechané.
