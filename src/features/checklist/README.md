# Checklist

První vertikální řez je dostupný na `/app/trips/{tripId}/checklist` a odděluje
obecné úkoly od balicího seznamu. Obě části jsou vždy scoped přes `trip_id`.

## Úkoly

`tasks` ukládají název, popis, kategorii, stav, prioritu, termín a volitelné
přiřazení na `trip_travelers`. Filtry zobrazují všechny, aktivní, hotové nebo
úkoly přiřazené traveler záznamu aktuálního uživatele. Polymorfní vazba může
odkazovat na ubytování, dopravu, dokument nebo itinerary item; databázový
trigger vždy ověřuje stejný trip.

## Balení

`packing_items` je samostatný rychlý seznam s kategorií, množstvím, osobou,
typem zavazadla a stavem sbaleno. Úkoly i Balení mají vlastní kompaktní souhrn
s progressem a vlastní filtry. Na mobilu segmented control ukazuje jen aktivní
část a mění jednu hlavní akci, zatímco desktop od breakpointu `md` zobrazuje
obě části vedle sebe. Velké checkboxy jsou primární mobilní akce a stránka
nevytváří horizontální scroll ani při šířce 320 px.

## Přístup a další fáze

Owner/editor mohou vytvářet, upravovat, odškrtávat a mazat. Viewer čte.
Archivovaný trip je read-only a cizí člen nemá přístup. První řez neposílá
notifikace ani nevytváří úkoly automaticky. Pozdější fáze mohou nad linked
entity přidat automatické úkoly, relativní termíny, připomínky, šablony
checklistů a celé cestovní šablony.
