# Nomadio

Bezpečný technický základ responzivní cestovatelské aplikace. Každý trip bude
samostatným kontextem pro itinerář, místa, rezervace, rozpočet, dokumenty,
checklist a offline data.

Aktuální fáze obsahuje pouze foundation UI, architektonické hranice a lokální
vývojové prostředí. Supabase, Google OAuth, Mapbox ani produkční nasazení nejsou
aktivované.

## Lokální spuštění

Požadavkem je podporovaná LTS verze Node.js a npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Aplikace bude dostupná na [http://localhost:3000](http://localhost:3000).
Prázdné hodnoty v `.env.local` jsou pro foundation fázi v pořádku.

## Kontroly kvality

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Dokumentace

- [Produktová specifikace](docs/product-spec.md)
- [Implementační plán](docs/implementation-plan.md)
- [Pravidla pro další práci](AGENTS.md)

Skutečné klíče nikdy nepatří do repozitáře. Externí projekty a nasazení se
zakládají pouze po výslovném schválení další fáze.
