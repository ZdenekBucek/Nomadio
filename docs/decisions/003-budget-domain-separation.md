# ADR 003: Oddělení Budget Plan, Reality a Payments

## Stav

Přijato pro první fázi redesignu Budget domény.

## Kontext

Původní Budget read model skládá ruční položky, Ubytování a Dopravu do jednoho
řádku s odhadem, skutečnou částkou a platebním stavem. Je praktický pro první
vertikální řez, ale významově míchá tři různé otázky: kolik očekáváme, že cesta
bude stát, kolik skutečně stojí a kolik z této částky už bylo zaplaceno.

## Zvažované varianty

1. Zachovat jediný univerzální řádek. Má nejméně typů, ale dovoluje nejasné
   kombinace odhadu, reality a platby a ztěžuje výpočet odchylky od plánu.
2. Kopírovat Accommodation a Transport do finanční tabulky. Sjednotí databázové
   čtení, ale vytvoří dva zdroje pravdy a vyžaduje synchronizaci.
3. Oddělit Plan, Reality a Payments v doméně a zdrojové rezervace pouze
   projektovat. Zachová jeden zdroj pravdy a umožní samostatné souhrny.

## Rozhodnutí

Budget doména používá samostatné kontrakty `BudgetPlanItem`,
`BudgetRealityItem` a `BudgetPaymentItem`.

- Plan vyjadřuje očekávaný náklad.
- Reality vyjadřuje skutečný nebo potvrzený náklad bez ohledu na to, zda už byl
  zaplacen.
- Payments vyjadřují uhrazenou částku, odvozený zůstatek, splatnost a platební
  stav.

Accommodation a Transport zůstávají autoritativními zdroji. Adaptéry z nich za
běhu vytvářejí Reality a Payment projekce; žádná kopie rezervace se neukládá.
Manuální expense je editovatelným zdrojem Reality. Různé měny se vždy agregují
odděleně a bez FX kurzu se nesčítají.

První fáze přidala čistou TypeScript doménu a testy. Druhá fáze přidává
trip-scoped úložiště `budget_plan_items` a `expenses`, ale stále nemění
uživatelské rozhraní. Accommodation a Transport zůstávají zdrojem Reality a
Payments bez kopírování do finančních tabulek.

Třetí fáze přidává společný serverový read model
`getTripBudgetDashboard(tripId)`. V paralelních dotazech načte plán, manuální
výdaje a autoritativní Accommodation a Transport záznamy. Čistý doménový
builder z nich vytvoří měnově oddělené souhrny Plan a Reality, porovnání podle
kategorií, neplánované výdaje a odvozený Payments přehled. Tento kontrakt je
připravený jako budoucí zdroj pro Budget UI, Trip Overview, Global Overview a
Kalendář; jejich UI se v této fázi nemění.

## Důsledky

- Reality a Paid již nejsou zaměnitelné hodnoty. Rezervace za 20 000 Kč zvyšuje
  Reality o 20 000 Kč i tehdy, když bylo zatím zaplaceno jen 5 000 Kč.
- `Reality.occurredAt` je datum a čas vzniku nákladu, nikoli čas vytvoření
  databázového záznamu. Quick expense jej bez explicitního vstupu nastaví na
  aktuální čas serveru.
- Payments zůstávají samostatným konceptem. V této fázi se odvozují pouze z
  platebních polí Accommodation a Transport; nevzniká tabulka `payments`.
- `remainingAmount` se nadále odvozuje a neukládá.
- Neznámé platební částky zůstávají `null`; doména je nevydává za nulu.
- Nové tabulky používají stejné owner/editor/viewer RLS a read-only archiv jako
  ostatní trip obsah.
- Více plateb, refundace a FX přepočet nejsou součástí tohoto rozhodnutí.
