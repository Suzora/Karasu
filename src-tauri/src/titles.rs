//! Which spelling of a title Rust composes with, in the title language the frontend mirrors into kv.

use crate::db::Db;
use serde_json::Value;

/// The kv key the frontend mirrors its title language into.
pub const TITLE_LANGUAGE_KEY: &str = "title_language";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TitleLanguage {
    English,
    Romaji,
    Native,
}

impl TitleLanguage {
    /// Anything unrecognised is English, the order every composed text used before the setting existed.
    pub fn parse(code: Option<&str>) -> Self {
        match code {
            Some("romaji") => TitleLanguage::Romaji,
            Some("native") => TitleLanguage::Native,
            _ => TitleLanguage::English,
        }
    }
}

/// The title language to compose with, from the mirror.
pub fn title_language(db: &Db) -> TitleLanguage {
    TitleLanguage::parse(db.kv_get(TITLE_LANGUAGE_KEY).as_deref())
}

/// The variant in the chosen language, else the next one present in that language's order; blank counts as missing.
pub fn pick<'a>(
    lang: TitleLanguage,
    romaji: Option<&'a str>,
    english: Option<&'a str>,
    native: Option<&'a str>,
) -> Option<&'a str> {
    let order = match lang {
        TitleLanguage::English => [english, romaji, native],
        TitleLanguage::Romaji => [romaji, english, native],
        TitleLanguage::Native => [native, romaji, english],
    };
    order.into_iter().flatten().find(|s| !s.trim().is_empty())
}

/// `pick` over AniList's `title` object, as the cached list and every alert query carry it.
pub fn pick_json(lang: TitleLanguage, title: Option<&Value>) -> Option<String> {
    let get = |key: &str| title.and_then(|t| t.get(key)).and_then(Value::as_str);
    pick(lang, get("romaji"), get("english"), get("native")).map(str::to_string)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    const ROMAJI: &str = "Sousou no Frieren";
    const ENGLISH: &str = "Frieren: Beyond Journey's End";
    const NATIVE: &str = "葬送のフリーレン";

    #[test]
    fn each_language_comes_first_when_present() {
        let all = |lang| pick(lang, Some(ROMAJI), Some(ENGLISH), Some(NATIVE));
        assert_eq!(all(TitleLanguage::English), Some(ENGLISH));
        assert_eq!(all(TitleLanguage::Romaji), Some(ROMAJI));
        assert_eq!(all(TitleLanguage::Native), Some(NATIVE));
    }

    #[test]
    fn a_missing_or_blank_variant_falls_back_in_that_languages_order() {
        assert_eq!(pick(TitleLanguage::English, Some(ROMAJI), Some(" "), Some(NATIVE)), Some(ROMAJI));
        assert_eq!(pick(TitleLanguage::Romaji, None, Some(ENGLISH), Some(NATIVE)), Some(ENGLISH));
        assert_eq!(pick(TitleLanguage::Native, Some(ROMAJI), Some(ENGLISH), None), Some(ROMAJI));
        assert_eq!(pick(TitleLanguage::Native, None, Some(ENGLISH), Some("")), Some(ENGLISH));
        assert_eq!(pick(TitleLanguage::Romaji, None, None, None), None);
    }

    #[test]
    fn the_json_shape_reads_the_same_way() {
        let title = json!({ "romaji": ROMAJI, "english": null, "native": NATIVE });
        assert_eq!(pick_json(TitleLanguage::English, Some(&title)).as_deref(), Some(ROMAJI));
        assert_eq!(pick_json(TitleLanguage::Native, Some(&title)).as_deref(), Some(NATIVE));
        assert_eq!(pick_json(TitleLanguage::Romaji, None), None);
    }

    #[test]
    fn an_unknown_mirror_reads_as_english() {
        assert_eq!(TitleLanguage::parse(Some("romaji")), TitleLanguage::Romaji);
        assert_eq!(TitleLanguage::parse(Some("native")), TitleLanguage::Native);
        assert_eq!(TitleLanguage::parse(Some("klingon")), TitleLanguage::English);
        assert_eq!(TitleLanguage::parse(None), TitleLanguage::English);
    }

    #[test]
    fn the_mirror_round_trips_through_kv() {
        let db = crate::db::tests::mem_db();
        assert_eq!(title_language(&db), TitleLanguage::English);
        db.kv_set(TITLE_LANGUAGE_KEY, "native").unwrap();
        assert_eq!(title_language(&db), TitleLanguage::Native);
    }
}
