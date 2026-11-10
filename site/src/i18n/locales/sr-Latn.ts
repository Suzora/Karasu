import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — moderni tracker animea i mange za AniList",
    description:
      "Karasu je besplatan tracker animea i mange otvorenog koda, napravljen isključivo za AniList. Primećuje šta pokrećeš — a na Windowsu i šta čitaš — i drži tvoj napredak na AniListu usklađenim. Windows, Linux i Android.",
    notFoundTitle: "Stranica nije pronađena — Karasu",
  },
  skip: "Preskoči na sadržaj",
  nav: {
    label: "Glavna navigacija",
    home: "Karasu — nazad na vrh",
    changes: "Šta je novo",
    screenshots: "Snimci ekrana",
    join: "Uključi se",
    faq: "FAQ",
    github: "GitHub",
    download: "Preuzmi",
    downloadKarasu: "Preuzmi Karasu",
    openMenu: "Otvori meni",
    closeMenu: "Zatvori meni",
  },
  hero: {
    eyebrow: "Besplatno · otvoreni kod · za AniList",
    title: "AniList klijent koji sam upisuje tvoje epizode",
    lede: "Tvoje liste, sezona, kalendar emitovanja, statistika, feed i forum u jednom brzom prozoru, uz prepoznavanje koje ažurira tvoju listu kad epizoda završi.",
    windows: "Preuzmi za Windows",
    linux: "Linux",
    android: "Android",
    note: "Verzija {version}. Windows instalater nije potpisan, pa SmartScreen može da upozori pri prvom pokretanju · Linux je eksperimentalni AppImage · Android je APK za ručnu instalaciju · nema macOS-a",
    checksums: "kontrolne sume",
    everyDownload: "svako preuzimanje",
  },
  changes: {
    title: "Šta je novo",
    nightly: "U Nightlyju",
    version: "Verzija {version}",
    since: "Od {version}, još nije u Stable izdanju",
    added: "Dodato",
    changed: "Promenjeno",
    fixed: "Ispravljeno",
    whole: "Ceo spisak promena",
  },
  gallery: {
    eyebrow: "Snimci ekrana",
    title: "Aplikacija onakva kakva jeste",
    which: "Koji snimci ekrana",
    desktop: "Računar",
    android: "Android",
    open: "Otvori: {caption}",
    dialog: "Snimak ekrana {n} od {total}: {caption}",
    previous: "Prethodni snimak ekrana",
    next: "Sledeći snimak ekrana",
    close: "Zatvori",
  },
  join: {
    title: "Isprobaj i javi nam kako je prošlo",
    body: "Karasu pravi jedan maintainer zajedno sa svima koji se uključe. Pomaže prijava greške, ideja ili poruka da nešto radi na tvom računaru, naročito na Linuxu i Androidu.",
    discord: "Pridruži se Discordu",
    bug: "Prijavi grešku",
    source: "Izvorni kod na GitHubu",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Pitanja, odgovorena iz koda.",
    items: {
      what: {
        q: "Šta je Karasu?",
        a: "Aplikacija za računar i Android koja vodi tvoju listu animea i mange na AniListu. Primećuje šta gledaš ili čitaš i sama ažurira tvoj napredak na AniListu, a za poglavlje sa sajta koji ne imenuje prvo jednom pita, i toj listi daje brz lokalni interfejs sa statistikom, obaveštenjima i društvenim stranicama.",
      },
      free: {
        q: "Da li je besplatan?",
        a: "Da. Karasu je besplatan i objavljen pod licencom GNU AGPL-3.0 ili bilo kojom novijom verzijom. Nema plaćenog nivoa i ništa se ne otključava.",
      },
      open: {
        q: "Da li je otvorenog koda?",
        a: "Da. Ceo izvorni kod je na GitHubu, a svako izdanje se tamo gradi iz označenog commita.",
      },
      anilist: {
        q: "Šta je AniList?",
        a: "Besplatna baza podataka i sajt za praćenje animea i mange na anilist.co. Tvoja lista živi tamo; Karasu je čita i piše u nju preko javnog API-ja AniLista.",
      },
      replace: {
        q: "Da li Karasu zamenjuje AniList?",
        a: "Ne. On je klijent za njega. Tvoja lista ostaje na AniListu i svaka promena koju Karasu napravi vidljiva je na sajtu trenutak kasnije. Karasu možeš koristiti i bez ikakvog naloga, samo sa lokalnom listom.",
      },
      platforms: {
        q: "Koje platforme su podržane?",
        a: "Windows i Android su Stable, Linux je eksperimentalni AppImage, a za macOS nema builda. Windows ima sve funkcije. Android ima listu, statistiku, obaveštenja, vidžete, društvene stranice i sopstveni ažurirač, ali nema lokalnu biblioteku ni tray. Prepoznavanje se razlikuje: Windows čita medijske sesije, prozore plejera i pregledača, mpv i Jellyfin; Linux čita medijske sesije, mpv i Jellyfin, bez naslova prozora; Android čita Jellyfin.",
      },
      credentials: {
        q: "Da li Karasu čuva moje AniList pristupne podatke?",
        a: "Tvoju lozinku nikad ne vidi. Prijava se odvija na anilist.co u tvom pregledaču, koji Karasuu predaje token. Taj token se na računaru čuva u skladištu pristupnih podataka tvog operativnog sistema, u prenosivom režimu u šifrovanoj datoteci pored aplikacije, a na Androidu u datoteci zapečaćenoj Keystoreom — i nikad se ne vraća veb prikazu aplikacije.",
      },
      offline: {
        q: "Može li Karasu da radi bez mreže?",
        a: "Tvoja lista se čuva lokalno, pa se otvara bez mreže, naslov sa nje prikazuje svoju sačuvanu stranicu sa funkcionalnim +1, a izmene čekaju u redu i šalju se kad se veza vrati. Pregledanje naslova koji nisu na tvojoj listi, pretraga i društvene stranice traže mrežu.",
      },
      automatic: {
        q: "Da li automatski ažurira moj napredak na AniListu?",
        a: "Da, čim se epizoda reprodukuje dve trećine svoje dužine po podrazumevanim podešavanjima — ili onoliko minuta koliko podesiš, ili nakon što potvrdiš obaveštenje, ako želiš da te pita. Poglavlje sa sajta koji Karasu ne imenuje uvek prvo pita. Napredak ide samo napred, a Karasu ponovo čita tvoju listu neposredno pre upisivanja.",
      },
      affiliated: {
        q: "Da li je Karasu povezan sa AniListom?",
        a: "Ne. To je nezavisan projekat koji koristi javni API AniLista, sa registrovanim client idom i bez posebnog pristupa.",
      },
      smartscreen: {
        q: "Zašto me Windows upozorava pri instalaciji?",
        a: "Instalater nije potpisan, pa ga SmartScreen još nikad nije video i to kaže. Svako izdanje uključuje SHA256SUMS.txt kojim možeš proveriti preuzetu datoteku.",
      },
      network: {
        q: "Sa čime Karasu komunicira?",
        a: "Sa API-jem i serverima slika AniLista; sa GitHubom, radi provere ažuriranja i preuzimanja; sa podacima zajednice o vezama među epizodama na GitHubu, najviše jednom nedeljno; sa tvojim sopstvenim Jellyfin serverom ako ga podesiš; sa lokalnim socketom Discorda za Rich Presence ako ga uključiš. Slike u biografijama korisnika AniLista preuzimaju se preko Karasuovog sopstvenog ograničenog proxyja, pa ti hostovi saznaju tvoju IP adresu kad otvoriš profil. Ništa drugo i nikakva analitika.",
      },
    },
  },
  footer: {
    tagline: "Moderni tracker animea i mange — napravljen isključivo za AniList.",
    badge: "Otvoreni kod · besplatno",
    project: "Projekat",
    github: "GitHub",
    download: "Preuzmi",
    changelog: "Spisak promena",
    nightly: "Nightly buildovi",
    help: "Pomoć",
    docs: "Dokumentacija",
    issue: "Prijavi problem",
    feature: "Zatraži funkciju",
    discord: "Discord",
    elsewhere: "Na drugim mestima",
    anilist: "AniList",
    security: "Bezbednosna politika",
    contributing: "Doprinos",
    license: "Licenca AGPL-3.0",
    copyright: "Licencirano pod AGPL-3.0 · © 2026 Kyusetzu i saradnici Karasua",
    disclaimer:
      "Karasu je nezavisan projekat i nije povezan sa AniListom niti ga AniList podržava. SN Pro se koristi pod licencom SIL Open Font License 1.1.",
    language: "Jezik",
    aiNote: "Svaki jezik osim engleskog i nemačkog je AI prevod koji nijedna osoba nije pregledala.",
  },
  notFound: {
    title: "Ovde niko ne sedi.",
    body: "Stranica koju si tražio ne postoji. Ceo sajt je jedna stranica, a ovo nije ona.",
    back: "Nazad na Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Lista animea kao rešetka korica, sa statusima i prilagođenim listama u koloni pored nje i pretragom, sortiranjem, filterima i šablonima iznad.",
      caption: "Lista animea, prikaz rešetke",
    },
    overview: {
      alt: "Pregled: pozdrav sa pretragom i narednih 48 sati preko banera sezone, liste kao police, naslovi koji se emituju i koje treba stići da pogledaš i kolona sa statistikom i tvojom aktivnošću.",
      caption: "Pregled — tvoje liste, nedelja, šta treba stići",
    },
    "now-playing": {
      alt: "Prozor „Trenutno se reprodukuje“ lebdi iznad liste animea: treća sezona Mushoku Tensei prepoznata u mpv-u, sezona 3 epizoda 9, sa napretkom koji će upisati.",
      caption: "Trenutno se reprodukuje — epizoda prepoznata u mpv-u",
    },
    seasonal: {
      alt: "Stranica Sezona: naslovi jeseni 2026. kao kartice sa žanrovima i odbrojavanjem, a pored njih kolona sa godinom, sezonom i formatima.",
      caption: "Sezona",
    },
    calendar: {
      alt: "Dnevni red kalendara: epizode nedelje koje se emituju od danas, svaka na kartici sa koricom, vremenom i brojem epizode.",
      caption: "Kalendar",
    },
    "stats-overview": {
      alt: "Pregled stranice Statistika: ukupni zbirovi liste, prsten statusa i formata, zemlje porekla, kuda je otišlo vreme gledanja i dužine serija.",
      caption: "Statistika — pregled",
    },
    franchise: {
      alt: "Graf franšize Mushoku Tensei: treća sezona povezana sa ranijim sezonama, light novelom i spin-off mangom, sa karticom izabranog naslova sa strane.",
      caption: "Graf franšize",
    },
    "phone-overview": {
      alt: "Pregled na telefonu: pozdrav sa pretragom preko banera sezone i liste kao police, iznad donje trake.",
      caption: "Android — pregled",
    },
    "phone-list": {
      alt: "Lista animea na telefonu kao rešetka korica u tri kolone, sa izborom statusa i pretragom liste iznad.",
      caption: "Android — lista animea",
    },
    "phone-detail": {
      alt: "Stranica sa detaljima Mushoku Tensei na telefonu sa otvorenim listom statusa: status, napredak i ocena iznad raspodele ocena zajednice.",
      caption: "Android — naslov sa otvorenim unosom",
    },
    "phone-search": {
      alt: "Stranica pretrage na telefonu sa rezultatima za „season 2“ kao rešetka korica.",
      caption: "Android — pretraga",
    },
  },
} satisfies Messages;
