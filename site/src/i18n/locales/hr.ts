import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — moderni tracker animea i mange za AniList",
    description:
      "Karasu je besplatan tracker animea i mange otvorenog koda, izrađen isključivo za AniList. Primjećuje što pokrećeš — a na Windowsima i što čitaš — te drži tvoj napredak na AniListu usklađenim. Windows, Linux i Android.",
    notFoundTitle: "Stranica nije pronađena — Karasu",
  },
  skip: "Preskoči na sadržaj",
  nav: {
    label: "Glavna navigacija",
    home: "Karasu — natrag na vrh",
    changes: "Što je novo",
    screenshots: "Snimke zaslona",
    join: "Uključi se",
    faq: "FAQ",
    github: "GitHub",
    download: "Preuzmi",
    downloadKarasu: "Preuzmi Karasu",
    openMenu: "Otvori izbornik",
    closeMenu: "Zatvori izbornik",
  },
  hero: {
    eyebrow: "Besplatno · otvoreni kod · za AniList",
    title: "AniList klijent koji sam upisuje tvoje epizode",
    lede: "Tvoji popisi, sezona, kalendar emitiranja, statistika, feed i forum u jednom brzom prozoru, uz prepoznavanje koje ažurira tvoj popis kad epizoda završi.",
    windows: "Preuzmi za Windows",
    linux: "Linux",
    android: "Android",
    note: "Verzija {version}. Windows instalacijski program nije potpisan, pa SmartScreen može upozoriti pri prvom pokretanju · Linux je eksperimentalni AppImage · Android je APK za ručnu instalaciju · nema macOS-a",
    checksums: "kontrolni zbrojevi",
    everyDownload: "svako preuzimanje",
  },
  changes: {
    title: "Što je novo",
    nightly: "U Nightlyju",
    version: "Verzija {version}",
    since: "Od {version}, još nije u Stable izdanju",
    added: "Dodano",
    changed: "Promijenjeno",
    fixed: "Ispravljeno",
    whole: "Cijeli popis promjena",
  },
  gallery: {
    eyebrow: "Snimke zaslona",
    title: "Aplikacija onakva kakva jest",
    which: "Koje snimke zaslona",
    desktop: "Računalo",
    android: "Android",
    open: "Otvori: {caption}",
    dialog: "Snimka zaslona {n} od {total}: {caption}",
    previous: "Prethodna snimka zaslona",
    next: "Sljedeća snimka zaslona",
    close: "Zatvori",
  },
  join: {
    title: "Isprobaj i javi nam kako je prošlo",
    body: "Karasu gradi jedan maintainer zajedno sa svima koji se uključe. Pomaže prijava greške, ideja ili poruka da nešto radi na tvom računalu, osobito na Linuxu i Androidu.",
    discord: "Pridruži se Discordu",
    bug: "Prijavi grešku",
    source: "Izvorni kod na GitHubu",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Pitanja, odgovorena iz koda.",
    items: {
      what: {
        q: "Što je Karasu?",
        a: "Aplikacija za računalo i Android koja vodi tvoj popis animea i mange na AniListu. Primjećuje što gledaš ili čitaš i sama ažurira tvoj napredak na AniListu, a za poglavlje s weba koje ne imenuje prvo jednom pita, te tom popisu daje brzo lokalno sučelje sa statistikom, obavijestima i društvenim stranicama.",
      },
      free: {
        q: "Je li besplatan?",
        a: "Da. Karasu je besplatan i objavljen pod licencom GNU AGPL-3.0 ili bilo kojom novijom verzijom. Nema plaćene razine i ništa se ne otključava.",
      },
      open: {
        q: "Je li otvorenog koda?",
        a: "Da. Cijeli izvorni kod je na GitHubu, a svako izdanje gradi se tamo iz označenog commita.",
      },
      anilist: {
        q: "Što je AniList?",
        a: "Besplatna baza podataka i stranica za praćenje animea i mange na anilist.co. Tvoj popis živi tamo; Karasu ga čita i piše u njega preko javnog API-ja AniLista.",
      },
      replace: {
        q: "Zamjenjuje li Karasu AniList?",
        a: "Ne. On je klijent za njega. Tvoj popis ostaje na AniListu i svaka promjena koju Karasu napravi vidljiva je na stranici trenutak poslije. Karasu možeš koristiti i bez ikakvog računa, samo s lokalnim popisom.",
      },
      platforms: {
        q: "Koje su platforme podržane?",
        a: "Windows i Android su Stable, Linux je eksperimentalni AppImage, a za macOS nema builda. Windows ima sve funkcije. Android ima popis, statistiku, obavijesti, widgete, društvene stranice i vlastiti ažurirač, ali nema lokalnu biblioteku ni tray. Prepoznavanje se razlikuje: Windows čita medijske sesije, prozore playera i preglednika, mpv i Jellyfin; Linux čita medijske sesije, mpv i Jellyfin, bez naslova prozora; Android čita Jellyfin.",
      },
      credentials: {
        q: "Sprema li Karasu moje AniList vjerodajnice?",
        a: "Tvoju lozinku nikad ne vidi. Prijava se odvija na anilist.co u tvom pregledniku, koji Karasuu predaje token. Taj se token na računalu čuva u pohrani vjerodajnica tvog operacijskog sustava, u prijenosnom načinu u šifriranoj datoteci pokraj aplikacije, a na Androidu u datoteci zapečaćenoj Keystoreom — i nikad se ne vraća web prikazu aplikacije.",
      },
      offline: {
        q: "Može li Karasu raditi izvan mreže?",
        a: "Tvoj se popis sprema lokalno, pa se otvara bez mreže, naslov s njega prikazuje svoju spremljenu stranicu s funkcionalnim +1, a izmjene čekaju u redu i šalju se kad se veza vrati. Pregledavanje naslova koji nisu na tvom popisu, pretraga i društvene stranice trebaju mrežu.",
      },
      automatic: {
        q: "Ažurira li moj napredak na AniListu automatski?",
        a: "Da, čim se epizoda reproducira dvije trećine svoje duljine prema zadanim postavkama — ili onoliko minuta koliko postaviš, ili nakon što potvrdiš obavijest, ako želiš da te se pita. Poglavlje s weba koje Karasu ne imenuje uvijek prvo pita. Napredak se kreće samo naprijed, a Karasu ponovno čita tvoj popis neposredno prije pisanja.",
      },
      affiliated: {
        q: "Je li Karasu povezan s AniListom?",
        a: "Ne. To je neovisan projekt koji koristi javni API AniLista, s registriranim client idom i bez posebnog pristupa.",
      },
      smartscreen: {
        q: "Zašto me Windows upozorava pri instalaciji?",
        a: "Instalacijski program nije potpisan, pa ga SmartScreen još nikad nije vidio i to kaže. Svako izdanje uključuje SHA256SUMS.txt kojim možeš provjeriti preuzetu datoteku.",
      },
      network: {
        q: "S čime Karasu komunicira?",
        a: "S API-jem i poslužiteljima slika AniLista; s GitHubom, radi provjere ažuriranja i preuzimanja; s podacima zajednice o vezama među epizodama na GitHubu, najviše jednom tjedno; s tvojim vlastitim Jellyfin poslužiteljem ako ga postaviš; s lokalnim socketom Discorda za Rich Presence ako ga uključiš. Slike u biografijama korisnika AniLista dohvaćaju se preko Karasuova vlastitog ograničenog proxyja, pa ti hostovi saznaju tvoju IP adresu kad otvoriš profil. Ništa drugo i nikakva analitika.",
      },
    },
  },
  footer: {
    tagline: "Moderni tracker animea i mange — izrađen isključivo za AniList.",
    badge: "Otvoreni kod · besplatno",
    project: "Projekt",
    github: "GitHub",
    download: "Preuzmi",
    changelog: "Popis promjena",
    nightly: "Nightly buildovi",
    help: "Pomoć",
    docs: "Dokumentacija",
    issue: "Prijavi problem",
    feature: "Zatraži funkciju",
    discord: "Discord",
    elsewhere: "Drugdje",
    anilist: "AniList",
    security: "Sigurnosna politika",
    contributing: "Doprinos",
    license: "Licenca AGPL-3.0",
    copyright: "Licencirano pod AGPL-3.0 · © 2026 Kyu i suradnici Karasua",
    disclaimer:
      "Karasu je neovisan projekt te nije povezan s AniListom niti ga AniList podržava. SN Pro koristi se pod licencom SIL Open Font License 1.1.",
    language: "Jezik",
    aiNote: "Svaki jezik osim engleskog i njemačkog AI je prijevod koji nijedna osoba nije pregledala.",
  },
  notFound: {
    title: "Ovdje nitko ne sjedi.",
    body: "Stranica koju si tražio ne postoji. Cijela web stranica je jedna stranica, a ovo nije ona.",
    back: "Natrag na Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Popis animea kao rešetka naslovnica, sa statusima i prilagođenim popisima u stupcu uz nju te pretragom, sortiranjem, filtrima i predlošcima iznad.",
      caption: "Popis animea, prikaz rešetke",
    },
    overview: {
      alt: "Pregled: pozdrav s pretragom i sljedećih 48 sati preko banera sezone, popisi kao police, naslovi koji se emitiraju i koje treba stići pogledati te stupac sa statistikom i tvojom aktivnošću.",
      caption: "Pregled — tvoji popisi, tjedan, što stići pogledati",
    },
    "now-playing": {
      alt: "Prozor „Trenutno se reproducira“ lebdi iznad popisa animea: treća sezona Mushoku Tensei prepoznata u mpv-u, sezona 3 epizoda 9, s napretkom koji će upisati.",
      caption: "Trenutno se reproducira — epizoda prepoznata u mpv-u",
    },
    seasonal: {
      alt: "Stranica Sezona: naslovi jeseni 2026. kao kartice sa žanrovima i odbrojavanjem, a uz njih stupac s godinom, sezonom i formatima.",
      caption: "Sezona",
    },
    calendar: {
      alt: "Dnevni red kalendara: epizode tjedna koje se emitiraju od danas, svaka na kartici s naslovnicom, vremenom i brojem epizode.",
      caption: "Kalendar",
    },
    "stats-overview": {
      alt: "Pregled stranice Statistika: ukupni zbrojevi popisa, prsten statusa i formata, zemlje podrijetla, kamo je otišlo vrijeme gledanja i duljine serija.",
      caption: "Statistika — pregled",
    },
    franchise: {
      alt: "Graf franšize Mushoku Tensei: treća sezona povezana s ranijim sezonama, light novelom i spin-off mangom, s karticom odabranog naslova sa strane.",
      caption: "Graf franšize",
    },
    "phone-overview": {
      alt: "Pregled na mobitelu: pozdrav s pretragom preko banera sezone i popisi kao police, iznad donje trake.",
      caption: "Android — pregled",
    },
    "phone-list": {
      alt: "Popis animea na mobitelu kao rešetka naslovnica u tri stupca, s odabirom statusa i pretragom popisa iznad.",
      caption: "Android — popis animea",
    },
    "phone-detail": {
      alt: "Stranica s detaljima Mushoku Tensei na mobitelu s otvorenim listom statusa: status, napredak i ocjena iznad raspodjele ocjena zajednice.",
      caption: "Android — naslov s otvorenim unosom",
    },
    "phone-search": {
      alt: "Stranica pretrage na mobitelu s rezultatima za „season 2“ kao rešetka naslovnica.",
      caption: "Android — pretraga",
    },
  },
} satisfies Messages;
