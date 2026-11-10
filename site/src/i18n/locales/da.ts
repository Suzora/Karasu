import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — En moderne anime- og mangatracker til AniList",
    description:
      "Karasu er en gratis open source-tracker til anime og manga, bygget udelukkende til AniList. Den opdager, hvad du afspiller — og på Windows, hvad du læser — og holder dine fremskridt på AniList ajour. Windows, Linux og Android.",
    notFoundTitle: "Siden blev ikke fundet — Karasu",
  },
  skip: "Gå til indholdet",
  nav: {
    label: "Hovedmenu",
    home: "Karasu — tilbage til toppen",
    changes: "Hvad er nyt",
    screenshots: "Skærmbilleder",
    join: "Vær med",
    faq: "FAQ",
    github: "GitHub",
    download: "Download",
    downloadKarasu: "Download Karasu",
    openMenu: "Åbn menuen",
    closeMenu: "Luk menuen",
  },
  hero: {
    eyebrow: "Gratis · open source · til AniList",
    title: "AniList-klienten, der registrerer dine afsnit for dig",
    lede: "Dine lister, sæsonen, udsendelseskalenderen, statistik, feedet og forummet i ét hurtigt vindue — og en genkendelse, der opdaterer din liste, når et afsnit er slut.",
    windows: "Download til Windows",
    linux: "Linux",
    android: "Android",
    note: "Version {version}. Windows-installationsprogrammet er ikke kodesigneret, så SmartScreen kan advare ved første start · Linux er en eksperimentel AppImage · Android er en APK til sideloading · ingen macOS",
    checksums: "kontrolsummer",
    everyDownload: "alle downloads",
  },
  changes: {
    title: "Hvad er nyt",
    nightly: "I Nightly",
    version: "Version {version}",
    since: "Siden {version}, endnu ikke i nogen Stable-udgave",
    added: "Tilføjet",
    changed: "Ændret",
    fixed: "Rettet",
    whole: "Hele ændringsloggen",
  },
  gallery: {
    eyebrow: "Skærmbilleder",
    title: "Appen, som den er",
    which: "Hvilke skærmbilleder",
    desktop: "Computer",
    android: "Android",
    open: "Åbn: {caption}",
    dialog: "Skærmbillede {n} af {total}: {caption}",
    previous: "Forrige skærmbillede",
    next: "Næste skærmbillede",
    close: "Luk",
  },
  join: {
    title: "Prøv den, og fortæl os, hvordan det gik",
    body: "Karasu bygges af én vedligeholder sammen med alle, der er med. En fejlrapport, en idé eller en besked om, at noget virker på din maskine, hjælper — især på Linux og Android.",
    discord: "Kom med på Discord",
    bug: "Rapportér en fejl",
    source: "Kildekode på GitHub",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Spørgsmål, besvaret ud fra koden.",
    items: {
      what: {
        q: "Hvad er Karasu?",
        a: "En desktop- og Android-app, der passer din anime- og mangaliste på AniList. Den opdager, hvad du afspiller eller læser, og opdaterer dine fremskridt på AniList helt af sig selv — og spørger først én gang, når det er et kapitel fra et websted, den ikke kender ved navn — og den giver listen en hurtig lokal brugerflade med statistik, notifikationer og de sociale sider.",
      },
      free: {
        q: "Er den gratis?",
        a: "Ja. Karasu koster ingenting og udgives under GNU AGPL-3.0 eller en senere version. Der er intet betalingsniveau og intet at låse op.",
      },
      open: {
        q: "Er den open source?",
        a: "Ja. Hele kildekoden ligger på GitHub, og hver udgave bygges dér ud fra en tagget commit.",
      },
      anilist: {
        q: "Hvad er AniList?",
        a: "En gratis database og et trackingsted for anime og manga på anilist.co. Din liste ligger dér; Karasu læser og skriver den gennem AniLists offentlige API.",
      },
      replace: {
        q: "Erstatter Karasu AniList?",
        a: "Nej. Det er en klient til AniList. Din liste bliver på AniList, og hver ændring, Karasu laver, kan ses på webstedet et øjeblik senere. Du kan også bruge Karasu helt uden konto, kun med en lokal liste.",
      },
      platforms: {
        q: "Hvilke platforme understøttes?",
        a: "Windows og Android er Stable, Linux er en eksperimentel AppImage, og der findes ingen macOS-version. Windows har alle funktioner. Android har listen, statistik, notifikationer, widgets, de sociale sider og sin egen opdaterer, men intet lokalt bibliotek og ingen systembakke. Genkendelsen er forskellig: Windows læser mediesessioner, afspiller- og browservinduer, mpv og Jellyfin; Linux læser mediesessioner, mpv og Jellyfin, men ingen vinduestitler; Android læser Jellyfin.",
      },
      credentials: {
        q: "Gemmer Karasu mine AniList-oplysninger?",
        a: "Den ser aldrig din adgangskode. Du logger ind på anilist.co i din browser, som giver Karasu et token. Det token opbevares i operativsystemets legitimationslager på computeren, i en krypteret fil ved siden af appen i portabel tilstand og i en Keystore-forseglet fil på Android — og det gives aldrig tilbage til appens webvisning.",
      },
      offline: {
        q: "Kan Karasu fungere offline?",
        a: "Din liste caches lokalt, så den åbner uden netværk, en titel på den viser sin cachede side med et fungerende +1, og ændringer sættes i kø og sendes, når forbindelsen er tilbage. Titler, der ikke står på din liste, søgning og de sociale sider kræver netværk.",
      },
      automatic: {
        q: "Opdaterer den automatisk mine fremskridt på AniList?",
        a: "Ja, som standard når et afsnit har kørt i to tredjedele af sin længde — eller i de minutter, du selv indstiller, eller når du har bekræftet en meddelelse, hvis du hellere vil spørges. Et kapitel fra et websted, Karasu ikke kender ved navn, spørger altid først. Fremskridt går kun fremad, og Karasu læser din liste igen lige før, den skriver.",
      },
      affiliated: {
        q: "Hører Karasu sammen med AniList?",
        a: "Nej. Det er et uafhængigt projekt, der bruger AniLists offentlige API med et registreret klient-id og uden særlig adgang.",
      },
      smartscreen: {
        q: "Hvorfor advarer Windows, når jeg installerer den?",
        a: "Installationsprogrammet er ikke kodesigneret, så SmartScreen har aldrig set det før og siger det. Hver udgave leveres med en SHA256SUMS.txt, som du kan kontrollere downloaden mod.",
      },
      network: {
        q: "Hvem taler Karasu med?",
        a: "AniLists API og billedservere; GitHub, til opdateringstjekket og downloaden; fællesskabets data om afsnitsrelationer på GitHub, højst én gang om ugen; din egen Jellyfin-server, hvis du har sat en op; Discords lokale socket til Rich Presence, hvis du slår det til. Billeder i AniList-brugeres biografier hentes gennem Karasus egen afgrænsede proxy, så de værter får din IP-adresse at vide, når du åbner en profil. Intet andet, og ingen analyse.",
      },
    },
  },
  footer: {
    tagline: "En moderne anime- og mangatracker — bygget udelukkende til AniList.",
    badge: "Open source · gratis",
    project: "Projekt",
    github: "GitHub",
    download: "Download",
    changelog: "Ændringslog",
    nightly: "Nightly-builds",
    help: "Hjælp",
    docs: "Dokumentation",
    issue: "Rapportér et problem",
    feature: "Foreslå en funktion",
    discord: "Discord",
    elsewhere: "Andre steder",
    anilist: "AniList",
    security: "Sikkerhedspolitik",
    contributing: "Bidrag",
    license: "AGPL-3.0-licens",
    copyright: "Licenseret under AGPL-3.0 · © 2026 Kyusetzu og Karasus bidragydere",
    disclaimer:
      "Karasu er et uafhængigt projekt og er hverken tilknyttet eller godkendt af AniList. SN Pro bruges under SIL Open Font License 1.1.",
    language: "Sprog",
    aiNote: "Alle sprog undtagen engelsk og tysk er AI-oversættelser, som intet menneske har gennemgået.",
  },
  notFound: {
    title: "Her sidder ingen.",
    body: "Siden, du ledte efter, findes ikke. Hele webstedet er én side, og det her er den ikke.",
    back: "Tilbage til Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Animelisten som et coverrude, med statusserne og egne lister i en kolonne ved siden af og søgning, sortering, filtre og forudindstillinger ovenfor.",
      caption: "Animeliste, rudevisning",
    },
    overview: {
      alt: "Oversigten: en hilsen med søgning og de næste 48 timer over en sæsons banner, listerne som hylder, de udsendende titler at indhente og en kolonne med statistikken og din egen aktivitet.",
      caption: "Oversigt — dine lister, ugen, hvad du kan indhente",
    },
    "now-playing": {
      alt: "Vinduet Afspilles nu svæver over animelisten: Mushoku Tensei sæson tre genkendt i mpv, sæson 3 afsnit 9, med de fremskridt, der bliver skrevet.",
      caption: "Afspilles nu — et afsnit genkendt i mpv",
    },
    seasonal: {
      alt: "Sæsonsiden: efterårets 2026-titler som kort med deres genrer og en nedtælling, med år, sæson og formater i en kolonne ved siden af.",
      caption: "Sæson",
    },
    calendar: {
      alt: "Kalenderens dagsorden: ugens udsendte afsnit fra i dag, hver på et kort med cover, tidspunkt og afsnitsnummer.",
      caption: "Kalender",
    },
    "stats-overview": {
      alt: "Statistiksidens oversigt: listens totaler, en ring af statusser og formater, oprindelseslandene, hvor seertiden gik hen, og seriernes længder.",
      caption: "Statistik — oversigt",
    },
    franchise: {
      alt: "Franchisegrafen for Mushoku Tensei: tredje sæson forbundet med de tidligere sæsoner, light novel-romanen og en spin-off-manga, med den valgte titels kort ved siden af.",
      caption: "Franchisegraf",
    },
    "phone-overview": {
      alt: "Oversigten på telefonen: en hilsen med søgning over en sæsons banner og listerne som hylder, over den nederste bjælke.",
      caption: "Android — oversigt",
    },
    "phone-list": {
      alt: "Animelisten på telefonen som et coverrude med tre kolonner, med statusvælgeren og listens søgning ovenfor.",
      caption: "Android — animeliste",
    },
    "phone-detail": {
      alt: "Detaljesiden for Mushoku Tensei på telefonen med statusarket åbent: status, fremskridt og bedømmelse over fællesskabets egen fordeling af bedømmelser.",
      caption: "Android — en titel med dens post åben",
    },
    "phone-search": {
      alt: "Søgesiden på telefonen med resultaterne for „season 2“ som et coverrude.",
      caption: "Android — søgning",
    },
  },
} satisfies Messages;
