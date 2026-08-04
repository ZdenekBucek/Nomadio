# ADR 001: Synchronizace profilu z Supabase Auth

## Stav

Přijato pro první autentizační celek.

## Kontext

Google OAuth vytváří autoritativní identitu v `auth.users`, zatímco aplikace
potřebuje vlastní, přes RLS dostupný profil v `public.profiles`. Profil musí
vzniknout i tehdy, když klient po OAuth callbacku zavře stránku nebo selže.

## Zvažované varianty

1. Upsert profilu pouze v callback route. Je jednoduchý, ale profil nemusí
   vzniknout při jiném způsobu vytvoření uživatele a úspěch závisí na klientském
   toku.
2. Klientský upsert po přihlášení. Respektuje RLS, ale zbytečně přenáší
   integritní odpovědnost do UI a může skončit v neúplném stavu.
3. Databázový trigger nad `auth.users`. Drží vazbu atomicky u identity a funguje
   pro OAuth i budoucí autentizační metody.

## Rozhodnutí

Používáme databázový trigger `on_auth_user_profile_sync`. Funkce běží jako
`SECURITY DEFINER`, má prázdný `search_path`, používá plně kvalifikované názvy a
nemá udělené právo spuštění rolím `anon` ani `authenticated`. Po insertu vytvoří
profil; při změně e-mailu nebo OAuth metadat synchronizuje e-mail, zobrazované
jméno a avatar. Migrace zároveň doplní existující Auth uživatele.

Aplikační čtení a změny stále probíhají jako přihlášený uživatel a podléhají
RLS. Trigger neslouží jako obecný způsob obcházení RLS.

## Důsledky

- Selhání triggeru může zablokovat vytvoření Auth uživatele, proto je součástí
  celku pgTAP test a migrace musí být ověřena v lokálním Supabase stacku.
- Uživatelsky upravené jméno nebo avatar mohou být při budoucí změně Google
  metadat přepsané. Oddělení vlastního a providerového profilu je případné
  budoucí rozhodnutí, ne součást tohoto celku.
