# Nomadio — designový systém

Tento dokument je zdrojem pravdy pro vizuální jazyk Nomadia. Referenční
návrhy značky a produktového rozhraní určují směr celé aplikace; jednotlivé
obrazovky je nepřebírají doslova, ale skládají je ze stejných tokenů,
komponent a pravidel.

## Charakter značky

Nomadio působí klidně, prémiově a účelně. Tmavé rozhraní vytváří prostor pro
fotografie a data o cestě, fialový akcent vede pozornost a jemné světlo
komunikuje aktivní stav. Rozhraní nesmí působit jako neonová herní aplikace ani
jako hustý administrátorský dashboard.

## Barvy

| Role | Hodnota | Použití |
| --- | --- | --- |
| Nomadio violet | `#7B61FF` | primární akce, aktivní navigace, klíčové hodnoty |
| Soft violet | `#A78BFF` | hover, focus a světelný akcent |
| Deep indigo | `#1E2346` | vybrané plochy a fialově tónované stavy |
| Graphite | `#2B2F3A` | sekundární plochy a ovládací prvky |
| Slate | `#525768` | tlumený text a ikony |
| Cloud | `#E6E9F2` | primární text na tmavém pozadí |

Sémantické stavy používají vlastní zelenou, oranžovou a červenou. Fialová
nesmí nahrazovat význam úspěchu, varování nebo chyby.

## Povrchy a hloubka

- Základ je modročerný, nikoli čistě černý.
- Karty používají průsvitný tmavý povrch, studený jednobodový okraj a jemné
  vnitřní světlo.
- Glassmorphism se používá na navigaci, překryvy a hlavní kontejnery; běžný
  obsah má zůstat čitelný i bez rozostření pozadí.
- Glow patří pouze k primární akci, aktivní navigaci, focus stavu a výjimečně
  k důležitému bodu na mapě nebo časové ose.

## Typografie

Preferované písmo značky je Satoshi. Dokud projekt neobsahuje licencované
fontové soubory, používá aplikace metricky stabilní Geist jako fallback.
Nadpisy mají těsnější tracking, běžný text zůstává klidný a dobře čitelný.
Velká písmena s rozšířeným trackingem se používají pouze pro malé eyebrow
popisky a metadata značky.

## Tvar a komponenty

- Základní radius je `14px`; velké panely používají `22–28px`.
- Primární tlačítka mají fialový gradient nebo plnou fialovou, jasný focus a
  pouze mírný glow.
- Navigace, segmentované přepínače, chips a kompaktní ikonová tlačítka sdílejí
  stejný aktivní stav.
- Fotografie mají konzistentní ořez, zaoblení a tmavý gradient pod textem.
- Ikony jsou liniové a významově jednoznačné. Dekorativní ikonografie nesmí
  soutěžit s obsahem.

## Responzivní chování

- Desktop upřednostňuje plánování: postranní navigaci, širší obsah a souběžné
  kontextové panely.
- Mobil upřednostňuje rychlou práci na cestě: spodní navigaci, jednu hlavní
  kolonu a dotykové cíle nejméně `44px`.
- Mobil není zmenšený desktop. Informační hierarchie zůstává stejná, ale méně
  důležité panely se skládají pod hlavní obsah nebo otevírají na vyžádání.

## Přístupnost

- Text a ovládací prvky musí splnit minimálně WCAG AA kontrast.
- Focus je vždy viditelný a nespoléhá pouze na glow.
- Barva nikdy není jediným nositelem stavu.
- Animace respektují `prefers-reduced-motion`.
- Rozostření a průhlednost mají neprůhledný fallback.

## Základní stavebnice

- `BrandMark` — jednotná značka a wordmark.
- `Surface` — panel, karta nebo tlumená vnořená plocha.
- `StatusPill` — stavový nebo kategorický štítek.
- `Button` — primární, sekundární, outline, ghost a destruktivní akce.

Nová produktová obrazovka má nejprve použít tuto stavebnici. Nový lokální styl
je oprávněný pouze tehdy, když jej nelze vyjádřit existujícím tokenem nebo
variantou a má jasný opakovatelný význam.
