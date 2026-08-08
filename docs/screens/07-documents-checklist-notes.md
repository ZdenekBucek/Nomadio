# Dokumenty, checklist a poznámky

## Dokumenty

Dokument je soukromý a patří konkrétní cestě. Může být navázaný na ubytování,
dopravu, aktivitu nebo celý trip. První řez záměrně nepřidává vazbu na
rozpočtovou položku.

Typický obsah:

- letenky a jízdenky,
- rezervace a vouchery,
- cestovní pojištění,
- víza a bezpečné pasové poznámky,
- faktury,
- instrukce k check-inu,
- fotografie nebo screenshot důležité informace.

Zobrazení obsahuje kategorie, důležitost, zdrojovou entitu a offline stav.
První řez přijímá PDF, JPG a PNG do 10 MB. Citlivý obsah není dostupný přes
veřejnou nebo trvalou URL.

### Implementovaný první řez

Route `/app/trips/{tripId}/documents` nabízí souhrn všech, důležitých a pro
offline vybraných dokumentů, filtrování podle kategorie a karty s typem,
velikostí a vazbou. Detail `/documents/{documentId}` vytváří přes přihlášenou
session krátkodobý podepsaný odkaz pro náhled a stažení.

Soubor je uložen v privátním bucketu `trip-documents` pod cestou
`trips/{trip_id}/documents/{document_id}/{safe_filename}`. Bucket i server
omezují MIME a velikost; server navíc kontroluje signaturu obsahu. Metadata v
`documents` ukládají původní typ, velikost, kategorii, důležitost, offline
záměr a volitelnou polymorfní vazbu. Trigger ověřuje, že ubytování, doprava nebo
activity itinerary item patří stejnému tripu.

Owner/editor mohou uploadovat, upravovat metadata a mazat. Viewer může pouze
číst, zobrazit a stáhnout. Archivovaná cesta je read-only. Stejná membership
pravidla chrání `storage.objects`; bucket není veřejný.

### Offline

Uživatel zatím pouze označí `offline_enabled`. Skutečné stažení, šifrovaná
lokální cache, verze balíku a odvolání přístupu patří do samostatné offline fáze.

### Později

Import PDF nebo obrázku může později navrhnout data rezervace, ale nic nesmí
uložit bez kontroly uživatele. OCR, AI čtení, import z e-mailu a automatické
párování nejsou součástí prvního řezu. Veřejné sdílení se neimplementuje.

## Checklist

Checklist pokrývá:

- úkoly před odjezdem,
- platby a rezervace,
- věci ke stažení offline,
- balicí seznam,
- úkoly během nebo po cestě.

Položka může mít název, popis, kategorii, stav, prioritu, termín, přiřazeného
uživatele a vazbu na jinou entitu. Balicí položka může navíc obsahovat osobu,
množství, zavazadlo a stav sbaleno.

Na přehledu cesty se ukazuje pouze progres a několik nejdůležitějších úkolů.

## Poznámky

Poznámky slouží pro volný obsah k celé cestě nebo konkrétní entitě:

- tipy,
- restaurace a místa „možná navštívit“,
- instrukce,
- kontakty,
- volný plán.

Poznámku lze připnout. Uložené místo s mapovými daty se nemá redukovat na
obyčejnou poznámku; patří do katalogu míst.

## MVP

- privátní upload PDF a obrázků,
- kategorie a vazba na entitu,
- náhled a offline příznak,
- jednoduché úkoly, priorita a dokončení,
- základní packing list,
- volné a připnuté poznámky.
