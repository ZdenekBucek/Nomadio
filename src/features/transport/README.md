# Doprava

První vertikální řez modulu je dostupný na route
`/app/trips/{tripId}/transport`. Doménu tvoří rezervace
`transport_bookings` a její jeden až dvacet chronologicky seřazených segmentů
`transport_segments`.

## Ukládání a oprávnění

- Rezervace obsahuje typ dopravy, dopravce, kód, stav, cenu, zaplacenou částku,
  datum splatnosti zbytku, měnu a poznámku.
- Zbývající částka se neukládá; počítá se jako `total_price - paid_amount`.
- Segment uchovává odjezd/příjezd, propojená `trip_places`, číslo spoje,
  terminál, nástupiště, sedadlo, zavazadla a poznámku.
- `save_transport_booking(...)` ukládá booking a celou seřazenou sadu segmentů
  atomicky. `sort_order` vzniká na serveru z pořadí pole.
- Uložené místo lze vybrat, nebo vyhledat přes serverový Geoapify flow. Externí
  místo se vytvoří či znovu použije pomocí stejného provider-neutrálního modelu;
  jeden výsledek se v rámci tripu neduplikuje.
- Smazání bookingu kaskádově smaže jen segmenty. `trip_places` zůstávají.
- Owner/editor zapisují, viewer pouze čte a archivovaný trip je read-only.

Časy z formuláře jsou interpretované v `trips.timezone` a ukládají se jako
`timestamptz`. Platební data jsou připravená jako budoucí vstup modulu Budget.
Segmenty jsou připravené pro pozdější vytvoření odkazovaných itinerary items,
ale žádná automatická synchronizace nyní neběží.

## Mimo tento řez

Nejsou implementované živé statusy letů a spojů, boarding pass, import PDF,
dokumenty, routing, přímé integrace dopravců, automatické notifikace ani
automatické vytváření položek itineráře či rozpočtu.
