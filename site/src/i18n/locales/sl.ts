import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — sodoben sledilnik animejev in mange za AniList",
    description:
      "Karasu je brezplačen sledilnik animejev in mange z odprto kodo, narejen izključno za AniList. Opazi, kaj predvajaš — in v Windowsih tudi, kaj bereš — ter tvoj napredek na AniListu ohranja usklajen. Windows, Linux in Android.",
    notFoundTitle: "Strani ni mogoče najti — Karasu",
  },
  skip: "Preskoči na vsebino",
  nav: {
    label: "Glavna navigacija",
    home: "Karasu — nazaj na vrh",
    changes: "Kaj je novega",
    screenshots: "Posnetki zaslona",
    join: "Vključi se",
    faq: "FAQ",
    github: "GitHub",
    download: "Prenesi",
    downloadKarasu: "Prenesi Karasu",
    openMenu: "Odpri meni",
    closeMenu: "Zapri meni",
  },
  hero: {
    eyebrow: "Brezplačno · odprta koda · za AniList",
    title: "Odjemalec za AniList, ki namesto tebe vpisuje epizode",
    lede: "Tvoji seznami, sezona, koledar predvajanja, statistika, vir in forum v enem hitrem oknu ter prepoznavanje, ki posodobi tvoj seznam, ko se epizoda konča.",
    windows: "Prenesi za Windows",
    linux: "Linux",
    android: "Android",
    note: "Različica {version}. Namestitveni program za Windows ni podpisan, zato lahko SmartScreen ob prvem zagonu opozori · Linux je eksperimentalni AppImage · Android je APK za ročno namestitev · brez macOS",
    checksums: "kontrolne vsote",
    everyDownload: "vsak prenos",
  },
  changes: {
    title: "Kaj je novega",
    nightly: "V Nightlyju",
    version: "Različica {version}",
    since: "Od {version}, še ne v izdaji Stable",
    added: "Dodano",
    changed: "Spremenjeno",
    fixed: "Popravljeno",
    whole: "Celoten seznam sprememb",
  },
  gallery: {
    eyebrow: "Posnetki zaslona",
    title: "Aplikacija, kakršna je",
    which: "Kateri posnetki zaslona",
    desktop: "Računalnik",
    android: "Android",
    open: "Odpri: {caption}",
    dialog: "Posnetek zaslona {n} od {total}: {caption}",
    previous: "Prejšnji posnetek zaslona",
    next: "Naslednji posnetek zaslona",
    close: "Zapri",
  },
  join: {
    title: "Preizkusi in nam povej, kako je šlo",
    body: "Karasu gradi en vzdrževalec skupaj z vsemi, ki se pridružijo. Pomaga prijava napake, ideja ali sporočilo, da nekaj deluje na tvojem računalniku, predvsem v Linuxu in Androidu.",
    discord: "Pridruži se Discordu",
    bug: "Prijavi napako",
    source: "Izvorna koda na GitHubu",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Vprašanja, na katera odgovarja koda.",
    items: {
      what: {
        q: "Kaj je Karasu?",
        a: "Aplikacija za računalnik in Android, ki vodi tvoj seznam animejev in mange na AniListu. Opazi, kaj gledaš ali bereš, in sama posodobi tvoj napredek na AniListu, pri poglavju s spletnega mesta, ki ga ne imenuje, pa najprej enkrat vpraša, ter temu seznamu da hiter lokalni vmesnik s statistiko, obvestili in družabnimi stranmi.",
      },
      free: {
        q: "Ali je brezplačen?",
        a: "Da. Karasu je brezplačen in izdan pod licenco GNU AGPL-3.0 ali katero koli novejšo različico. Plačljive ravni ni in ničesar ni treba odklepati.",
      },
      open: {
        q: "Ali je odprtokoden?",
        a: "Da. Celotna izvorna koda je na GitHubu, vsaka izdaja pa se tam zgradi iz označenega commita.",
      },
      anilist: {
        q: "Kaj je AniList?",
        a: "Brezplačna zbirka podatkov in spletno mesto za sledenje animejem in mangi na anilist.co. Tvoj seznam živi tam; Karasu ga bere in vanj piše prek javnega API-ja AniLista.",
      },
      replace: {
        q: "Ali Karasu nadomešča AniList?",
        a: "Ne. Je odjemalec zanj. Tvoj seznam ostane na AniListu in vsaka sprememba, ki jo naredi Karasu, je trenutek pozneje vidna na spletnem mestu. Karasu lahko uporabljaš tudi brez računa, samo z lokalnim seznamom.",
      },
      platforms: {
        q: "Katere platforme so podprte?",
        a: "Windows in Android sta Stable, Linux je eksperimentalni AppImage, za macOS pa ni gradnje. Windows ima vse funkcije. Android ima seznam, statistiko, obvestila, pripomočke, družabne strani in lasten posodobitveni program, nima pa lokalne knjižnice in ikone v sistemski vrstici. Prepoznavanje se razlikuje: Windows bere medijske seje, okna predvajalnikov in brskalnikov, mpv in Jellyfin; Linux bere medijske seje, mpv in Jellyfin, brez naslovov oken; Android bere Jellyfin.",
      },
      credentials: {
        q: "Ali Karasu shranjuje moje poverilnice za AniList?",
        a: "Gesla nikoli ne vidi. Prijava poteka na anilist.co v tvojem brskalniku, ki Karasuju preda žeton. Ta žeton se na računalniku hrani v shrambi poverilnic tvojega operacijskega sistema, v prenosnem načinu v šifrirani datoteki ob aplikaciji, v Androidu pa v datoteki, zapečateni s Keystorom — in se nikoli ne vrne spletnemu pogledu aplikacije.",
      },
      offline: {
        q: "Ali Karasu deluje brez povezave?",
        a: "Tvoj seznam se shranjuje lokalno, zato se odpre brez omrežja, naslov z njega pokaže svojo shranjeno stran z delujočim +1, spremembe pa se postavijo v vrsto in pošljejo, ko se povezava vrne. Brskanje po naslovih, ki niso na tvojem seznamu, iskanje in družabne strani potrebujejo omrežje.",
      },
      automatic: {
        q: "Ali samodejno posodablja moj napredek na AniListu?",
        a: "Da, ko se epizoda privzeto predvaja dve tretjini svoje dolžine — ali toliko minut, kolikor jih nastaviš, ali ko potrdiš obvestilo, če raje, da te vpraša. Poglavje s spletnega mesta, ki ga Karasu ne imenuje, vedno najprej vpraša. Napredek gre samo naprej, Karasu pa tik pred pisanjem znova prebere tvoj seznam.",
      },
      affiliated: {
        q: "Ali je Karasu povezan z AniListom?",
        a: "Ne. Je neodvisen projekt, ki uporablja javni API AniLista, z registriranim client id in brez posebnega dostopa.",
      },
      smartscreen: {
        q: "Zakaj Windows ob namestitvi opozori?",
        a: "Namestitveni program ni podpisan, zato ga SmartScreen še nikoli ni videl in to pove. Vsaka izdaja vključuje SHA256SUMS.txt, s katerim lahko preveriš prenos.",
      },
      network: {
        q: "S čim komunicira Karasu?",
        a: "Z API-jem in strežniki slik AniLista; z GitHubom za preverjanje posodobitev in prenos; s podatki skupnosti o povezavah med epizodami na GitHubu, največ enkrat na teden; z lastnim strežnikom Jellyfin, če ga nastaviš; z lokalno vtičnico Discorda za Rich Presence, če ga vklopiš. Slike v biografijah uporabnikov AniLista se naložijo prek Karasujevega lastnega omejenega posrednika, zato ti gostitelji izvejo tvoj naslov IP, ko odpreš profil. Nič drugega in nobene analitike.",
      },
    },
  },
  footer: {
    tagline: "Sodoben sledilnik animejev in mange — narejen izključno za AniList.",
    badge: "Odprta koda · brezplačno",
    project: "Projekt",
    github: "GitHub",
    download: "Prenesi",
    changelog: "Seznam sprememb",
    nightly: "Gradnje Nightly",
    help: "Pomoč",
    docs: "Dokumentacija",
    issue: "Prijavi težavo",
    feature: "Predlagaj funkcijo",
    discord: "Discord",
    elsewhere: "Drugje",
    anilist: "AniList",
    security: "Varnostna politika",
    contributing: "Sodelovanje",
    license: "Licenca AGPL-3.0",
    copyright: "Licencirano pod AGPL-3.0 · © 2026 Kyu in sodelavci Karasuja",
    disclaimer:
      "Karasu je neodvisen projekt in ni povezan z AniListom ali odobren s strani AniLista. SN Pro se uporablja pod licenco SIL Open Font License 1.1.",
    language: "Jezik",
    aiNote: "Vsak jezik razen angleščine in nemščine je prevod umetne inteligence, ki ga ni pregledal noben človek.",
  },
  notFound: {
    title: "Tukaj nihče ne sedi.",
    body: "Strani, ki si jo iskal, ni. Celotno spletno mesto je ena stran in to ni ta.",
    back: "Nazaj na Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Seznam animejev kot mreža naslovnic, s stanji in lastnimi seznami v stolpcu ob njej ter iskanjem, razvrščanjem, filtri in prednastavitvami nad njo.",
      caption: "Seznam animejev, mrežni pogled",
    },
    overview: {
      alt: "Pregled: pozdrav z iskanjem in naslednjimi 48 urami čez pasico sezone, seznami kot police, naslovi, ki se predvajajo in jih je treba dohiteti, ter stolpec s statistiko in tvojo dejavnostjo.",
      caption: "Pregled — tvoji seznami, teden, kaj dohiteti",
    },
    "now-playing": {
      alt: "Okno Zdaj se predvaja lebdi nad seznamom animejev: tretja sezona Mushoku Tensei, prepoznana v mpv, sezona 3 epizoda 9, z napredkom, ki ga bo vpisalo.",
      caption: "Zdaj se predvaja — epizoda, prepoznana v mpv",
    },
    seasonal: {
      alt: "Stran Sezona: naslovi jeseni 2026 kot kartice z žanri in odštevanjem, ob njih stolpec z letom, sezono in formati.",
      caption: "Sezona",
    },
    calendar: {
      alt: "Dnevni red koledarja: epizode tedna, ki se predvajajo od danes, vsaka na kartici z naslovnico, uro in številko epizode.",
      caption: "Koledar",
    },
    "stats-overview": {
      alt: "Pregled strani Statistika: vsote seznama, obroč stanj in formatov, države izvora, kam je šel čas gledanja, in dolžine serij.",
      caption: "Statistika — pregled",
    },
    franchise: {
      alt: "Graf franšize Mushoku Tensei: tretja sezona, povezana z zgodnejšimi sezonami, light novelo in spin-off mango, s kartico izbranega naslova ob strani.",
      caption: "Graf franšize",
    },
    "phone-overview": {
      alt: "Pregled na telefonu: pozdrav z iskanjem čez pasico sezone in seznami kot police, nad spodnjo vrstico.",
      caption: "Android — pregled",
    },
    "phone-list": {
      alt: "Seznam animejev na telefonu kot tristolpčna mreža naslovnic, z izbirnikom stanja in iskanjem po seznamu nad njo.",
      caption: "Android — seznam animejev",
    },
    "phone-detail": {
      alt: "Podrobna stran Mushoku Tensei na telefonu z odprtim listom stanja: stanje, napredek in ocena nad porazdelitvijo ocen skupnosti.",
      caption: "Android — naslov z odprtim vnosom",
    },
    "phone-search": {
      alt: "Stran iskanja na telefonu z rezultati za „season 2“ kot mreža naslovnic.",
      caption: "Android — iskanje",
    },
  },
} satisfies Messages;
