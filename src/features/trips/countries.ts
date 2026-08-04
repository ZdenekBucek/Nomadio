import type { ContinentCode } from "@/lib/supabase/database.types";

export const continentLabels: Record<ContinentCode, string> = {
  africa: "Afrika",
  antarctica: "Antarktida",
  asia: "Asie",
  europe: "Evropa",
  north_america: "Severní Amerika",
  oceania: "Oceánie",
  south_america: "Jižní Amerika",
};

const countryCodesByContinent: Record<ContinentCode, string> = {
  africa:
    "AO BF BI BJ BW CD CF CG CI CM CV DJ DZ EG EH ER ET GA GH GM GN GQ GW KE KM LR LS LY MA MG ML MR MU MW MZ NA NE NG RE RW SC SD SH SL SN SO SS ST SZ TD TG TN TZ UG YT ZA ZM ZW",
  antarctica: "AQ BV GS HM TF",
  asia:
    "AE AF AM AZ BD BH BN BT CN GE HK ID IL IN IQ IR JO JP KG KH KP KR KW KZ LA LB LK MM MN MO MV MY NP OM PH PK PS QA SA SG SY TH TJ TL TM TR TW UZ VN YE",
  europe:
    "AD AL AT AX BA BE BG BY CH CY CZ DE DK EE ES FI FO FR GB GG GI GR HR HU IE IM IS IT JE LI LT LU LV MC MD ME MK MT NL NO PL PT RO RS RU SE SI SJ SK SM UA VA",
  north_america:
    "AG AI AW BB BL BM BQ BS BZ CA CR CU CW DM DO GD GL GP GT HN HT JM KN KY LC MF MQ MS MX NI PA PM PR SV SX TC TT US VC VG VI",
  oceania:
    "AS AU CC CK CX FJ FM GU KI MH MP NC NF NR NU NZ PF PG PN PW SB TK TO TV UM VU WF WS",
  south_america: "AR BO BR CL CO EC FK GF GY PE PY SR UY VE",
};

const displayNames = new Intl.DisplayNames(["cs"], { type: "region" });

export type CountryOption = {
  code: string;
  continent: ContinentCode;
  name: string;
};

export const countryOptions: CountryOption[] = Object.entries(
  countryCodesByContinent,
).flatMap(([continent, codes]) =>
  codes.split(" ").map((code) => ({
    code,
    continent: continent as ContinentCode,
    name: displayNames.of(code) ?? code,
  })),
).sort((left, right) => left.name.localeCompare(right.name, "cs"));

export function getCountryOption(code: string) {
  return countryOptions.find((country) => country.code === code.toUpperCase());
}

export function countryFlag(code: string | null) {
  if (!code || !/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code].map((letter) => 127397 + letter.charCodeAt(0)));
}
