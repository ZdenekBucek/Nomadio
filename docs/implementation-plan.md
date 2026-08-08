# Nomadio — doporučený implementační plán

Plán postupuje po malých vertikálních celcích. Každý celek má dodat jednu
ověřitelnou uživatelskou hodnotu včetně databázové migrace, RLS politik,
rozhraní, chybových stavů a testů. Další celek nezačíná skrytým rozšiřováním
předchozího.

Konkrétní obsah obrazovek se neodvozuje jen z tohoto pořadí. Před každým řezem
je nutné použít odpovídající specifikaci z
[`docs/screens/`](./screens/README.md) a aktualizovat přehled rozdílů proti
implementaci.

## Technická rozhodnutí

1. **Feature-first modulární monolit.** Jedna Next.js aplikace s doménami v
   `src/features` je pro první produkt jednodušší než mikroservisy a zachovává
   možnost pozdějšího oddělení providerů.
2. **Supabase jako autoritativní backend.** PostgreSQL drží relační data,
   Supabase Auth identitu a privátní Storage soubory. RLS je povinná součást
   každé migrace.
3. **Provider adaptéry.** Geoapify i Mapbox výsledky se mapují na společný
   `PlaceSearchResult`; doménový model nezávisí na odpovědi konkrétního API.
   OAuth, storage a mapové API se nepoužívají přímo z doménových komponent.
4. **Offline až po stabilizaci modelu.** IndexedDB a synchronizační fronta se
   přidají po základních CRUD tocích, aby se předčasně nezafixoval chybný model.
   Service worker zatím pouze zakládá bezpečný PWA lifecycle.
5. **Server-first renderování.** Server Components načítají data; Client
   Components řeší pouze formuláře, mapu, drag-and-drop a browser APIs.

## Pořadí dodávek

### 0. Technický základ — hotovo

- Next.js, strict TypeScript, Tailwind, shadcn/ui, ESLint a Vitest.
- Tmavé design tokeny, základní responzivní foundation UI a PWA manifest.
- Prázdné hranice domén, environment template a projektová dokumentace.

### 1. Identita a aplikační shell — hotovo

- Dokončeno a integračně ověřeno: verzovaná migrace profilu, RLS, Google OAuth,
  callback, serverová session, lokální odhlášení a chráněná `/app` route.
- Migrace je aplikovaná lokálně i ve vzdáleném projektu Nomadio; opakované
  přihlášení zachovává jediný profil a celý OAuth tok prošel v jednom prohlížeči.
- Vizuální jazyk Nomadia je zdokumentovaný a převedený do globálních tokenů a
  základních komponent, které jsou závazné pro nový aplikační shell.
- Dokončeno: navigační shell rozlišuje globální a trip kontext podle route.
  Globální sidebar má Přehled, Moje cesty, Kalendář, Mapu, Finance a Dokumenty;
  trip sidebar používá moduly konkrétní cesty a jasný návrat na Moje cesty.
  Neimplementované globální moduly mají klikací placeholdery místo falešně
  deaktivovaných trip položek.
- Chování po expiraci session je ověřené syntetickou expirovanou session proti
  běžící aplikaci: privátní route přesměruje na přihlášení, zachová návratovou
  adresu a odstraní neplatnou auth cookie. Stejný kontrakt kryje automatický test.

### 2. Soukromý trip a „Moje cesty“ — hotovo

- Lokálně dokončeno: schéma `trips`, `trip_members`, automatické vlastnické
  členství a RLS pro owner/editor/viewer včetně negativních pgTAP scénářů.
- Dokončeno: atomické vytvoření soukromého tripu a společný seznam vlastních i
  sdílených tripů v responzivní sekci „Moje cesty“.
- Dokončeno: rozšířené údaje tripu, normalizované destinace s bezpečným
  backfillem, RLS a pgTAP testy.
- Dokončeno: tříkrokový průvodce, stavové filtry a karty s coverem, odpočtem,
  termínem, délkou, hlavní destinací, světadílem a soukromím.
- Dokončeno: samostatní cestovatelé bez účtu, automatické přidání vlastníka,
  zadání dalších cestovatelů v průvodci a jejich souhrn na kartách.
