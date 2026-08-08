# Nomadio

Bezpečná responzivní cestovatelská aplikace ve vertikálním vývoji. Každý trip je
samostatným kontextem pro itinerář, místa, rezervace, rozpočet, dokumenty,
checklist a offline data.

Aktuální lokální stav obsahuje autentizaci, soukromé a sdílené cesty, itinerář,
uložená místa, Mapbox mapy, serverové Geoapify vyhledávání a první CRUD řez
ubytování a vícesegmentové dopravy. Přesný stav a čekající práce jsou v
implementačním plánu.

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
