# Itinerář, plány bez data a detail dne

## Základní model

Itinerář má dva rovnocenné typy dnů:

- **konkrétní dny** přiřazené k datu,
- **plány dnů bez data**, které lze později přiřadit do kalendáře.

Plán bez data není jednotlivý nezařazený bod. Je to celý připravený den, například
„Soul — paláce a Bukchon“ nebo „Rezervní den při dešti“.

## Hlavní zobrazení

Uživatel může přepínat:

- Timeline
- Kalendář
- Mapa

### Desktop

Levý panel obsahuje kalendář cesty a nepřiřazené plány. Hlavní plocha zobrazuje
detail vybraného dne jako vertikální časovou osu. Mapa nebo detail vybraného
bodu mohou být v pravém kontextovém panelu.

### Mobil

Otevírá se dnešní nebo nejbližší den. Nahoře jsou šipky předchozí/další, datum,
název dne, město a offline stav. Primární je jedna vertikální timeline a dobře
dostupná akce **+ Přidat bod**.

## Den

Den může mít:

- datum nebo prázdné datum,
- vlastní název,
- město či oblast,
- stav plán/potvrzeno/dokončeno,
- cover,
- příznak šablony nebo rezervního plánu,
- pořadí.

Akce nad celým dnem:

- přejmenovat,
- přiřadit nebo změnit datum,
- vrátit mezi plány bez data,
- duplikovat,
- uložit jako šablonu,
- označit jako rezervní,
- zobrazit na mapě,
- označit jako dokončený.

## Timeline dne

Položky mohou být s přesným časem i bez něj. Mezi aktivitami lze vložit přesun
nebo prostou poznámku. Typy položek:

- aktivita,
- restaurace nebo jídlo,
- doprava/přesun,
- ubytování,
- rezervace,
- poznámka,
- volný čas,
- checkpoint.

Položka může obsahovat název, místo, čas od/do, délku, poznámku, cenu, měnu,
rezervační stav, odkaz, dokument a fotografii. Pole se zobrazují kontextově.

## Přidání bodu

Po akci **+ Přidat bod** uživatel zvolí:

- místo,
- přesun,
- poznámku,
- ubytování,
- rezervaci,
- volný čas.

Výchozí volbou je místo. Po vyhledání a výběru mapového výsledku se doplní
interní záznam místa, pin na mapě a navržená kategorie. Uživatel doplňuje hlavně
čas, poznámku, cenu a rezervaci.

## Kontextová pole

- Hotel: check-in, check-out, snídaně, rezervace, platba.
- Restaurace: čas rezervace, počet osob, kuchyně, poznámka.
- Letiště/nádraží: spoj, terminál, gate/nástupiště, sedadlo, zavazadlo.
- Památka: vstupné, otevírací doba, rezervovaný čas, vstupenka.
- Vlastní bod: název, souřadnice a poznámka.

Kontextový formulář může používat společnou entitu, ale nesmí zobrazovat
nesouvisející pole.

## Přesuny

Po druhém místě lze nabídnout přesun z předchozího bodu:

- pěšky,
- veřejnou dopravou,
- autem,
- vlakem,
- letecky,
- vlastní přesun.

Systém může navrhnout vzdálenost a dobu, uživatel je může upravit. Budoucí
kontroly upozorní na geograficky nelogické pořadí nebo nedostatek času, ale
nesmí plán automaticky přeuspořádat bez souhlasu.

## Přesouvání

Na desktopu je podporovaný drag-and-drop pro pořadí položek, celé dny a plány
bez data. Vždy musí existovat explicitní alternativa v menu, zejména na mobilu.

## Travel mode dne

Zvýrazňuje:

- aktuální bod,
- následující bod a čas do odchodu,
- způsob a délku přesunu,
- navigaci,
- vstupenku nebo rezervaci,
- adresu a offline dostupnost.

## MVP

- konkrétní dny i plány bez data,
- přiřazení plánu k datu,
- timeline,
- aktivity, přesuny a poznámky,
- vyhledání místa a pin,
- změna pořadí a přesun mezi dny,
- uložená nezařazená místa,
- základní mobilní Travel view.

## Stav implementace

Dokončené řezy pokrývají celé datované i nedatované dny, základní timeline
aktivit, přesunů a poznámek, volitelné propojení bodu s interním místem a
atomický přesun existujícího bodu na konec jiného dne. Přesun zachovává obsah,
čas, poznámku i vazbu na místo a je dostupný pouze ownerovi/editorovi aktivní
cesty.
Body mají volitelný čas, textovou poznámku a ruční pořadí. Detail dne obsahuje
responzivní Mapbox mapu: piny odpovídají pořadí propojených bodů timeline,
vybraný bod odkazuje zpět na program a přímá spojnice znázorňuje pouze plánované
pořadí, nikoliv vypočítanou trasu. Body bez místa nebo bez souřadnic jsou
zřetelně uvedené. Zatím nejsou implementované kontextové údaje rezervací,
drag-and-drop, navigační trasa ani Travel mode.
