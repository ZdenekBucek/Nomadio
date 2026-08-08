# Globální Přehled

`/app` je globální Travel Command Center, nikoli druhý seznam cest. Hero prioritizuje právě probíhající cestu, jinak nejbližší budoucí, a doplňuje ji kompaktní připraveností. Využívá stejné RLS-filtrované tripy jako Kalendář a normalizátor `buildCalendarAgenda`; agreguje pouze dostupné zdroje (ubytování, dopravu, rozpočet, checklist a dokumenty).

Attention ukazuje jen odvoditelné stavy: prošlé platby, mezery či překryvy ubytování, prošlé úkoly a důležité dokumenty bez offline příznaku. Finance používají Budget souhrny po jednotlivých měnách a další událost sdílenou Calendar Agenda normalizaci. Budoucí Travel Mode může změnit prioritu bloků, ale zatím nevzniká nový datový model ani offline indikátor.
