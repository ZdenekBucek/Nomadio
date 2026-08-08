# Dokumenty

První vertikální řez je dostupný na `/app/trips/{tripId}/documents`. Metadata
jsou v trip-scoped tabulce `documents`, binární obsah v privátním Supabase
Storage bucketu `trip-documents`.

## Storage a přístup

- Kanonická cesta je
  `trips/{trip_id}/documents/{document_id}/{safe_filename}`.
- Bucket není veřejný. Náhled a stažení používají podepsaný odkaz s životností
  pět minut, vytvořený přes přihlášenou uživatelskou session.
- Owner/editor mohou číst, nahrávat a mazat; viewer pouze čte. Archivovaný trip
  je read-only. Pravidla jsou vynucena zvlášť na `documents` a
  `storage.objects`.
- Nepoužívá se service-role klíč ani veřejná URL.

## Validace a vazby

Server Action přijímá PDF/JPG/PNG do 10 MB, kontroluje MIME i základní magickou
signaturu a vytváří bezpečný filename. Pokud se po Storage uploadu nepodaří
zapsat metadata, nově nahraný objekt se kompenzačně odstraní.

Dokument může patřit celé cestě nebo odkazovat na `accommodation`, `transport`
či activity `itinerary_item`. Databázový trigger ověřuje stejné `trip_id`.
Příznak `offline_enabled` zatím pouze eviduje záměr uživatele.

## Další fáze

Nejsou implementované OCR, AI extrakce, import z e-mailu, automatické párování,
veřejné sdílení ani skutečný offline balík. Offline fáze musí řešit citlivou
lokální cache, verzi balíku a odstranění dat při odhlášení či ztrátě členství.