- Dokončeno: klikací chráněný detail, kontextová navigace, datová hlavička a
  první přehled reálných destinací, cestovatelů a přístupu.
- Dokončeno: detail cesty nyní používá kompaktní řídicí přehled nad
  normalizovanými daty Budgetu, Ubytování, Dopravy, Itineráře, Checklistu a
  Dokumentů. Finanční částky se nesčítají napříč měnami; attention ukazuje jen
  odvoditelné problémy a vždy odkazuje do zdrojového modulu.
- Dokončeno: chráněné nastavení základních údajů a rolově omezená správa více
  destinací včetně hlavní destinace, pořadí a databázových invariantů.
- Dokončeno: owner-only archivace, obnovení předchozího stavu a bezpečné
  odstranění po přesném potvrzení názvu; archivovaný obsah je pouze pro čtení.
- Duplikace cesty byla vědomě vyřazena z MVP. Plné přehledové moduly vzniknou
  až nad skutečnými daty dalších částí aplikace.

### 3. Sdílení — hotovo

- Dokončeno: přímé přidání existujícího uživatele podle přesného ověřeného e-mailu jako
  editor/viewer; vlastník zůstává jediný a nevznikají e-mailové ani čekající
  pozvánky.
- Dokončeno: stav soukromí/sdílení, počet členů a role na kartách.
- Dokončeno: formulář přímého sdílení je součástí detailu cesty a je dostupný
  jen vlastníkovi.
- Dokončeno: testovací matice pro přidání, čtení, jediného vlastníka a zákaz
  správy přístupu nevlastníkem.
- Dokončeno: členové vidí seznam přístupů s profily; vlastník může měnit role
  editor/viewer a po potvrzení odebírat nevlastníky.
- Dokončeno: databázové funkce a RLS testy chrání profilová data členů, jediného
  vlastníka i okamžitou ztrátu přístupu po odebrání.

### 4. Destinace a místa — probíhá

- Dokončeno: interní model míst připravený na provider ID, adresu, souřadnice a
  dvojici provider/interní kategorie.
- Dokončeno: ruční vlastní místa se správou kategorií Nomadia a rolově
  omezeným přístupem.
- Dokončeno: nabíjecí místa jako samostatná kategorie v databázi, ručních
  formulářích, Mapbox normalizaci a mapových vrstvách; seznam kategorií a názvy
  sdílejí jeden aplikační kontrakt připravený na další rozšíření.
- Dokončeno: chráněné Mapbox Geocoding v6 vyhledávání adres a geografických
  míst, kontext zemí cesty, providerová normalizace a uložení permanentních
  výsledků do interního modelu.
- Dokončeno: serverové Geoapify hledání adres, názvů a POI s českými výsledky,
  kontextem zemí cesty, debounce/abort našeptávačem, klávesnicovým výběrem,
  Mapbox náhledem pinu, změnou navržené kategorie a normalizovaným uložením.
- Dokončeno: obecná RPC pro externí providery, uložení atribuce a původních
  kategorií, deduplikace v rámci cesty a zachování staré Mapbox RPC.
- Dokončeno: samostatná mapa celé cesty, číslované piny uložených míst,
  automatické přiblížení na všechny body a přístupný seznam míst včetně
  zřetelného přehledu záznamů bez souřadnic.
- Dokončeno: mapa konkrétního dne používá pouze místa propojená s timeline,
  zachovává jejich pořadí, zvýrazňuje vybraný bod a zobrazuje přímou spojnici
  plánovaného pořadí bez předstírání vypočítané navigační trasy.
- Dokončeno: mapa celé cesty nabízí přístupné vrstvy všech kategorií Nomadia,
  jejich reálné počty a společné filtrování pinů, seznamu, výběru i mapového
  výřezu.
- Zbývá: hromadná POI vrstva mapového výřezu a hledání podél trasy; nejsou
  součástí prvního Geoapify řezu.
- Návrh světadílu s možností ručního přepsání.
- Seznam míst, mapa celé cesty, její kategoriální vrstvy i mapa konkrétního dne
  jsou hotové.

### 5. Itinerář — probíhá

