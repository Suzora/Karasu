import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Moderný tracker anime a mangy pre AniList",
    description:
      "Karasu je bezplatný open-source tracker anime a mangy, vytvorený výhradne pre AniList. Všimne si, čo prehrávaš — a vo Windowse aj čo čítaš — a udržiava tvoj postup na AniList aktuálny. Windows, Linux a Android.",
    notFoundTitle: "Stránka sa nenašla — Karasu",
  },
  skip: "Prejsť na obsah",
  nav: {
    label: "Hlavná ponuka",
    home: "Karasu — späť hore",
    changes: "Čo je nové",
    screenshots: "Snímky obrazovky",
    join: "Zapoj sa",
    faq: "Časté otázky",
    github: "GitHub",
    download: "Stiahnuť",
    downloadKarasu: "Stiahnuť Karasu",
    openMenu: "Otvoriť ponuku",
    closeMenu: "Zavrieť ponuku",
  },
  hero: {
    eyebrow: "Zadarmo · open source · pre AniList",
    title: "Klient AniList, ktorý ti zapisuje epizódy za teba",
    lede: "Tvoje zoznamy, sezóna, kalendár vysielania, štatistiky, novinky a fórum v jednom rýchlom okne — a rozpoznávanie, ktoré po skončení epizódy aktualizuje tvoj zoznam.",
    windows: "Stiahnuť pre Windows",
    linux: "Linux",
    android: "Android",
    note: "Verzia {version}. Inštalátor pre Windows nie je podpísaný, takže SmartScreen môže pri prvom spustení varovať · Linux je experimentálny AppImage · Android je APK na ručnú inštaláciu · žiadny macOS",
    checksums: "kontrolné súčty",
    everyDownload: "všetky stiahnutia",
  },
  changes: {
    title: "Čo je nové",
    nightly: "V Nightly",
    version: "Verzia {version}",
    since: "Od {version}, zatiaľ v žiadnom vydaní Stable",
    added: "Pridané",
    changed: "Zmenené",
    fixed: "Opravené",
    whole: "Celý zoznam zmien",
  },
  gallery: {
    eyebrow: "Snímky obrazovky",
    title: "Aplikácia taká, aká je",
    which: "Ktoré snímky obrazovky",
    desktop: "Počítač",
    android: "Android",
    open: "Otvoriť: {caption}",
    dialog: "Snímka obrazovky {n} z {total}: {caption}",
    previous: "Predchádzajúca snímka obrazovky",
    next: "Ďalšia snímka obrazovky",
    close: "Zavrieť",
  },
  join: {
    title: "Vyskúšaj to a napíš nám, ako to dopadlo",
    body: "Karasu vyvíja jeden správca spolu s každým, kto sa pridá. Nahlásená chyba, nápad alebo správa, že niečo funguje na tvojom počítači, pomáha — hlavne na Linuxe a Androide.",
    discord: "Pripojiť sa na Discord",
    bug: "Nahlásiť chybu",
    source: "Zdrojový kód na GitHube",
  },
  faq: {
    eyebrow: "Časté otázky",
    title: "Otázky, na ktoré odpovedá kód.",
    items: {
      what: {
        q: "Čo je Karasu?",
        a: "Aplikácia pre počítač a Android, ktorá spravuje tvoj zoznam anime a mangy na AniList. Všimne si, čo prehrávaš alebo čítaš, a sama aktualizuje tvoj postup na AniList — pri kapitole z webu, ktorý nepozná menom, sa najprv raz opýta — a dáva tomuto zoznamu rýchle lokálne rozhranie so štatistikami, oznámeniami a sociálnymi stránkami.",
      },
      free: {
        q: "Je zadarmo?",
        a: "Áno. Karasu je zadarmo a vychádza pod licenciou GNU AGPL-3.0 alebo ktoroukoľvek neskoršou verziou. Neexistuje žiadna platená úroveň ani nič, čo by sa dalo odomknúť.",
      },
      open: {
        q: "Je open source?",
        a: "Áno. Celý zdrojový kód je na GitHube a každé vydanie sa tam zostavuje z označeného commitu.",
      },
      anilist: {
        q: "Čo je AniList?",
        a: "Bezplatná databáza a sledovacia stránka pre anime a mangu na anilist.co. Tvoj zoznam je tam; Karasu ho číta a zapisuje cez verejné API AniList.",
      },
      replace: {
        q: "Nahrádza Karasu AniList?",
        a: "Nie. Je to klient pre AniList. Tvoj zoznam zostáva na AniList a každá zmena, ktorú Karasu urobí, je o chvíľu viditeľná na webe. Karasu môžeš používať aj úplne bez účtu, len s lokálnym zoznamom.",
      },
      platforms: {
        q: "Ktoré platformy sú podporované?",
        a: "Windows a Android sú Stable, Linux je experimentálny AppImage a zostavenie pre macOS neexistuje. Windows má všetky funkcie. Android má zoznam, štatistiky, oznámenia, widgety, sociálne stránky a vlastný aktualizátor, ale nemá lokálnu knižnicu ani oznamovaciu oblasť. Rozpoznávanie sa líši: Windows číta mediálne relácie, okná prehrávačov a prehliadačov, mpv a Jellyfin; Linux číta mediálne relácie, mpv a Jellyfin, bez názvov okien; Android číta Jellyfin.",
      },
      credentials: {
        q: "Ukladá Karasu moje prihlasovacie údaje k AniList?",
        a: "Heslo nikdy nevidí. Prihlásenie prebieha na anilist.co v tvojom prehliadači, ktorý Karasu odovzdá token. Tento token sa na počítači ukladá do úložiska prihlasovacích údajov operačného systému, v prenosnom režime do šifrovaného súboru vedľa aplikácie a na Androide do súboru zapečateného cez Keystore — a nikdy sa neodovzdáva späť webovému zobrazeniu aplikácie.",
      },
      offline: {
        q: "Funguje Karasu offline?",
        a: "Tvoj zoznam sa ukladá do lokálnej vyrovnávacej pamäte, takže sa otvorí bez siete, titul na ňom ukáže svoju uloženú stránku s funkčným +1 a úpravy sa zaradia do frontu a odošlú, keď sa pripojenie vráti. Prehliadanie titulov mimo tvojho zoznamu, vyhľadávanie a sociálne stránky potrebujú sieť.",
      },
      automatic: {
        q: "Aktualizuje môj postup na AniList automaticky?",
        a: "Áno, predvolene potom, čo epizóda bežala dve tretiny svojej dĺžky — alebo nastavený počet minút, alebo po potvrdení oznámenia, ak sa radšej necháš pýtať. Kapitola z webu, ktorý Karasu nepozná menom, sa vždy najprv opýta. Postup sa posúva len dopredu a Karasu si tvoj zoznam tesne pred zápisom znova prečíta.",
      },
      affiliated: {
        q: "Je Karasu spojené s AniList?",
        a: "Nie. Je to nezávislý projekt, ktorý používa verejné API AniList s registrovaným ID klienta a bez osobitného prístupu.",
      },
      smartscreen: {
        q: "Prečo Windows pri inštalácii varuje?",
        a: "Inštalátor nie je podpísaný, takže ho SmartScreen nikdy predtým nevidel a hovorí to. Každé vydanie obsahuje súbor SHA256SUMS.txt, voči ktorému môžeš stiahnutý súbor skontrolovať.",
      },
      network: {
        q: "S kým Karasu komunikuje?",
        a: "S API a obrazovými servermi AniList; s GitHubom kvôli kontrole aktualizácií a stiahnutiu; s dátami komunity o vzťahoch epizód na GitHube, najviac raz týždenne; s tvojím vlastným serverom Jellyfin, ak ho nastavíš; s lokálnym socketom Discordu pre Rich Presence, ak to zapneš. Obrázky v bio používateľov AniList sa načítavajú cez vlastnú obmedzenú proxy Karasu, takže tieto servery zistia tvoju IP adresu, keď otvoríš profil. Nič iné a žiadna analytika.",
      },
    },
  },
  footer: {
    tagline: "Moderný tracker anime a mangy — vytvorený výhradne pre AniList.",
    badge: "Open source · zadarmo",
    project: "Projekt",
    github: "GitHub",
    download: "Stiahnuť",
    changelog: "Zoznam zmien",
    nightly: "Zostavenia Nightly",
    help: "Pomoc",
    docs: "Dokumentácia",
    issue: "Nahlásiť problém",
    feature: "Navrhnúť funkciu",
    discord: "Discord",
    elsewhere: "Inde",
    anilist: "AniList",
    security: "Zásady zabezpečenia",
    contributing: "Prispievanie",
    license: "Licencia AGPL-3.0",
    copyright: "Licencované pod AGPL-3.0 · © 2026 Kyu a prispievatelia Karasu",
    disclaimer:
      "Karasu je nezávislý projekt a nie je spojený s AniList ani ním schválený. SN Pro sa používa pod licenciou SIL Open Font License 1.1.",
    language: "Jazyk",
    aiNote: "Každý jazyk okrem angličtiny a nemčiny je preklad umelej inteligencie, ktorý žiadny človek nekontroloval.",
  },
  notFound: {
    title: "Nikto tu nesedí.",
    body: "Stránka, ktorú hľadáš, neexistuje. Celý web je jedna stránka a toto nie je ona.",
    back: "Späť na Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Zoznam anime ako mriežka obálok, vedľa nej stĺpec so stavmi a vlastnými zoznamami a nad ňou vyhľadávanie, zoradenie, filtre a predvoľby.",
      caption: "Zoznam anime, zobrazenie mriežky",
    },
    overview: {
      alt: "Prehľad: uvítanie s vyhľadávaním a najbližšími 48 hodinami nad bannerom sezóny, zoznamy ako police, vysielané tituly na dobehnutie a stĺpec so štatistikami a tvojou vlastnou aktivitou.",
      caption: "Prehľad — tvoje zoznamy, týždeň, čo môžeš dobehnúť",
    },
    "now-playing": {
      alt: "Okno Práve sa prehráva sa vznáša nad zoznamom anime: tretia séria Mushoku Tensei rozpoznaná v mpv, séria 3 epizóda 9, s postupom, ktorý zapíše.",
      caption: "Práve sa prehráva — epizóda rozpoznaná v mpv",
    },
    seasonal: {
      alt: "Stránka sezóny: tituly jesene 2026 ako karty so žánrami a odpočtom, vedľa nich stĺpec s rokom, sezónou a formátmi.",
      caption: "Sezóna",
    },
    calendar: {
      alt: "Program kalendára: vysielané epizódy týždňa od dnešného dňa, každá na karte s obálkou, časom a číslom epizódy.",
      caption: "Kalendár",
    },
    "stats-overview": {
      alt: "Prehľad stránky štatistík: súčty zoznamu, prstenec stavov a formátov, krajiny pôvodu, kam odišiel čas sledovania, a dĺžky seriálov.",
      caption: "Štatistiky — prehľad",
    },
    franchise: {
      alt: "Graf franšízy Mushoku Tensei: tretia séria prepojená s predchádzajúcimi sériami, light novelou a spin-off mangou, vedľa karta vybraného titulu.",
      caption: "Graf franšízy",
    },
    "phone-overview": {
      alt: "Prehľad v telefóne: uvítanie s vyhľadávaním nad bannerom sezóny a zoznamy ako police, nad spodným panelom.",
      caption: "Android — prehľad",
    },
    "phone-list": {
      alt: "Zoznam anime v telefóne ako trojstĺpcová mriežka obálok, nad ňou výber stavu a vyhľadávanie v zozname.",
      caption: "Android — zoznam anime",
    },
    "phone-detail": {
      alt: "Stránka podrobností Mushoku Tensei v telefóne s otvoreným listom stavu: stav, postup a hodnotenie nad rozložením hodnotení komunity.",
      caption: "Android — titul s otvoreným záznamom",
    },
    "phone-search": {
      alt: "Stránka vyhľadávania v telefóne s výsledkami pre „season 2“ ako mriežkou obálok.",
      caption: "Android — vyhľadávanie",
    },
  },
} satisfies Messages;
