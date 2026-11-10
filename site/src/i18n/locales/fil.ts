import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Isang modernong tracker ng anime at manga para sa AniList",
    description:
      "Ang Karasu ay libre at open-source na tracker ng anime at manga na ginawa para lang sa AniList. Napapansin nito ang pinapanood mo — at sa Windows, ang binabasa mo — at pinapanatiling updated ang progress mo sa AniList. Windows, Linux, at Android.",
    notFoundTitle: "Hindi nahanap ang pahina — Karasu",
  },
  skip: "Lumaktaw sa nilalaman",
  nav: {
    label: "Pangunahing nabigasyon",
    home: "Karasu — bumalik sa itaas",
    changes: "Ano ang nagbago",
    screenshots: "Mga screenshot",
    join: "Makisali",
    faq: "FAQ",
    github: "GitHub",
    download: "I-download",
    downloadKarasu: "I-download ang Karasu",
    openMenu: "Buksan ang menu",
    closeMenu: "Isara ang menu",
  },
  hero: {
    eyebrow: "Libre · open source · para sa AniList",
    title: "Ang AniList client na nagtatala ng mga episode mo para sa iyo",
    lede: "Ang mga listahan mo, ang season, ang airing calendar, mga istatistika, ang feed, at ang forum sa iisang mabilis na window, kasama ang detection na nag-a-update ng listahan mo kapag natapos ang isang episode.",
    windows: "I-download para sa Windows",
    linux: "Linux",
    android: "Android",
    note: "Bersyon {version}. Hindi naka-code-sign ang Windows installer, kaya maaaring magbabala ang SmartScreen sa unang pagbukas · Ang Linux ay isang experimental na AppImage · Ang Android ay isang APK na sine-sideload · walang macOS",
    checksums: "mga checksum",
    everyDownload: "lahat ng download",
  },
  changes: {
    title: "Ano ang nagbago",
    nightly: "Sa Nightly",
    version: "Bersyon {version}",
    since: "Mula {version}, wala pa sa anumang Stable release",
    added: "Idinagdag",
    changed: "Binago",
    fixed: "Inayos",
    whole: "Ang buong changelog",
  },
  gallery: {
    eyebrow: "Mga screenshot",
    title: "Ang app, kung ano talaga ito",
    which: "Piliin ang mga screenshot",
    desktop: "Desktop",
    android: "Android",
    open: "Buksan: {caption}",
    dialog: "Screenshot {n} sa {total}: {caption}",
    previous: "Nakaraang screenshot",
    next: "Susunod na screenshot",
    close: "Isara",
  },
  join: {
    title: "Subukan mo, tapos sabihin mo sa amin kung kumusta",
    body: "Ginagawa ang Karasu ng isang maintainer kasama ang sinumang sumasama. Malaking tulong ang bug report, ideya, o simpleng pagsabi na gumagana ito sa computer mo, lalo na sa Linux at Android.",
    discord: "Sumali sa Discord",
    bug: "Mag-ulat ng bug",
    source: "Source code sa GitHub",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Mga tanong, sinasagot mula sa code.",
    items: {
      what: {
        q: "Ano ang Karasu?",
        a: "Isang desktop at Android app na nag-aalaga ng anime at manga list mo sa AniList. Napapansin nito ang pinapanood o binabasa mo at awtomatikong ina-update ang progress mo sa AniList, at nagtatanong muna ito nang isang beses para sa chapter mula sa site na hindi nito kilala ang pangalan, at binibigyan nito ang listahang iyon ng mabilis na lokal na interface na may mga istatistika, notification, at mga social page.",
      },
      free: {
        q: "Libre ba ito?",
        a: "Oo. Libre ang Karasu at inilalabas sa ilalim ng GNU AGPL-3.0, o anumang mas bagong bersyon. Walang bayad na tier at walang kailangang i-unlock.",
      },
      open: {
        q: "Open source ba ito?",
        a: "Oo. Nasa GitHub ang kumpletong source, at bawat release ay binubuo roon mula sa isang naka-tag na commit.",
      },
      anilist: {
        q: "Ano ang AniList?",
        a: "Isang libreng database ng anime at manga at tracking site sa anilist.co. Doon nakatira ang listahan mo; binabasa at sinusulatan ito ng Karasu sa pamamagitan ng pampublikong API ng AniList.",
      },
      replace: {
        q: "Pinapalitan ba ng Karasu ang AniList?",
        a: "Hindi. Isa itong client para dito. Nananatili sa AniList ang listahan mo at ang bawat pagbabagong ginagawa ng Karasu ay makikita sa website pagkalipas ng sandali. Magagamit mo rin ang Karasu nang walang account, na may lokal na listahan lang.",
      },
      platforms: {
        q: "Anong mga platform ang sinusuportahan?",
        a: "Stable ang Windows at Android, experimental na AppImage ang Linux, at walang macOS build. Kumpleto ang mga feature sa Windows. Ang Android ay may listahan, istatistika, notification, widget, mga social page, at sarili nitong updater, pero walang lokal na library at walang tray. Magkakaiba ang detection: nagbabasa ang Windows ng mga media session, window ng player at browser, mpv, at Jellyfin; nagbabasa ang Linux ng mga media session, mpv, at Jellyfin, nang walang pamagat ng window; nagbabasa ang Android ng Jellyfin.",
      },
      credentials: {
        q: "Sine-save ba ng Karasu ang mga kredensyal ko sa AniList?",
        a: "Hindi nito nakikita ang password mo. Nangyayari ang pag-sign in sa anilist.co sa browser mo, na nag-aabot ng token sa Karasu. Nakatago ang token na iyon sa credential store ng operating system mo sa desktop, sa naka-encrypt na file sa tabi ng app sa portable mode, at sa file na tinatakan ng Keystore sa Android — at hindi ito kailanman ibinabalik sa web view ng app.",
      },
      offline: {
        q: "Gumagana ba ang Karasu offline?",
        a: "Naka-cache nang lokal ang listahan mo, kaya bumubukas ito kahit walang network, ang isang title dito ay nagpapakita ng naka-cache nitong pahina na may gumaganang +1, at ang mga edit ay isinasalang sa pila at ipinapadala kapag bumalik ang koneksyon. Kailangan ng network sa pag-browse ng mga title na wala sa listahan mo, sa paghahanap, at sa mga social page.",
      },
      automatic: {
        q: "Awtomatiko bang ina-update ang progress ko sa AniList?",
        a: "Oo, sa default kapag napanood na ang dalawang-katlo ng haba ng isang episode — o pagkatapos ng mga minutong itinakda mo, o pagkatapos mong kumpirmahin ang isang toast, kung mas gusto mong tanungin. Laging nagtatanong muna ang Karasu para sa chapter mula sa site na hindi nito kilala ang pangalan. Pasulong lang ang galaw ng progress, at binabasa ulit ng Karasu ang listahan mo bago ito magsulat.",
      },
      affiliated: {
        q: "Kaanib ba ng AniList ang Karasu?",
        a: "Hindi. Isa itong malayang proyekto na gumagamit ng pampublikong API ng AniList, na may rehistradong client id at walang espesyal na access.",
      },
      smartscreen: {
        q: "Bakit nagbabala ang Windows kapag ini-install ko ito?",
        a: "Hindi naka-code-sign ang installer, kaya ngayon pa lang nakakita ang SmartScreen nito at sinasabi nga iyon. May kasamang SHA256SUMS.txt ang bawat release na magagamit mo para i-check ang download mo.",
      },
      network: {
        q: "Sino ang kinakausap ng Karasu?",
        a: "Ang API at mga image server ng AniList; GitHub, para sa update check at sa download; ang episode-relations data ng komunidad sa GitHub, isang beses lang sa isang linggo sa pinakamarami; ang sarili mong Jellyfin server kung nag-set up ka; ang lokal na socket ng Discord para sa Rich Presence kung ino-on mo ito. Ang mga larawan sa bio ng mga user ng AniList ay kinukuha sa pamamagitan ng sariling limitadong proxy ng Karasu, kaya malalaman ng mga host na iyon ang IP address mo kapag nagbukas ka ng profile. Wala nang iba, at walang analytics.",
      },
    },
  },
  footer: {
    tagline: "Isang modernong tracker ng anime at manga — ginawa para lang sa AniList.",
    badge: "Open source · libre",
    project: "Proyekto",
    github: "GitHub",
    download: "I-download",
    changelog: "Changelog",
    nightly: "Mga Nightly build",
    help: "Tulong",
    docs: "Dokumentasyon",
    issue: "Mag-ulat ng isyu",
    feature: "Humiling ng feature",
    discord: "Discord",
    elsewhere: "Iba pang lugar",
    anilist: "AniList",
    security: "Patakaran sa seguridad",
    contributing: "Pag-aambag",
    license: "Lisensya ng AGPL-3.0",
    copyright: "Lisensyado sa ilalim ng AGPL-3.0 · © 2026 Kyusetzu at mga contributor ng Karasu",
    disclaimer:
      "Ang Karasu ay isang malayang proyekto at hindi kaanib o inendorso ng AniList. Ginagamit ang SN Pro sa ilalim ng SIL Open Font License 1.1.",
    language: "Wika",
    aiNote: "Ang bawat wikang hindi Ingles at Aleman ay AI translation na wala pang taong nag-review.",
  },
  notFound: {
    title: "Walang dumapo na ibon dito.",
    body: "Hindi umiiral ang pahinang hinahanap mo. Isang pahina lang ang buong site, at hindi ito iyon.",
    back: "Bumalik sa Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Ang anime list bilang cover grid, na may hanay ng mga status at custom list sa tabi nito at paghahanap, pag-uuri, mga filter, at mga preset sa itaas.",
      caption: "Anime list, grid view",
    },
    overview: {
      alt: "Ang Overview: isang pagbati na may paghahanap at ang susunod na 48 oras sa ibabaw ng banner ng isang season, ang mga listahan bilang mga istante, ang mga airing na title na dapat habulin, at isang hanay na may mga istatistika at sarili mong aktibidad.",
      caption: "Overview — ang mga listahan mo, ang linggo, ang dapat habulin",
    },
    "now-playing": {
      alt: "Ang Now Playing window na nakalutang sa ibabaw ng anime list: ang ikatlong season ng Mushoku Tensei na na-detect sa mpv, season 3 episode 9, kasama ang progress na isusulat nito.",
      caption: "Now Playing — isang episode na na-detect sa mpv",
    },
    seasonal: {
      alt: "Ang Seasonal page: ang mga title ng Fall 2026 bilang mga card na may kanilang mga genre at countdown, ang taon, season, at mga format sa isang hanay sa tabi nila.",
      caption: "Seasonal",
    },
    calendar: {
      alt: "Ang agenda ng Calendar: ang mga episode na ipapalabas ngayong linggo mula ngayon, bawat isa sa isang card na may cover, oras, at numero ng episode.",
      caption: "Calendar",
    },
    "stats-overview": {
      alt: "Ang overview ng Statistics page: ang mga kabuuan ng listahan, isang singsing ng mga status at format, ang mga bansang pinagmulan, kung saan napunta ang oras ng panonood, at ang haba ng mga serye.",
      caption: "Statistics — overview",
    },
    franchise: {
      alt: "Ang franchise graph ng Mushoku Tensei: ang ikatlong season na nakakabit sa mga naunang season, ang light novel, at isang spin-off na manga, na may card ng napiling title sa gilid.",
      caption: "Franchise graph",
    },
    "phone-overview": {
      alt: "Ang Overview sa telepono: isang pagbati na may paghahanap sa ibabaw ng banner ng isang season at ang mga listahan bilang mga istante, sa itaas ng bottom bar.",
      caption: "Android — overview",
    },
    "phone-list": {
      alt: "Ang anime list sa telepono bilang tatlong-hanay na cover grid, na may status picker at paghahanap ng listahan sa itaas.",
      caption: "Android — anime list",
    },
    "phone-detail": {
      alt: "Ang detail page ng Mushoku Tensei sa telepono na nakabukas ang status sheet: ang status, ang progress, at ang score sa ibabaw ng sariling distribusyon ng mga score ng komunidad.",
      caption: "Android — isang title, nakabukas ang entry nito",
    },
    "phone-search": {
      alt: "Ang search page sa telepono na may mga resulta para sa “season 2” bilang cover grid.",
      caption: "Android — paghahanap",
    },
  },
} satisfies Messages;
