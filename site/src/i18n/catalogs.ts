import { en, type Messages } from "./en";
import type { Lang } from "./languages";
import de from "./locales/de";
import fr from "./locales/fr";
import fr_CA from "./locales/fr-CA";
import es from "./locales/es";
import es_419 from "./locales/es-419";
import it from "./locales/it";
import pt from "./locales/pt";
import pt_BR from "./locales/pt-BR";
import nl from "./locales/nl";
import pl from "./locales/pl";
import cs from "./locales/cs";
import sk from "./locales/sk";
import hu from "./locales/hu";
import ro from "./locales/ro";
import sv from "./locales/sv";
import da from "./locales/da";
import nb from "./locales/nb";
import fi from "./locales/fi";
import el from "./locales/el";
import ru from "./locales/ru";
import uk from "./locales/uk";
import bg from "./locales/bg";
import hr from "./locales/hr";
import sr_Latn from "./locales/sr-Latn";
import sl from "./locales/sl";
import tr from "./locales/tr";
import lt from "./locales/lt";
import lv from "./locales/lv";
import et from "./locales/et";
import ja from "./locales/ja";
import ko from "./locales/ko";
import zh_Hans from "./locales/zh-Hans";
import zh_Hant from "./locales/zh-Hant";
import vi from "./locales/vi";
import th from "./locales/th";
import id from "./locales/id";
import ms from "./locales/ms";
import fil from "./locales/fil";
import hi from "./locales/hi";

/** Every catalog by language; a language without one is a type error. Server only: a page carries its own catalog inline. */
export const CATALOGS: Record<Lang, Messages> = {
  en,
  de: de,
  fr: fr,
  "fr-CA": fr_CA,
  es: es,
  "es-419": es_419,
  it: it,
  pt: pt,
  "pt-BR": pt_BR,
  nl: nl,
  pl: pl,
  cs: cs,
  sk: sk,
  hu: hu,
  ro: ro,
  sv: sv,
  da: da,
  nb: nb,
  fi: fi,
  el: el,
  ru: ru,
  uk: uk,
  bg: bg,
  hr: hr,
  "sr-Latn": sr_Latn,
  sl: sl,
  tr: tr,
  lt: lt,
  lv: lv,
  et: et,
  ja: ja,
  ko: ko,
  "zh-Hans": zh_Hans,
  "zh-Hant": zh_Hant,
  vi: vi,
  th: th,
  id: id,
  ms: ms,
  fil: fil,
  hi: hi,
};
