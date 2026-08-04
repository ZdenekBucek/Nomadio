# Nomadio — doporučený implementační plán

Plán postupuje po malých vertikálních celcích. Každý celek má dodat jednu
ověřitelnou uživatelskou hodnotu včetně databázové migrace, RLS politik,
rozhraní, chybových stavů a testů. Další celek nezačíná skrytým rozšiřováním
předchozího.

## Technická rozhodnutí

1. **Feature-first modulární monolit.** Jedna Next.js aplikace s doménami v
   `src/features` je pro první produkt jednodušší než mikroservisy a zachovává
   možnost pozdějšího oddělení providerů.
2. **Supabase jako autoritativní backend.** PostgreSQL drží relační data,
   Supabase Auth identitu a privátní Storage soubory. RLS je povinná součást
   každé migrace.
3. **Provider adaptéry.** Mapbox výsledky se při uložení mapují na interní model.
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

### 1. Identita a aplikační shell — probíhá

- Dokončeno a integračně ověřeno: verzovaná migrace profilu, RLS, Google OAuth,
  callback, serverová session, lokální odhlášení a chráněná `/app` route.
- Migrace je aplikovaná lokálně i ve vzdáleném projektu Nomadio; opakované
  přihlášení zachovává jediný profil a celý OAuth tok prošel v jednom prohlížeči.
- Vizuální jazyk Nomadia je zdokumentovaný a převedený do globálních tokenů a
  základních komponent, které jsou závazné pro nový aplikační shell.
- Minimální navigační shell pro desktop a mobil zůstává samostatným malým řezem.
- Chování po expiraci session ověřit integračně proti běžícímu Supabase stacku.

### 2. Soukromý trip a „Moje cesty“

- Schéma `trips`, `trip_members` a základní RLS.
- Vytvoření soukromého tripu a společný seznam vlastních i sdílených tripů.
- Detail s názvem, termínem, destinacemi, měnou a coverem bez dalších modulů.

### 3. Sdílení a cestovatelé

- Pozvánky registrovaných uživatelů a role owner/editor/viewer.
- Samostatní cestovatelé, kteří nemusí mít účet.
- Testovací matice oprávnění pro čtení, zápis, sdílení a odebrání přístupu.

### 4. Destinace a místa

- Mapbox adapter pro vyhledání a normalizaci míst.
- Uložení provider ID, adresy, souřadnic a dvojice provider/interní kategorie.
- Návrh světadílu s možností ručního přepsání.
- Seznam míst jako první krok; interaktivní mapa až v navazujícím řezu.

### 5. Itinerář

- Datované dny a nedatované plány.
- Přesun nedatovaného plánu ke konkrétnímu dni.
- Propojení položky s uloženým místem a základní časové řazení.

### 6. Rezervace po typech

- Nejprve ubytování jako celý vertikální řez.
- Poté doprava, aktivity a obecná rezervace se sdíleným kontraktem.
- Vazby na itinerář, místo a dokument se přidávají vždy v malém řezu.

### 7. Rozpočet

- Peněžní hodnoty v nejmenších jednotkách měny a explicitní kód měny.
- Odhad/skutečnost, zaplaceno/zbývá a plátce.
- Rozdělení mezi cestovatele, cena na osobu a společný účet.
- Samostatné testy zaokrouhlování, změn měny a nevyvážených podílů.

### 8. Dokumenty

- Privátní bucket a RLS/signed URL tok.
- Upload k tripu, následně vazby na rezervace a další entity.
- Limity typu a velikosti, bezpečné názvy, mazání a audit přístupu.

### 9. Checklist

- Jednoduché položky na úrovni tripu, řazení a dokončení.
- Teprve poté přiřazení cestovateli, šablony nebo opakování.

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
