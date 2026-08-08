# Accommodation

První trip-scoped vertikální řez ubytování obsahuje:

- tabulku `accommodations` s RLS pro owner/editor/viewer a read-only archiv,
- serverové CRUD akce s validací na hranici důvěry,
- chronologický přehled, souhrn nocí a platebních stavů,
- celkovou cenu, již zaplacenou částku a obecnou splatnost zbývající částky;
  zbývající částka je odvozená a neukládá se,
- informativní detekci mezer a překryvů v termínu cesty,
- propojení existujícího `trip_place` nebo vytvoření/reuse normalizovaného
  Geoapify výsledku s Mapbox náhledem,
- detail/editaci a smazání, které zachová propojené místo.

`accommodation-model.ts` drží čisté výpočty a popisky, `accommodation-input.ts`
validuje formulář, `accommodation-data.ts` načítá serverová data a
`accommodation-actions.ts` autentizuje každou mutaci. UI je v samostatných
form/list komponentách.

Dokumenty, automatické položky itineráře, checklist, více plateb a automatické
úkoly zůstávají pro další řezy.

Budget nyní čte z accommodation `total_price`, `paid_amount`, odvozený doplatek,
`balance_due_date`, `currency` a `payment_status` jako read-only zdroj. Tento
modul nevytváří `budget_items` ani žádný synchronizační mechanismus.

`balance_due_date` pokrývá jedinou budoucí platbu: při `paid_amount = 0` celou
částku, při částečné platbě doplatek. Více samostatných splátek tento jednoduchý
plán záměrně nemodeluje.
