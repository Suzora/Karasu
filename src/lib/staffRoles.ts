/** AniList's commonest English staff roles and occupations, each mapped to its i18n key; the rest stay as written. */
const ROLE_KEYS: Record<string, string> = {
  Director: "staffRole.director",
  "Assistant Director": "staffRole.assistantDirector",
  "Episode Director": "staffRole.episodeDirector",
  "Original Creator": "staffRole.originalCreator",
  "Original Story": "staffRole.originalStory",
  "Original Character Design": "staffRole.originalCharacterDesign",
  "Story & Art": "staffRole.storyArt",
  Story: "staffRole.story",
  Art: "staffRole.art",
  "Series Composition": "staffRole.seriesComposition",
  Script: "staffRole.script",
  "Character Design": "staffRole.characterDesign",
  Music: "staffRole.music",
  "Animation Director": "staffRole.animationDirector",
  "Chief Animation Director": "staffRole.chiefAnimationDirector",
  "Key Animation": "staffRole.keyAnimation",
  Storyboard: "staffRole.storyboard",
  "Art Director": "staffRole.artDirector",
  "Sound Director": "staffRole.soundDirector",
  Producer: "staffRole.producer",
  "Theme Song Performance": "staffRole.themeSong",
  "Theme Song Composition": "staffRole.themeSongComposition",
  "Theme Song Lyrics": "staffRole.themeSongLyrics",
  Translator: "staffRole.translator",
  Lettering: "staffRole.lettering",
  Assistant: "staffRole.assistant",
  "Voice Actor": "staffRole.voiceActor",
  Animator: "staffRole.animator",
  Mangaka: "staffRole.mangaka",
  Composer: "staffRole.composer",
  Singer: "staffRole.singer",
  Illustrator: "staffRole.illustrator",
  Novelist: "staffRole.novelist",
};

/** A role split into the key its known part maps to, if any, and the bracketed qualifier AniList appends ("(OP)"). */
export function staffRoleParts(role: string): { key: string | null; qualifier: string } {
  const m = /^(.*?)\s*(\([^)]*\))?\s*$/.exec(role.trim());
  const base = m?.[1] ?? role;
  return { key: ROLE_KEYS[base] ?? null, qualifier: m?.[2] ?? "" };
}

/** The role in the user's language where its main part is known, the qualifier kept; otherwise AniList's own text. */
export function staffRoleLabel(role: string, t: (key: string) => string): string {
  const { key, qualifier } = staffRoleParts(role);
  if (!key) return role;
  return qualifier ? `${t(key)} ${qualifier}` : t(key);
}

/** AniList's English language names as BCP 47 tags, so the browser can name each in the user's language. */
const LANGUAGE_TAGS: Record<string, string> = {
  Japanese: "ja",
  English: "en",
  Korean: "ko",
  Chinese: "zh",
  Spanish: "es",
  French: "fr",
  German: "de",
  Italian: "it",
  Portuguese: "pt",
  "Portuguese (BR)": "pt-BR",
  Hungarian: "hu",
  Hebrew: "he",
  Arabic: "ar",
  Filipino: "fil",
  Tagalog: "tl",
  Catalan: "ca",
  Finnish: "fi",
  Turkish: "tr",
  Dutch: "nl",
  Swedish: "sv",
  Thai: "th",
  Indonesian: "id",
  Vietnamese: "vi",
  Norwegian: "no",
  Polish: "pl",
  Russian: "ru",
  Czech: "cs",
  Danish: "da",
  Greek: "el",
  Ukrainian: "uk",
};

/** A language AniList names in English, named in `locale` instead; an unknown name stays as AniList wrote it. */
export function languageName(english: string, locale: string): string {
  const tag = LANGUAGE_TAGS[english];
  if (!tag) return english;
  try {
    return new Intl.DisplayNames([locale], { type: "language" }).of(tag) ?? english;
  } catch {
    return english;
  }
}
