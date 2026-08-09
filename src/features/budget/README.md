# Rozpočet

Budget doména odděluje tři otázky, které původní univerzální řádek směšoval:

- `Plan` jsou očekávané náklady uložené v `budget_plan_items`.
- `Reality` jsou vzniklé náklady z manuálních `expenses` a read-only adaptérů
  Ubytování a Dopravy.
- `Payments` jsou zaplacené částky, odvozené zůstatky a splatnosti. Zůstatek se
  nikdy neukládá duplicitně.

`getTripBudgetDashboard(tripId)` je jednotný serverový read model pro všechny
tři části. Měny agreguje samostatně a neprovádí FX přepočet.

## Stav UI

Route `/app/trips/{tripId}/budget` má nový kompaktní shell se summary a záložkami
Plán, Realita a Platby. Implementované jsou Plán a Realita:

- owner/editor vytváří, upravuje a maže plánované položky,
- viewer a archivovaný trip mají read-only zobrazení,
- formulář používá centrální katalog kategorií a podkategorií,
- server znovu validuje částku, měnu a kombinaci kategorie/podkategorie,
- mobilní dialog funguje od 320 px a hlavní akce zůstává snadno dosažitelná.
- manuální expenses mají quick-add flow částka → kategorie → uložit, přičemž
  čas, autor, trip a hlavní měna se doplňují serverově,
- manuální náklady jsou v časové ose a mají owner/editor CRUD,
- Accommodation a Transport se promítají read-only bez ukládání kopií,
- kategoriální porovnání označuje překročení a náklady bez plánu,
- všechny měny zůstávají oddělené bez FX přepočtu.

Platby zatím zobrazují pouze placeholder. Další fáze připojí platební cashflow.
Legacy `budget_items` není zdrojem nové Budget obrazovky; dočasně zůstává pouze
kvůli dosud nepřepojeným přehledovým modulům.