- Dokončeno: datované dny a celé nedatované plány se stavem, oblastí a
  rezervním příznakem.
- Dokončeno: přiřazení plánu ke konkrétnímu datu i vrácení mezi plány bez data.
- Dokončeno: ruční pořadí nedatovaných plánů, role owner/editor/viewer a režim
  archivované cesty pouze pro čtení.
- Dokončeno: detail dne a základní timeline aktivit, přesunů a poznámek s
  volitelným časem, poznámkou a atomickým pořadím.
- Dokončeno: volitelné propojení bodu timeline s interním místem stejné cesty.
- Dokončeno: přímé vyhledání Geoapify místa z detailu dne a jeho atomické
  uložení nebo opětovné použití spolu s novým propojeným bodem na konci
  timeline. Formulář sdílí našeptávač s uloženými místy, dovoluje změnit
  kategorii a doplnit čas i poznámku; původní výběr uloženého místa zůstává.
- Dokončeno: responzivní mapa dne s číslováním podle timeline, výřezem všech
  míst, výběrem bodu a odkazem zpět na odpovídající položku programu.
- Dokončeno: atomický přesun existujícího bodu na konec jiného datovaného nebo
  nedatovaného dne se zachováním místa, obsahu a metadat a s bezpečným
  přepočtem pořadí obou timeline.
- Dokončeno: owner/editor může na Mapbox mapě celé cesty nebo dne kliknutím
  vytvořit vlastní manual místo; před uložením vidí odlišený preview pin a z
  detailu dne může stejným atomickým RPC vytvořit i propojený bod timeline.
  Serverový Geoapify reverse geocoding předvyplní editovatelnou adresu, ale
  jeho selhání neblokuje uložení místa pouze se souřadnicemi.
- Zbývá: rozšířené kontextové údaje.

### 6. Rezervace po typech — probíhá

- Lokálně dokončen první vertikální řez ubytování: trip-scoped rezervace,
  chronologický přehled, souhrn nocí a plateb, přidání, detail, editace a
  bezpečné smazání bez odstranění uloženého místa.
- Owner/editor mohou propojit již uložené `trip_place` nebo použít stávající
  serverové Geoapify vyhledávání; normalizované externí místo se vytvoří nebo
  znovu použije a Mapbox zůstává rendererem náhledu.
- RLS zachovává owner/editor zápis, viewer čtení a read-only archiv. Přehled
  informativně hlásí mezery a překryvy v rámci termínu cesty.
- Platební údaje ubytování evidují celkovou cenu, již zaplacenou částku a
  volitelné datum splatnosti zbývající částky — stejné pole pokrývá celou
  plánovanou platbu i doplatek. Zbývající částka se neukládá duplicitně, ale počítá
  se jako `total_price - paid_amount`. Budget nyní tyto hodnoty čte přímo bez
  kopie a bez synchronizační tabulky.
- Zbývá propojení ubytování s dokumenty, body check-in/check-out v
  itineráři a checklistem; platební plán ani automatické úkoly nejsou součástí
  tohoto řezu.
- Lokálně dokončen první vertikální řez dopravy: `transport_bookings` s jedním
  až dvaceti atomicky ukládanými segmenty, chronologický přehled, souhrn,
  owner/editor CRUD a read-only viewer/archivovaný trip.
- Segmenty používají existující nebo přes serverové Geoapify vyhledávání nově
  normalizovaná `trip_places`, ukládají trip-local časy jako `timestamptz` a
  mají serverem přidělené deterministické pořadí. Smazání rezervace zachovává
  místa.
- Platební pole dopravy Budget stejně jako u ubytování přímo čte a
  jednotlivé segmenty jsou připravené pro pozdější odkazy v itineráři. Žádná
  automatická synchronizace zatím neexistuje.
- Zbývají aktivity a obecná rezervace se sdíleným kontraktem; u dopravy také
  dokumenty, boarding pass, import PDF, živé statusy, routing a notifikace.
- Vazby na itinerář, místo a dokument se přidávají vždy v malém řezu.

### 7. Rozpočet

- Lokálně dokončen první vertikální řez centrálního rozpočtu. Serverový read
  model skládá ruční `budget_items` s finančními údaji Ubytování a Dopravy bez
  kopírování zdrojových rezervací.
