# Globální Kalendář

`/app/calendar` je čtecí globální modul. Měsíc ukazuje pouze datované rozsahy
nearchivovaných cest. Agenda vzniká v aplikační vrstvě z cest, ubytování,
transportních segmentů, normalizovaných rozpočtových řádků a otevřených úkolů.

Loader používá RLS-scoped dotazy nad existujícími tabulkami. Neexistuje tabulka
`calendar_events`, nová migrace ani nová RLS politika. Budoucí fáze může přidat
archivní filtr, sdílitelný stav filtrů v URL a externí kalendářovou synchronizaci.
