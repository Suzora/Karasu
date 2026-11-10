import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — En moderne anime- og mangatracker for AniList",
    description:
      "Karasu er en gratis åpen kildekode-tracker for anime og manga, bygget utelukkende for AniList. Den legger merke til hva du spiller av — og på Windows hva du leser — og holder fremgangen din på AniList oppdatert. Windows, Linux og Android.",
    notFoundTitle: "Siden ble ikke funnet — Karasu",
  },
  skip: "Gå til innholdet",
  nav: {
    label: "Hovedmeny",
    home: "Karasu — tilbake til toppen",
    changes: "Hva er nytt",
    screenshots: "Skjermbilder",
    join: "Bli med",
    faq: "Vanlige spørsmål",
    github: "GitHub",
    download: "Last ned",
    downloadKarasu: "Last ned Karasu",
    openMenu: "Åpne menyen",
    closeMenu: "Lukk menyen",
  },
  hero: {
    eyebrow: "Gratis · åpen kildekode · for AniList",
    title: "AniList-klienten som fører episodene dine for deg",
    lede: "Listene dine, sesongen, sendekalenderen, statistikk, feeden og forumet i ett raskt vindu — og en gjenkjenning som oppdaterer listen din når en episode er ferdig.",
    windows: "Last ned for Windows",
    linux: "Linux",
    android: "Android",
    note: "Versjon {version}. Windows-installasjonsprogrammet er ikke kodesignert, så SmartScreen kan advare ved første oppstart · Linux er en eksperimentell AppImage · Android er en APK for sideloading · ingen macOS",
    checksums: "sjekksummer",
    everyDownload: "alle nedlastinger",
  },
  changes: {
    title: "Hva er nytt",
    nightly: "I Nightly",
    version: "Versjon {version}",
    since: "Siden {version}, ennå ikke i noen Stable-utgave",
    added: "Lagt til",
    changed: "Endret",
    fixed: "Rettet",
    whole: "Hele endringsloggen",
  },
  gallery: {
    eyebrow: "Skjermbilder",
    title: "Appen, slik den er",
    which: "Hvilke skjermbilder",
    desktop: "Datamaskin",
    android: "Android",
    open: "Åpne: {caption}",
    dialog: "Skjermbilde {n} av {total}: {caption}",
    previous: "Forrige skjermbilde",
    next: "Neste skjermbilde",
    close: "Lukk",
  },
  join: {
    title: "Prøv den, og fortell oss hvordan det gikk",
    body: "Karasu bygges av én vedlikeholder sammen med alle som blir med. En feilrapport, en idé eller en beskjed om at noe fungerer på maskinen din hjelper — særlig på Linux og Android.",
    discord: "Bli med på Discord",
    bug: "Rapporter en feil",
    source: "Kildekode på GitHub",
  },
  faq: {
    eyebrow: "Vanlige spørsmål",
    title: "Spørsmål, besvart ut fra koden.",
    items: {
      what: {
        q: "Hva er Karasu?",
        a: "En skrivebords- og Android-app som tar seg av anime- og mangalisten din på AniList. Den legger merke til hva du spiller av eller leser, og oppdaterer fremgangen din på AniList helt av seg selv — og spør først én gang når det gjelder et kapittel fra et nettsted den ikke kjenner ved navn — og den gir listen et raskt lokalt grensesnitt med statistikk, varsler og de sosiale sidene.",
      },
      free: {
        q: "Er den gratis?",
        a: "Ja. Karasu koster ingenting og er utgitt under GNU AGPL-3.0 eller en senere versjon. Det finnes ikke noe betalt nivå og ingenting å låse opp.",
      },
      open: {
        q: "Er den åpen kildekode?",
        a: "Ja. Hele kildekoden ligger på GitHub, og hver utgave bygges der fra en merket commit.",
      },
      anilist: {
        q: "Hva er AniList?",
        a: "En gratis database og sporingsside for anime og manga på anilist.co. Listen din ligger der; Karasu leser og skriver den gjennom AniLists offentlige API.",
      },
      replace: {
        q: "Erstatter Karasu AniList?",
        a: "Nei. Det er en klient for AniList. Listen din blir liggende på AniList, og hver endring Karasu gjør, er synlig på nettsiden et øyeblikk senere. Du kan også bruke Karasu helt uten konto, med bare en lokal liste.",
      },
      platforms: {
        q: "Hvilke plattformer støttes?",
        a: "Windows og Android er Stable, Linux er en eksperimentell AppImage, og det finnes ingen macOS-versjon. Windows har alle funksjonene. Android har listen, statistikk, varsler, widgets, de sosiale sidene og sin egen oppdaterer, men ikke noe lokalt bibliotek og ikke noe systemfelt. Gjenkjenningen er ulik: Windows leser mediesesjoner, avspiller- og nettleservinduer, mpv og Jellyfin; Linux leser mediesesjoner, mpv og Jellyfin, men ingen vindustitler; Android leser Jellyfin.",
      },
      credentials: {
        q: "Lagrer Karasu AniList-opplysningene mine?",
        a: "Den ser aldri passordet ditt. Du logger inn på anilist.co i nettleseren din, som gir Karasu et token. Det tokenet oppbevares i operativsystemets legitimasjonslager på skrivebordet, i en kryptert fil ved siden av appen i portabel modus og i en Keystore-forseglet fil på Android — og det gis aldri tilbake til appens nettvisning.",
      },
      offline: {
        q: "Fungerer Karasu uten nett?",
        a: "Listen din mellomlagres lokalt, så den åpnes uten nettverk, en tittel på den viser sin mellomlagrede side med en fungerende +1, og endringer settes i kø og sendes når forbindelsen er tilbake. Titler som ikke står på listen din, søk og de sosiale sidene krever nettverk.",
      },
      automatic: {
        q: "Oppdaterer den fremgangen min på AniList automatisk?",
        a: "Ja, som standard når en episode har spilt i to tredeler av lengden — eller i de minuttene du selv stiller inn, eller etter at du har bekreftet et varsel, hvis du heller vil bli spurt. Et kapittel fra et nettsted Karasu ikke kjenner ved navn, spør alltid først. Fremgangen går bare fremover, og Karasu leser listen din på nytt rett før den skriver.",
      },
      affiliated: {
        q: "Hører Karasu sammen med AniList?",
        a: "Nei. Det er et uavhengig prosjekt som bruker AniLists offentlige API, med en registrert klient-ID og uten spesiell tilgang.",
      },
      smartscreen: {
        q: "Hvorfor advarer Windows når jeg installerer den?",
        a: "Installasjonsprogrammet er ikke kodesignert, så SmartScreen har aldri sett det før og sier fra om det. Hver utgave leveres med en SHA256SUMS.txt som du kan sjekke nedlastingen mot.",
      },
      network: {
        q: "Hvem snakker Karasu med?",
        a: "AniLists API og bildeservere; GitHub, for oppdateringssjekken og nedlastingen; fellesskapets data om episoderelasjoner på GitHub, høyst én gang i uken; din egen Jellyfin-server hvis du har satt opp en; Discords lokale socket for Rich Presence hvis du slår det på. Bilder i AniList-brukeres biografier hentes gjennom Karasus egen begrensede proxy, så de vertene får vite IP-adressen din når du åpner en profil. Ingenting annet, og ingen analyse.",
      },
    },
  },
  footer: {
    tagline: "En moderne anime- og mangatracker — bygget utelukkende for AniList.",
    badge: "Åpen kildekode · gratis",
    project: "Prosjekt",
    github: "GitHub",
    download: "Last ned",
    changelog: "Endringslogg",
    nightly: "Nightly-bygg",
    help: "Hjelp",
    docs: "Dokumentasjon",
    issue: "Rapporter et problem",
    feature: "Foreslå en funksjon",
    discord: "Discord",
    elsewhere: "Andre steder",
    anilist: "AniList",
    security: "Sikkerhetspolicy",
    contributing: "Bidra",
    license: "AGPL-3.0-lisens",
    copyright: "Lisensiert under AGPL-3.0 · © 2026 Kyusetzu og Karasus bidragsytere",
    disclaimer:
      "Karasu er et uavhengig prosjekt og er verken tilknyttet eller godkjent av AniList. SN Pro brukes under SIL Open Font License 1.1.",
    language: "Språk",
    aiNote: "Alle språk unntatt engelsk og tysk er KI-oversettelser som ingen person har gjennomgått.",
  },
  notFound: {
    title: "Her sitter ingen.",
    body: "Siden du lette etter, finnes ikke. Hele nettstedet er én side, og dette er ikke den.",
    back: "Tilbake til Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Animelisten som et coverrutenett, med statusene og egne lister i en kolonne ved siden av og søk, sortering, filtre og forhåndsinnstillinger over.",
      caption: "Animeliste, rutenettvisning",
    },
    overview: {
      alt: "Oversikten: en hilsen med søk og de neste 48 timene over bannerbildet til en sesong, listene som hyller, de pågående titlene du kan ta igjen og en kolonne med statistikken og din egen aktivitet.",
      caption: "Oversikt — listene dine, uken, hva du kan ta igjen",
    },
    "now-playing": {
      alt: "Vinduet Spilles nå svever over animelisten: tredje sesong av Mushoku Tensei gjenkjent i mpv, sesong 3 episode 9, med fremgangen den vil skrive.",
      caption: "Spilles nå — en episode gjenkjent i mpv",
    },
    seasonal: {
      alt: "Sesongsiden: titlene fra høsten 2026 som kort med sjangre og en nedtelling, med år, sesong og formater i en kolonne ved siden av.",
      caption: "Sesong",
    },
    calendar: {
      alt: "Kalenderens agenda: ukens sendte episoder fra i dag, hver på et kort med cover, tidspunkt og episodenummer.",
      caption: "Kalender",
    },
    "stats-overview": {
      alt: "Oversikten på statistikksiden: totalene for listen, en ring av statuser og formater, opprinnelseslandene, hvor seertiden gikk og serielengdene.",
      caption: "Statistikk — oversikt",
    },
    franchise: {
      alt: "Franchisegrafen for Mushoku Tensei: tredje sesong koblet til de tidligere sesongene, lettromanen og en spin-off-manga, med kortet til den valgte tittelen ved siden av.",
      caption: "Franchisegraf",
    },
    "phone-overview": {
      alt: "Oversikten på telefonen: en hilsen med søk over bannerbildet til en sesong og listene som hyller, over den nederste linjen.",
      caption: "Android — oversikt",
    },
    "phone-list": {
      alt: "Animelisten på telefonen som et coverrutenett med tre kolonner, med statusvelgeren og listens søk over.",
      caption: "Android — animeliste",
    },
    "phone-detail": {
      alt: "Detaljsiden til Mushoku Tensei på telefonen med statusarket åpent: status, fremgang og vurdering over fellesskapets egen fordeling av vurderinger.",
      caption: "Android — en tittel, med oppføringen åpen",
    },
    "phone-search": {
      alt: "Søkesiden på telefonen med resultatene for «season 2» som et coverrutenett.",
      caption: "Android — søk",
    },
  },
} satisfies Messages;
