import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Een moderne anime- en manga-tracker voor AniList",
    description:
      "Karasu is een gratis, opensource anime- en manga-tracker, uitsluitend gebouwd voor AniList. Hij merkt wat je afspeelt — en onder Windows wat je leest — en houdt je voortgang op AniList bij. Windows, Linux en Android.",
    notFoundTitle: "Pagina niet gevonden — Karasu",
  },
  skip: "Naar de inhoud",
  nav: {
    label: "Hoofdmenu",
    home: "Karasu — terug naar boven",
    changes: "Wat is er nieuw",
    screenshots: "Schermafbeeldingen",
    join: "Doe mee",
    faq: "FAQ",
    github: "GitHub",
    download: "Downloaden",
    downloadKarasu: "Karasu downloaden",
    openMenu: "Menu openen",
    closeMenu: "Menu sluiten",
  },
  hero: {
    eyebrow: "Gratis · opensource · voor AniList",
    title: "De AniList-client die je afleveringen voor je bijhoudt",
    lede: "Je lijsten, het seizoen, de uitzendkalender, statistieken, de feed en het forum in één snel venster, en een detectie die je lijst bijwerkt zodra een aflevering afgelopen is.",
    windows: "Downloaden voor Windows",
    linux: "Linux",
    android: "Android",
    note: "Versie {version}. Het Windows-installatieprogramma is niet ondertekend, dus SmartScreen kan bij de eerste keer starten waarschuwen · Linux is een experimentele AppImage · Android is een APK om zelf te installeren · geen macOS",
    checksums: "controlesommen",
    everyDownload: "alle downloads",
  },
  changes: {
    title: "Wat is er nieuw",
    nightly: "In de Nightly",
    version: "Versie {version}",
    since: "Sinds {version}, nog niet in een Stable-release",
    added: "Toegevoegd",
    changed: "Gewijzigd",
    fixed: "Opgelost",
    whole: "Het hele changelog",
  },
  gallery: {
    eyebrow: "Schermafbeeldingen",
    title: "De app, zoals hij is",
    which: "Welke schermafbeeldingen",
    desktop: "Desktop",
    android: "Android",
    open: "Openen: {caption}",
    dialog: "Schermafbeelding {n} van {total}: {caption}",
    previous: "Vorige schermafbeelding",
    next: "Volgende schermafbeelding",
    close: "Sluiten",
  },
  join: {
    title: "Probeer het uit en vertel ons hoe het ging",
    body: "Karasu wordt gebouwd door één maintainer, samen met iedereen die meedoet. Een bugmelding, een idee of een berichtje dat iets op jouw computer werkt, helpt, vooral op Linux en Android.",
    discord: "Word lid van de Discord",
    bug: "Een bug melden",
    source: "Broncode op GitHub",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Vragen, beantwoord vanuit de code.",
    items: {
      what: {
        q: "Wat is Karasu?",
        a: "Een desktop- en Android-app die je AniList-anime- en mangalijst bijhoudt. Hij merkt wat je kijkt of leest en werkt je voortgang op AniList zelf bij — en vraagt eerst één keer om bevestiging bij een hoofdstuk van een site die hij niet bij naam noemt — en geeft die lijst een snelle lokale interface met statistieken, meldingen en de sociale pagina's.",
      },
      free: {
        q: "Is het gratis?",
        a: "Ja. Karasu is gratis en wordt uitgebracht onder de GNU AGPL-3.0, of een latere versie. Er is geen betaald niveau en niets om te ontgrendelen.",
      },
      open: {
        q: "Is het opensource?",
        a: "Ja. De volledige broncode staat op GitHub, en elke release wordt daar gebouwd vanuit een getagde commit.",
      },
      anilist: {
        q: "Wat is AniList?",
        a: "Een gratis anime- en mangadatabase en trackingsite op anilist.co. Je lijst staat daar; Karasu leest hem en schrijft ernaar via de openbare API van AniList.",
      },
      replace: {
        q: "Vervangt Karasu AniList?",
        a: "Nee. Het is een client ervoor. Je lijst blijft op AniList en elke wijziging die Karasu maakt, is even later zichtbaar op de website. Je kunt Karasu ook zonder account gebruiken, met alleen een lokale lijst.",
      },
      platforms: {
        q: "Welke platforms worden ondersteund?",
        a: "Windows en Android zijn Stable, Linux is een experimentele AppImage en er is geen macOS-build. Windows heeft alle functies. Android heeft de lijst, statistieken, meldingen, widgets, de sociale pagina's en een eigen updater, maar geen lokale bibliotheek en geen systeemvak. De detectie verschilt: Windows leest mediasessies, speler- en browservensters, mpv en Jellyfin; Linux leest mediasessies, mpv en Jellyfin, zonder venstertitels; Android leest Jellyfin.",
      },
      credentials: {
        q: "Slaat Karasu mijn AniList-inloggegevens op?",
        a: "Hij ziet je wachtwoord nooit. Het inloggen gebeurt op anilist.co in je browser, die Karasu een token geeft. Dat token wordt op de desktop bewaard in de opslag voor inloggegevens van je besturingssysteem, in de draagbare modus in een versleuteld bestand naast de app, en op Android in een met de Keystore verzegeld bestand — en het wordt nooit teruggegeven aan de webweergave van de app.",
      },
      offline: {
        q: "Werkt Karasu offline?",
        a: "Je lijst wordt lokaal gecachet, dus hij opent zonder netwerk, een titel erin toont zijn gecachete pagina met een werkende +1, en wijzigingen komen in een wachtrij en worden verstuurd zodra de verbinding terug is. Titels bekijken die niet op je lijst staan, zoeken en de sociale pagina's hebben netwerk nodig.",
      },
      automatic: {
        q: "Werkt het mijn AniList-voortgang automatisch bij?",
        a: "Ja, standaard zodra een aflevering twee derde van zijn lengte is afgespeeld — of na het aantal minuten dat je instelt, of nadat je een melding bevestigt, als je liever gevraagd wordt. Een hoofdstuk van een site die Karasu niet bij naam noemt, vraagt altijd eerst. De voortgang gaat alleen vooruit, en Karasu leest je lijst opnieuw net voordat hij schrijft.",
      },
      affiliated: {
        q: "Is Karasu verbonden aan AniList?",
        a: "Nee. Het is een onafhankelijk project dat de openbare API van AniList gebruikt, met een geregistreerde client-id en zonder speciale toegang.",
      },
      smartscreen: {
        q: "Waarom waarschuwt Windows bij het installeren?",
        a: "Het installatieprogramma is niet ondertekend, dus SmartScreen heeft het nog nooit gezien en zegt dat ook. Elke release bevat een SHA256SUMS.txt waarmee je de download kunt controleren.",
      },
      network: {
        q: "Met wie praat Karasu?",
        a: "Met de API en de afbeeldingsservers van AniList; met GitHub, voor de updatecontrole en de download; met de afleveringsrelatiegegevens van de community op GitHub, hooguit één keer per week; met je eigen Jellyfin-server als je er een instelt; met de lokale socket van Discord voor Rich Presence als je dat inschakelt. Afbeeldingen in AniList-gebruikersbio's worden opgehaald via Karasu's eigen begrensde proxy, dus die hosts krijgen je IP-adres te zien als je een profiel opent. Verder niets, en geen analytics.",
      },
    },
  },
  footer: {
    tagline: "Een moderne anime- en manga-tracker — uitsluitend gebouwd voor AniList.",
    badge: "Opensource · gratis",
    project: "Project",
    github: "GitHub",
    download: "Downloaden",
    changelog: "Changelog",
    nightly: "Nightly-builds",
    help: "Hulp",
    docs: "Documentatie",
    issue: "Een probleem melden",
    feature: "Een functie voorstellen",
    discord: "Discord",
    elsewhere: "Elders",
    anilist: "AniList",
    security: "Beveiligingsbeleid",
    contributing: "Bijdragen",
    license: "AGPL-3.0-licentie",
    copyright: "Gelicentieerd onder AGPL-3.0 · © 2026 Kyusetzu en de Karasu-bijdragers",
    disclaimer:
      "Karasu is een onafhankelijk project en is niet verbonden aan of onderschreven door AniList. SN Pro wordt gebruikt onder de SIL Open Font License 1.1.",
    language: "Taal",
    aiNote: "Alle andere talen dan Engels en Duits zijn AI-vertalingen die geen mens heeft nagekeken.",
  },
  notFound: {
    title: "Hier zit niemand.",
    body: "De pagina die je zocht bestaat niet. De hele site is één pagina, en dit is hem niet.",
    back: "Terug naar Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "De animelijst als raster van covers, met de statussen en eigen lijsten in een kolom ernaast en zoeken, sorteren, filters en voorinstellingen erboven.",
      caption: "Animelijst, rasterweergave",
    },
    overview: {
      alt: "Het Overzicht: een begroeting met zoeken en de komende 48 uur boven de banner van een seizoen, de lijsten als planken, de lopende titels om bij te werken en een kolom met de statistieken en je eigen activiteit.",
      caption: "Overzicht — je lijsten, de week, wat je kunt bijwerken",
    },
    "now-playing": {
      alt: "Het venster „Nu bezig” zwevend boven de animelijst: het derde seizoen van Mushoku Tensei gedetecteerd in mpv, seizoen 3 aflevering 9, met de voortgang die het zal schrijven.",
      caption: "Nu bezig — een aflevering gedetecteerd in mpv",
    },
    seasonal: {
      alt: "De Seizoenspagina: de titels van herfst 2026 als kaarten met hun genres en een aftelling, het jaar, het seizoen en de formaten in een kolom ernaast.",
      caption: "Seizoenen",
    },
    calendar: {
      alt: "De agenda van de Kalender: de uitgezonden afleveringen van de week vanaf vandaag, elk op een kaart met cover, tijd en afleveringsnummer.",
      caption: "Kalender",
    },
    "stats-overview": {
      alt: "Het overzicht van de Statistiekenpagina: de totalen van de lijst, een ring van statussen en formaten, de landen van herkomst, waar de kijktijd naartoe ging en de lengtes van de series.",
      caption: "Statistieken — overzicht",
    },
    franchise: {
      alt: "De franchisegraaf van Mushoku Tensei: het derde seizoen gekoppeld aan de eerdere seizoenen, de light novel en een spin-offmanga, met de kaart van de geselecteerde titel opzij.",
      caption: "Franchisegraaf",
    },
    "phone-overview": {
      alt: "Het Overzicht op de telefoon: een begroeting met zoeken boven de banner van een seizoen en de lijsten als planken, boven de onderbalk.",
      caption: "Android — overzicht",
    },
    "phone-list": {
      alt: "De animelijst op de telefoon als covergraster met drie kolommen, met de statuskeuze en het zoekveld van de lijst erboven.",
      caption: "Android — animelijst",
    },
    "phone-detail": {
      alt: "De detailpagina van Mushoku Tensei op de telefoon met het statusblad open: de status, de voortgang en de score boven de spreiding van de scores van de community.",
      caption: "Android — een titel, met zijn invoer open",
    },
    "phone-search": {
      alt: "De zoekpagina op de telefoon met de resultaten voor „season 2” als covergraster.",
      caption: "Android — zoeken",
    },
  },
} satisfies Messages;
