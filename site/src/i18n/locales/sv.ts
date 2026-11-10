import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — En modern anime- och mangaspårare för AniList",
    description:
      "Karasu är en gratis spårare med öppen källkod för anime och manga, byggd uteslutande för AniList. Den märker vad du spelar upp — och i Windows vad du läser — och håller dina framsteg på AniList uppdaterade. Windows, Linux och Android.",
    notFoundTitle: "Sidan hittades inte — Karasu",
  },
  skip: "Hoppa till innehållet",
  nav: {
    label: "Huvudmeny",
    home: "Karasu — tillbaka till toppen",
    changes: "Vad som är nytt",
    screenshots: "Skärmbilder",
    join: "Delta",
    faq: "Vanliga frågor",
    github: "GitHub",
    download: "Ladda ned",
    downloadKarasu: "Ladda ned Karasu",
    openMenu: "Öppna menyn",
    closeMenu: "Stäng menyn",
  },
  hero: {
    eyebrow: "Gratis · öppen källkod · för AniList",
    title: "AniList-klienten som för in dina avsnitt åt dig",
    lede: "Dina listor, säsongen, sändningskalendern, statistik, flödet och forumet i ett snabbt fönster — och en igenkänning som uppdaterar din lista när ett avsnitt är slut.",
    windows: "Ladda ned för Windows",
    linux: "Linux",
    android: "Android",
    note: "Version {version}. Windows-installationsprogrammet är inte kodsignerat, så SmartScreen kan varna vid första starten · Linux är en experimentell AppImage · Android är en APK för sideloading · inget macOS",
    checksums: "kontrollsummor",
    everyDownload: "alla nedladdningar",
  },
  changes: {
    title: "Vad som är nytt",
    nightly: "I Nightly",
    version: "Version {version}",
    since: "Sedan {version}, ännu inte i någon Stable-version",
    added: "Tillagt",
    changed: "Ändrat",
    fixed: "Åtgärdat",
    whole: "Hela ändringsloggen",
  },
  gallery: {
    eyebrow: "Skärmbilder",
    title: "Appen precis som den är",
    which: "Vilka skärmbilder",
    desktop: "Dator",
    android: "Android",
    open: "Öppna: {caption}",
    dialog: "Skärmbild {n} av {total}: {caption}",
    previous: "Föregående skärmbild",
    next: "Nästa skärmbild",
    close: "Stäng",
  },
  join: {
    title: "Prova den och berätta hur det gick",
    body: "Karasu byggs av en enda underhållare tillsammans med alla som vill vara med. En buggrapport, en idé eller ett meddelande om att något fungerar på din dator hjälper, framför allt på Linux och Android.",
    discord: "Gå med i Discord",
    bug: "Rapportera en bugg",
    source: "Källkod på GitHub",
  },
  faq: {
    eyebrow: "Vanliga frågor",
    title: "Frågor, besvarade utifrån koden.",
    items: {
      what: {
        q: "Vad är Karasu?",
        a: "En dator- och Android-app som sköter din anime- och mangalista på AniList. Den märker vad du spelar upp eller läser och uppdaterar dina framsteg på AniList av sig själv, och frågar först en gång när det gäller ett kapitel från en sida den inte känner till vid namn. Dessutom ger den listan ett snabbt lokalt gränssnitt med statistik, aviseringar och de sociala sidorna.",
      },
      free: {
        q: "Är den gratis?",
        a: "Ja. Karasu kostar ingenting och släpps under GNU AGPL-3.0, eller en senare version. Det finns ingen betalnivå och inget att låsa upp.",
      },
      open: {
        q: "Har den öppen källkod?",
        a: "Ja. Hela källkoden finns på GitHub, och varje version byggs där från en taggad commit.",
      },
      anilist: {
        q: "Vad är AniList?",
        a: "En gratis databas och spårningssajt för anime och manga på anilist.co. Din lista finns där; Karasu läser och skriver den via AniLists öppna API.",
      },
      replace: {
        q: "Ersätter Karasu AniList?",
        a: "Nej. Det är en klient till AniList. Din lista ligger kvar på AniList, och varje ändring Karasu gör syns på webbplatsen en liten stund senare. Du kan också använda Karasu helt utan konto, med enbart en lokal lista.",
      },
      platforms: {
        q: "Vilka plattformar stöds?",
        a: "Windows och Android är Stable, Linux är en experimentell AppImage, och det finns inget bygge för macOS. Windows har alla funktioner. Android har listan, statistik, aviseringar, widgets, de sociala sidorna och en egen uppdaterare, men inget lokalt bibliotek och inget aktivitetsfält. Igenkänningen skiljer sig åt: Windows läser mediesessioner, spelar- och webbläsarfönster, mpv och Jellyfin; Linux läser mediesessioner, mpv och Jellyfin, men inga fönstertitlar; Android läser Jellyfin.",
      },
      credentials: {
        q: "Sparar Karasu mina AniList-uppgifter?",
        a: "Den ser aldrig ditt lösenord. Inloggningen sker på anilist.co i din webbläsare, som ger Karasu en token. Den token förvaras i operativsystemets inloggningsuppgiftslager på datorn, i en krypterad fil bredvid appen i portabelt läge och i en Keystore-förseglad fil på Android — och den lämnas aldrig tillbaka till appens webbvy.",
      },
      offline: {
        q: "Fungerar Karasu offline?",
        a: "Din lista cachas lokalt, så den öppnas utan nätverk, en titel på den visar sin cachade sida med ett fungerande +1, och ändringar köas och skickas när anslutningen är tillbaka. Titlar som inte finns på din lista, sökning och de sociala sidorna kräver nätverk.",
      },
      automatic: {
        q: "Uppdaterar den mina framsteg på AniList automatiskt?",
        a: "Ja, som standard när ett avsnitt har spelats i två tredjedelar av sin längd — eller i de minuter du ställer in, eller efter att du bekräftat en avisering, om du hellre vill bli tillfrågad. Ett kapitel från en sida som Karasu inte känner till vid namn frågar alltid först. Framstegen går bara framåt, och Karasu läser om din lista precis innan den skriver.",
      },
      affiliated: {
        q: "Är Karasu knutet till AniList?",
        a: "Nej. Det är ett oberoende projekt som använder AniLists öppna API, med ett registrerat klient-id och utan särskild åtkomst.",
      },
      smartscreen: {
        q: "Varför varnar Windows när jag installerar den?",
        a: "Installationsprogrammet är inte kodsignerat, så SmartScreen har aldrig sett det förut och säger det. Varje version levereras med en SHA256SUMS.txt som du kan kontrollera nedladdningen mot.",
      },
      network: {
        q: "Vad pratar Karasu med?",
        a: "AniLists API och bildservrar; GitHub, för uppdateringskontrollen och nedladdningen; communityns data om avsnittsrelationer på GitHub, högst en gång i veckan; din egen Jellyfin-server om du har ställt in en; Discords lokala socket för Rich Presence om du slår på det. Bilder i AniList-användarnas biografier hämtas via Karasus egen begränsade proxy, så de värdarna får veta din IP-adress när du öppnar en profil. Inget annat, och ingen analys.",
      },
    },
  },
  footer: {
    tagline: "En modern anime- och mangaspårare — byggd uteslutande för AniList.",
    badge: "Öppen källkod · gratis",
    project: "Projekt",
    github: "GitHub",
    download: "Ladda ned",
    changelog: "Ändringslogg",
    nightly: "Nightly-byggen",
    help: "Hjälp",
    docs: "Dokumentation",
    issue: "Rapportera ett problem",
    feature: "Föreslå en funktion",
    discord: "Discord",
    elsewhere: "På andra ställen",
    anilist: "AniList",
    security: "Säkerhetspolicy",
    contributing: "Bidra",
    license: "AGPL-3.0-licens",
    copyright: "Licensierad under AGPL-3.0 · © 2026 Kyusetzu och Karasus bidragsgivare",
    disclaimer:
      "Karasu är ett oberoende projekt och är inte knutet till eller godkänt av AniList. SN Pro används under SIL Open Font License 1.1.",
    language: "Språk",
    aiNote: "Alla språk utom engelska och tyska är AI-översättningar som ingen person har granskat.",
  },
  notFound: {
    title: "Här sitter ingen.",
    body: "Sidan du letade efter finns inte. Hela webbplatsen är en enda sida, och det här är inte den.",
    back: "Tillbaka till Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Animelistan som ett omslagsrutnät, med statusarna och egna listor i en kolumn bredvid och sök, sortering, filter och förinställningar ovanför.",
      caption: "Animelista, rutnätsvy",
    },
    overview: {
      alt: "Översikten: en hälsning med sök och de kommande 48 timmarna över en säsongs banner, listorna som hyllor, de sändande titlarna att komma ikapp med och en kolumn med statistiken och din egen aktivitet.",
      caption: "Översikt — dina listor, veckan, vad du kan komma ikapp med",
    },
    "now-playing": {
      alt: "Fönstret Spelas nu svävar över animelistan: Mushoku Tensei säsong tre känns igen i mpv, säsong 3 avsnitt 9, med de framsteg som kommer att skrivas.",
      caption: "Spelas nu — ett avsnitt känns igen i mpv",
    },
    seasonal: {
      alt: "Säsongssidan: höstens 2026 titlar som kort med sina genrer och en nedräkning, med år, säsong och format i en kolumn bredvid.",
      caption: "Säsong",
    },
    calendar: {
      alt: "Kalenderns agenda: veckans sända avsnitt från och med i dag, vart och ett på ett kort med omslag, tid och avsnittsnummer.",
      caption: "Kalender",
    },
    "stats-overview": {
      alt: "Statistiksidans översikt: listans totaler, en ring av statusar och format, ursprungsländerna, vart tittartiden gick och seriernas längder.",
      caption: "Statistik — översikt",
    },
    franchise: {
      alt: "Franchisegrafen för Mushoku Tensei: tredje säsongen länkad till de tidigare säsongerna, light novel-romanen och en spinoff-manga, med den valda titelns kort vid sidan.",
      caption: "Franchisegraf",
    },
    "phone-overview": {
      alt: "Översikten i mobilen: en hälsning med sök över en säsongs banner och listorna som hyllor, ovanför det nedre fältet.",
      caption: "Android — översikt",
    },
    "phone-list": {
      alt: "Animelistan i mobilen som ett omslagsrutnät med tre kolumner, med statusväljaren och listans sök ovanför.",
      caption: "Android — animelista",
    },
    "phone-detail": {
      alt: "Detaljsidan för Mushoku Tensei i mobilen med statusbladet öppet: status, framsteg och betyg ovanför communityns egen betygsfördelning.",
      caption: "Android — en titel, med dess post öppen",
    },
    "phone-search": {
      alt: "Söksidan i mobilen med resultaten för ”season 2” som ett omslagsrutnät.",
      caption: "Android — sök",
    },
  },
} satisfies Messages;
