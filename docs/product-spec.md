# Nomadio — produktová specifikace

## 1. Vize a rozsah

Nomadio je responzivní cestovatelská aplikace, ve které je každá cesta (trip)
samostatným bezpečnostním a datovým kontextem. Spojuje plánování před cestou s
praktickým používáním během cesty. Desktop je primární pro plánování, mobil pro
rychlou práci na místě.

První fáze dodává pouze technický základ. Nezahrnuje hotové přihlášení,
databázové schéma, mapu ani produkční moduly.

## 2. Uživatelé, přístup a sdílení

- Přihlášení probíhá přes Google OAuth zprostředkované Supabase Auth.
- Nově vytvořený trip je vždy soukromý.
- Trip lze sdílet registrovaným uživatelům v rolích `owner`, `editor` a
  `viewer`.
- Autorizační pravidla musí být vynucena na databázové vrstvě pomocí Row Level
  Security, nejen v uživatelském rozhraní.
- Všechny přístupné tripy jsou v jediné sekci **Moje cesty** bez rozdělení na
  vlastní a sdílené.
- Cestovatel je osoba evidovaná v tripu a nemusí být uživatelem aplikace.

## 3. Trip

Trip obsahuje název, termín, země, města, světadíl, cestovatele, hlavní měnu a
cover obrázek. Světadíl se automaticky navrhne podle destinace, uživatel jej ale
může ručně změnit. Veškeré související záznamy musí být jednoznačně přiřazené
ke konkrétnímu tripu.

## 4. Itinerář a místa

- Itinerář podporuje konkrétní dny s datem i plány bez data.
- Nedatovaný plán lze později přiřadit ke konkrétnímu dni.
- Místa se vyhledávají přes katalog mapového providera.
- U místa se ukládá provider ID, název, adresa, souřadnice, původní kategorie a
  interní kategorie Nomadia. Provider data se nesmí stát doménovým modelem.
- Ubytování, doprava, aktivity a další rezervace se propojují s itinerářem,
  mapou, rozpočtem a dokumenty.

## 5. Rozpočet

Rozpočet sleduje odhadovanou a skutečnou cenu, zaplaceno, zbývající částku,
cenu na osobu, plátce, rozdělení mezi cestovatele a společný účet. Výpočty musí
být deterministické, testované a pracovat s penězi bez ztráty přesnosti.

## 6. Dokumenty a soukromí

Dokument je soukromý a náleží tripu nebo konkrétní související entitě. Storage
musí používat privátní bucket, přístupová pravidla a časově omezené podepsané
URL. Metadata dokumentu a oprávnění se řídí přístupem k tripu.

## 7. Offline a platformy

- Uživatel si může zvolit stažení celého tripu pro offline použití.
- Offline balíček musí být verzovaný, svázaný s uživatelem a tripem a musí jít
  bezpečně odstranit při odhlášení nebo ztrátě přístupu.
- Synchronizace musí transparentně ukazovat stav, poslední úspěšnou synchronizaci
  a konflikty; automatické slučování nesmí způsobit tichou ztrátu dat.
- Aplikace je PWA a architektura nesmí bránit pozdějšímu zabalení přes Capacitor.

## 8. Vizuální a UX principy

Vizuál je luxusní tmavý, čistý a Apple-inspired. Používá střídmý glassmorphism,
silnou typografickou hierarchii a klidné plochy. Glow efekty jsou minimální a
dashboard nesmí být přeplněný. Rozhraní musí být přístupné, ovladatelné
klávesnicí a použitelné na dotykových zařízeních.

Závazné tokeny, komponenty, responzivní pravidla a používání značky popisuje
[`docs/design-system.md`](./design-system.md). Tento dokument je zdrojem pravdy
pro všechny nové produktové obrazovky.

## 9. Technologická omezení první fáze

Základ používá Next.js App Router, React, strict TypeScript, Tailwind CSS,
shadcn/ui, ESLint a Vitest. Supabase je budoucí provider databáze, autentizace a
storage; Mapbox je budoucí mapový provider. V této fázi se nevytváří Supabase ani
Vercel projekt, neprovádí se nasazení a nepoužívají se žádné skutečné klíče.

## 10. Kritéria přijetí základu

- Projekt lze lokálně nainstalovat a spustit bez skutečných přístupových údajů.
- Strict TypeScript, lint, testy a produkční build procházejí.
- Existují oddělené hranice doménových modulů a dokumentovaný implementační plán.
- Existuje základ tmavého design systému a responzivní, nefunkční foundation UI.
- App Router generuje PWA manifest a produkce registruje minimální service worker
  bez předčasné strategie cachování aplikačních dat.