- Dashboard ukazuje odhad, skutečnost, zaplaceno a odvozený zůstatek po měnách,
  souhrny kategorií a čekající platby. Bez FX kurzu se různé měny nikdy
  nesčítají.
- Stabilní hlavní kategorie mají volitelnou podkategorii z centrálního
  typovaného katalogu. Databáze validuje povolenou dvojici kompozitním cizím
  klíčem a dashboard agreguje hlavní kategorii s jednoduchým podkategoriálním
  breakdownem.
- Owner/editor spravují pouze ruční položky; viewer a archivovaný trip jsou
  read-only. Automatické řádky odkazují editaci zpět na Ubytování nebo Dopravu.
- Další fáze: rozdělení mezi cestovatele, cena na osobu, společný účet, kdo komu
  dluží, uložené FX přepočty, více samostatných plateb a případné vlastní
  uživatelské podkategorie.
- Samostatné testy zaokrouhlování, FX historie a nevyvážených podílů přijdou s
  odpovídající další fází.

### 8. Dokumenty

- Lokálně dokončen první vertikální řez na route
  `/app/trips/{tripId}/documents`: privátní bucket `trip-documents`, metadata v
  `documents`, krátkodobé signed URL a owner/editor/viewer RLS pro tabulku i
  Storage objekty.
- Objekt používá cestu
  `trips/{trip_id}/documents/{document_id}/{safe_filename}`. Server i bucket
  povolují pouze PDF/JPG/PNG do 10 MB; aplikace navíc ověřuje signaturu obsahu.
- Dokument lze navázat na trip, ubytování, dopravu nebo activity itinerary item.
  Databázový trigger ověřuje, že cílová entita skutečně patří stejné cestě.
- `offline_enabled` je zatím pouze uživatelský záměr pro budoucí offline balík;
  soubor se do zařízení automaticky nestahuje.
- Další fáze: skutečný offline sync, OCR, import rezervací z e-mailu nebo PDF,
  automatické párování a případný audit přístupu. Veřejné sdílení není součástí
  plánovaného bezpečného základu.

### 9. Checklist

- Lokálně dokončen první vertikální řez na `/app/trips/{tripId}/checklist`:
  obecné `tasks` a samostatné `packing_items`, obojí trip-scoped a chráněné
  owner/editor/viewer RLS.
- Úkol podporuje kategorii, stav, prioritu, termín, přiřazení na existujícího
  trip travelera a volitelnou vazbu na accommodation, transport, document nebo
  itinerary item. Vazby i traveler jsou databázově ověřené proti stejnému tripu.
- Packing list ukládá kategorii, množství, osobu, zavazadlo a stav sbaleno;
  mobilní flow upřednostňuje velké rychlé checkboxy.
- Další fáze: automatické úkoly z linked entit, relativní termíny, notifikace,
  šablony checklistů a opakování. První řez nic negeneruje ani neplánuje na
  pozadí.

### 10. Offline trip

- Verze offline schématu a IndexedDB úložiště oddělené podle uživatele/tripu.
- Explicitní „Stáhnout trip“, stav balíčku a odhad velikosti.
- Outbox změn, bezpečná opakování, detekce konfliktů a srozumitelná obnova.
- Cache mapových dat pouze v mezích licence providera.

### 11. PWA dokončení a provozní připravenost

- Produkční ikony, offline fallback shell a update UX service workeru.
- Audit instalovatelnosti, přístupnosti, výkonu a mobilních safe areas.
- Telemetrie bez citlivých cestovních dat, zálohy a incidentní postupy.
- Až po samostatném rozhodnutí nasazení; Capacitor zůstává volitelná další fáze.

## Definition of Done každého řezu

- Akceptační scénář funguje na desktopu i mobilním viewportu.
- RLS a negativní autorizační testy pokrývají nové tabulky a storage.
- Nejsou přidaná tajemství; `.env.example` dokumentuje pouze potřebné názvy.
- `npm run lint`, `npm run typecheck`, `npm test` a `npm run build` procházejí.
- Produktová a technická dokumentace odpovídá skutečnému chování.
