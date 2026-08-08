# Globální Přehled

Route `/app` je osobní Travel Command Center napříč vlastními i sdílenými nearchivovanými cestami; `/app/trips` zůstává seznamem a správou cest.

Dominantní hero používá cover cesty nebo Nomadio gradient a odpovídá na kam, kdy a za jak dlouho uživatel vyráží. Pod ním je jediný kompaktní pás připravenosti pro ubytování, checklist, důležité dokumenty a rozpočet. Attention, další událost, finance, tři prioritní úkoly a dokumentový stav zůstávají krátké a odkazují do zdrojových modulů.

Na desktopu má hlavní sloupec další událost a agendu, vedlejší finance, úkoly a dokumenty. Mobil používá samostatné pořadí: hero, připravenost, Attention, další událost, finance, agenda, úkoly a dokumenty. Všechny grid položky mají `min-width: 0` a stránka od 320 px nevytváří horizontální scroll.

Data vznikají z RLS dotazů do `trips`, destinací, cestovatelů, `accommodations`, `transport_bookings` + segmentů, `budget_items`, `tasks`, `documents` a `packing_items`. Dokumenty se načítají jen jako potřebná metadata. Agenda sdílí `buildCalendarAgenda` s Kalendářem; peněžní sumy se napříč měnami nikdy nesčítají. Budoucí Travel Mode může doplnit dnešní itinerary obsah, ale nevytvoří druhý dashboardový model.
