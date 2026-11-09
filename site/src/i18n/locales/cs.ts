import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Moderní tracker anime a mangy pro AniList",
    description:
      "Karasu je bezplatný open-source tracker anime a mangy, vytvořený výhradně pro AniList. Všimne si, co přehráváš — a ve Windows i co čteš — a udržuje tvůj postup na AniList aktuální. Windows, Linux a Android.",
    notFoundTitle: "Stránka nenalezena — Karasu",
  },
  skip: "Přejít na obsah",
  nav: {
    label: "Hlavní nabídka",
    home: "Karasu — zpět nahoru",
    changes: "Co je nového",
    screenshots: "Snímky obrazovky",
    join: "Zapoj se",
    faq: "Časté dotazy",
    github: "GitHub",
    download: "Stáhnout",
    downloadKarasu: "Stáhnout Karasu",
    openMenu: "Otevřít nabídku",
    closeMenu: "Zavřít nabídku",
  },
  hero: {
    eyebrow: "Zdarma · open source · pro AniList",
    title: "Klient AniList, který ti zapisuje epizody za tebe",
    lede: "Tvoje seznamy, sezóna, kalendář vysílání, statistiky, novinky a fórum v jednom rychlém okně — a rozpoznávání, které po skončení epizody aktualizuje tvůj seznam.",
    windows: "Stáhnout pro Windows",
    linux: "Linux",
    android: "Android",
    note: "Verze {version}. Instalátor pro Windows není podepsaný, takže SmartScreen může při prvním spuštění varovat · Linux je experimentální AppImage · Android je APK k ruční instalaci · žádný macOS",
    checksums: "kontrolní součty",
    everyDownload: "všechna stažení",
  },
  changes: {
    title: "Co je nového",
    nightly: "V Nightly",
    version: "Verze {version}",
    since: "Od {version}, zatím v žádném vydání Stable",
    added: "Přidáno",
    changed: "Změněno",
    fixed: "Opraveno",
    whole: "Celý seznam změn",
  },
  gallery: {
    eyebrow: "Snímky obrazovky",
    title: "Aplikace taková, jaká je",
    which: "Které snímky obrazovky",
    desktop: "Počítač",
    android: "Android",
    open: "Otevřít: {caption}",
    dialog: "Snímek obrazovky {n} z {total}: {caption}",
    previous: "Předchozí snímek obrazovky",
    next: "Další snímek obrazovky",
    close: "Zavřít",
  },
  join: {
    title: "Vyzkoušej to a napiš nám, jak to dopadlo",
    body: "Karasu vyvíjí jeden správce spolu s každým, kdo se přidá. Nahlášená chyba, nápad nebo zpráva, že něco funguje na tvém počítači, pomáhá — hlavně na Linuxu a Androidu.",
    discord: "Připojit se na Discord",
    bug: "Nahlásit chybu",
    source: "Zdrojový kód na GitHubu",
  },
  faq: {
    eyebrow: "Časté dotazy",
    title: "Otázky, na které odpovídá kód.",
    items: {
      what: {
        q: "Co je Karasu?",
        a: "Aplikace pro počítač a Android, která spravuje tvůj seznam anime a mangy na AniList. Všimne si, co přehráváš nebo čteš, a sama aktualizuje tvůj postup na AniList — u kapitoly z webu, který nezná jménem, se nejdřív jednou zeptá — a dává tomuto seznamu rychlé místní rozhraní se statistikami, oznámeními a sociálními stránkami.",
      },
      free: {
        q: "Je zdarma?",
        a: "Ano. Karasu je zdarma a vychází pod licencí GNU AGPL-3.0 nebo jakoukoli pozdější verzí. Neexistuje žádná placená úroveň ani nic, co by se dalo odemknout.",
      },
      open: {
        q: "Je open source?",
        a: "Ano. Celý zdrojový kód je na GitHubu a každé vydání se tam sestavuje z označeného commitu.",
      },
      anilist: {
        q: "Co je AniList?",
        a: "Bezplatná databáze a sledovací web pro anime a mangu na anilist.co. Tvůj seznam je tam; Karasu ho čte a zapisuje přes veřejné API AniList.",
      },
      replace: {
        q: "Nahrazuje Karasu AniList?",
        a: "Ne. Je to klient pro něj. Tvůj seznam zůstává na AniList a každá změna, kterou Karasu provede, je o chvíli později vidět na webu. Karasu můžeš používat i úplně bez účtu, jen s místním seznamem.",
      },
      platforms: {
        q: "Které platformy jsou podporované?",
        a: "Windows a Android jsou Stable, Linux je experimentální AppImage a sestavení pro macOS neexistuje. Windows má všechny funkce. Android má seznam, statistiky, oznámení, widgety, sociální stránky a vlastní aktualizátor, ale žádnou místní knihovnu a žádnou oznamovací oblast. Rozpoznávání se liší: Windows čte mediální relace, okna přehrávačů a prohlížečů, mpv a Jellyfin; Linux čte mediální relace, mpv a Jellyfin, bez názvů oken; Android čte Jellyfin.",
      },
      credentials: {
        q: "Ukládá Karasu mé přihlašovací údaje k AniList?",
        a: "Heslo nikdy nevidí. Přihlášení probíhá na anilist.co ve tvém prohlížeči, který Karasu předá token. Tento token se na počítači ukládá do úložiště přihlašovacích údajů operačního systému, v přenosném režimu do šifrovaného souboru vedle aplikace a na Androidu do souboru zapečetěného přes Keystore — a nikdy se nepředává zpět webovému zobrazení aplikace.",
      },
      offline: {
        q: "Funguje Karasu offline?",
        a: "Tvůj seznam se ukládá do místní mezipaměti, takže se otevře bez sítě, titul na něm ukáže svou uloženou stránku s funkčním +1 a úpravy se zařadí do fronty a odešlou, jakmile se připojení vrátí. Procházení titulů mimo tvůj seznam, vyhledávání a sociální stránky síť potřebují.",
      },
      automatic: {
        q: "Aktualizuje můj postup na AniList automaticky?",
        a: "Ano, ve výchozím nastavení poté, co epizoda běžela dvě třetiny své délky — nebo po tebou nastavený počet minut, nebo po potvrzení oznámení, pokud se raději necháš ptát. Kapitola z webu, který Karasu nezná jménem, se vždy nejdřív zeptá. Postup se posouvá jen vpřed a Karasu si tvůj seznam těsně před zápisem znovu přečte.",
      },
      affiliated: {
        q: "Je Karasu spojené s AniList?",
        a: "Ne. Je to nezávislý projekt, který používá veřejné API AniList s registrovaným ID klienta a bez zvláštního přístupu.",
      },
      smartscreen: {
        q: "Proč Windows při instalaci varuje?",
        a: "Instalátor není podepsaný, takže ho SmartScreen nikdy dřív neviděl a říká to. Každé vydání obsahuje soubor SHA256SUMS.txt, proti kterému můžeš stažený soubor zkontrolovat.",
      },
      network: {
        q: "S kým Karasu komunikuje?",
        a: "S API a obrazovými servery AniList; s GitHubem kvůli kontrole aktualizací a stažení; s daty komunity o vztazích epizod na GitHubu, nejvýše jednou týdně; s tvým vlastním serverem Jellyfin, pokud ho nastavíš; s lokálním socketem Discordu pro Rich Presence, pokud to zapneš. Obrázky v bio uživatelů AniList se načítají přes vlastní omezenou proxy Karasu, takže tyto servery zjistí tvou IP adresu, když otevřeš profil. Nic dalšího a žádná analytika.",
      },
    },
  },
  footer: {
    tagline: "Moderní tracker anime a mangy — vytvořený výhradně pro AniList.",
    badge: "Open source · zdarma",
    project: "Projekt",
    github: "GitHub",
    download: "Stáhnout",
    changelog: "Seznam změn",
    nightly: "Sestavení Nightly",
    help: "Nápověda",
    docs: "Dokumentace",
    issue: "Nahlásit problém",
    feature: "Navrhnout funkci",
    discord: "Discord",
    elsewhere: "Jinde",
    anilist: "AniList",
    security: "Zásady zabezpečení",
    contributing: "Přispívání",
    license: "Licence AGPL-3.0",
    copyright: "Licencováno pod AGPL-3.0 · © 2026 Kyu a přispěvatelé Karasu",
    disclaimer:
      "Karasu je nezávislý projekt a není spojen s AniList ani jím schválen. SN Pro se používá pod licencí SIL Open Font License 1.1.",
    language: "Jazyk",
    aiNote: "Každý jazyk kromě angličtiny a němčiny je překlad umělé inteligence, který žádný člověk nezkontroloval.",
  },
  notFound: {
    title: "Nikdo tu nesedí.",
    body: "Stránka, kterou hledáš, neexistuje. Celý web je jediná stránka a tohle není ona.",
    back: "Zpět na Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Seznam anime jako mřížka obálek, vedle ní sloupec se stavy a vlastními seznamy a nad ní vyhledávání, řazení, filtry a předvolby.",
      caption: "Seznam anime, zobrazení mřížky",
    },
    overview: {
      alt: "Přehled: uvítání s vyhledáváním a nejbližšími 48 hodinami nad bannerem sezóny, seznamy jako police, vysílané tituly k dohnání a sloupec se statistikami a tvou vlastní aktivitou.",
      caption: "Přehled — tvoje seznamy, týden, co můžeš dohnat",
    },
    "now-playing": {
      alt: "Okno Právě se přehrává se vznáší nad seznamem anime: třetí řada Mushoku Tensei rozpoznaná v mpv, řada 3 epizoda 9, s postupem, který zapíše.",
      caption: "Právě se přehrává — epizoda rozpoznaná v mpv",
    },
    seasonal: {
      alt: "Stránka sezóny: tituly podzimu 2026 jako karty s žánry a odpočtem, vedle nich sloupec s rokem, sezónou a formáty.",
      caption: "Sezóna",
    },
    calendar: {
      alt: "Program kalendáře: vysílané epizody týdne od dneška, každá na kartě s obálkou, časem a číslem epizody.",
      caption: "Kalendář",
    },
    "stats-overview": {
      alt: "Přehled stránky statistik: součty seznamu, prstenec stavů a formátů, země původu, kam odešel čas sledování, a délky seriálů.",
      caption: "Statistiky — přehled",
    },
    franchise: {
      alt: "Graf franšízy Mushoku Tensei: třetí řada propojená s dřívějšími řadami, light novelou a spin-off mangou, vedle karta vybraného titulu.",
      caption: "Graf franšízy",
    },
    "phone-overview": {
      alt: "Přehled v telefonu: uvítání s vyhledáváním nad bannerem sezóny a seznamy jako police, nad spodním panelem.",
      caption: "Android — přehled",
    },
    "phone-list": {
      alt: "Seznam anime v telefonu jako třísloupcová mřížka obálek, nad ní výběr stavu a vyhledávání v seznamu.",
      caption: "Android — seznam anime",
    },
    "phone-detail": {
      alt: "Stránka podrobností Mushoku Tensei v telefonu s otevřeným listem stavu: stav, postup a hodnocení nad rozložením hodnocení komunity.",
      caption: "Android — titul s otevřeným záznamem",
    },
    "phone-search": {
      alt: "Stránka vyhledávání v telefonu s výsledky pro „season 2“ jako mřížkou obálek.",
      caption: "Android — vyhledávání",
    },
  },
} satisfies Messages;
