import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Kaasaegne anime ja manga jälgija AniListile",
    description:
      "Karasu on tasuta avatud lähtekoodiga anime ja manga jälgija, mis on tehtud ainult AniListile. See märkab, mida sa esitad — ja Windowsis ka seda, mida sa loed — ning hoiab su AniListi edenemise ajakohasena. Windows, Linux ja Android.",
    notFoundTitle: "Lehte ei leitud — Karasu",
  },
  skip: "Mine sisu juurde",
  nav: {
    label: "Peamenüü",
    home: "Karasu — tagasi üles",
    changes: "Mis on uut",
    screenshots: "Ekraanipildid",
    join: "Osale",
    faq: "KKK",
    github: "GitHub",
    download: "Laadi alla",
    downloadKarasu: "Laadi Karasu alla",
    openMenu: "Ava menüü",
    closeMenu: "Sulge menüü",
  },
  hero: {
    eyebrow: "Tasuta · avatud lähtekood · AniListile",
    title: "AniListi klient, mis kannab su episoodid sinu eest sisse",
    lede: "Sinu nimekirjad, hooaeg, eetrikalender, statistika, voog ja foorum ühes kiires aknas — ning tuvastus, mis ajakohastab su nimekirja, kui episood lõpeb.",
    windows: "Laadi alla Windowsile",
    linux: "Linux",
    android: "Android",
    note: "Versioon {version}. Windowsi installijat pole koodiga allkirjastatud, nii et SmartScreen võib esimesel käivitamisel hoiatada · Linux on katseline AppImage · Android on käsitsi paigaldatav APK · macOS-i pole",
    checksums: "kontrollsummad",
    everyDownload: "kõik allalaadimised",
  },
  changes: {
    title: "Mis on uut",
    nightly: "Nightlys",
    version: "Versioon {version}",
    since: "Alates versioonist {version}, veel mitte üheski Stable-väljalaskes",
    added: "Lisatud",
    changed: "Muudetud",
    fixed: "Parandatud",
    whole: "Kogu muudatuste logi",
  },
  gallery: {
    eyebrow: "Ekraanipildid",
    title: "Rakendus sellisena, nagu ta on",
    which: "Millised ekraanipildid",
    desktop: "Arvuti",
    android: "Android",
    open: "Ava: {caption}",
    dialog: "Ekraanipilt {n} / {total}: {caption}",
    previous: "Eelmine ekraanipilt",
    next: "Järgmine ekraanipilt",
    close: "Sulge",
  },
  join: {
    title: "Proovi ja anna teada, kuidas läks",
    body: "Karasut teeb üks hooldaja koos kõigiga, kes kaasa löövad. Veateade, idee või teade, et midagi töötab sinu arvutis, aitab — eriti Linuxis ja Androidis.",
    discord: "Liitu Discordiga",
    bug: "Teata veast",
    source: "Lähtekood GitHubis",
  },
  faq: {
    eyebrow: "KKK",
    title: "Küsimused, millele vastab kood.",
    items: {
      what: {
        q: "Mis on Karasu?",
        a: "Arvuti- ja Androidi-rakendus, mis peab sinu AniListi anime ja manga nimekirja. See märkab, mida sa esitad või loed, ja ajakohastab su edenemist AniListis ise — peatüki puhul saidilt, mida see nime järgi ei tunne, küsib see enne ühe korra — ning annab sellele nimekirjale kiire kohaliku kasutajaliidese statistika, teavituste ja sotsiaalsete lehtedega.",
      },
      free: {
        q: "Kas see on tasuta?",
        a: "Jah. Karasu on tasuta ja avaldatud GNU AGPL-3.0 või mis tahes hilisema versiooni all. Tasulist taset pole ega midagi avada.",
      },
      open: {
        q: "Kas see on avatud lähtekoodiga?",
        a: "Jah. Kogu lähtekood on GitHubis ja iga väljalase ehitatakse seal sildistatud commitist.",
      },
      anilist: {
        q: "Mis on AniList?",
        a: "Tasuta anime ja manga andmebaas ning jälgimisleht aadressil anilist.co. Sinu nimekiri asub seal; Karasu loeb ja kirjutab seda AniListi avaliku API kaudu.",
      },
      replace: {
        q: "Kas Karasu asendab AniListi?",
        a: "Ei. See on selle klient. Sinu nimekiri jääb AniListi ja iga Karasu tehtud muudatus on veebisaidil hetk hiljem nähtav. Karasut saad kasutada ka täiesti ilma kontota, ainult kohaliku nimekirjaga.",
      },
      platforms: {
        q: "Milliseid platvorme toetatakse?",
        a: "Windows ja Android on Stable, Linux on katseline AppImage ning macOS-i väljalaset pole. Windowsis on kõik funktsioonid. Androidis on nimekiri, statistika, teavitused, vidinad, sotsiaalsed lehed ja oma uuendaja, kuid kohalikku teeki ja teavitusala ikooni pole. Tuvastus erineb: Windows loeb meediaseansse, mängija- ja brauseriaknaid, mpv-d ja Jellyfini; Linux loeb meediaseansse, mpv-d ja Jellyfini, ilma akende pealkirjadeta; Android loeb Jellyfini.",
      },
      credentials: {
        q: "Kas Karasu salvestab minu AniListi mandaate?",
        a: "See ei näe kunagi sinu parooli. Sisselogimine toimub anilist.co lehel sinu brauseris, mis annab Karasule loa-tunnuse. See tunnus hoitakse arvutis operatsioonisüsteemi mandaadihoidlas, kaasaskantavas režiimis rakenduse kõrval krüptitud failis ja Androidis Keystore'iga pitseeritud failis — ning seda ei anta kunagi rakenduse veebivaatele tagasi.",
      },
      offline: {
        q: "Kas Karasu töötab ilma võrguta?",
        a: "Sinu nimekiri hoitakse kohalikus vahemälus, nii et see avaneb ilma võrguta, selle pealkiri näitab oma salvestatud lehte töötava +1-ga ning muudatused pannakse järjekorda ja saadetakse, kui ühendus tagasi tuleb. Su nimekirjas mitteolevate pealkirjade sirvimine, otsing ja sotsiaalsed lehed vajavad võrku.",
      },
      automatic: {
        q: "Kas see ajakohastab minu AniListi edenemist automaatselt?",
        a: "Jah, vaikimisi pärast seda, kui episood on esitatud kaks kolmandikku oma pikkusest — või sinu määratud minutite jooksul või pärast teavituse kinnitamist, kui eelistad, et sinult küsitakse. Peatükk saidilt, mida Karasu nime järgi ei tunne, küsib alati enne. Edenemine liigub ainult edasi ja Karasu loeb su nimekirja uuesti vahetult enne kirjutamist.",
      },
      affiliated: {
        q: "Kas Karasu on AniListiga seotud?",
        a: "Ei. See on sõltumatu projekt, mis kasutab AniListi avalikku API-d registreeritud kliendi ID-ga ja ilma erilise juurdepääsuta.",
      },
      smartscreen: {
        q: "Miks Windows paigaldamisel hoiatab?",
        a: "Installijat pole koodiga allkirjastatud, nii et SmartScreen pole seda varem näinud ja ütleb seda. Iga väljalaskega kaasneb fail SHA256SUMS.txt, mille vastu saad allalaaditut kontrollida.",
      },
      network: {
        q: "Kellega Karasu suhtleb?",
        a: "AniListi API ja piltide serveritega; GitHubiga uuenduste kontrolliks ja allalaadimiseks; kogukonna episoodisuhete andmetega GitHubis, kõige rohkem kord nädalas; sinu enda Jellyfini serveriga, kui sa selle seadistad; Discordi kohaliku soklitega Rich Presence'i jaoks, kui sa selle sisse lülitad. AniListi kasutajate tutvustuste pildid tuuakse Karasu enda piiratud puhverserveri kaudu, nii et need hostid saavad su IP-aadressi teada, kui avad profiili. Muud mitte midagi ja analüütikat pole.",
      },
    },
  },
  footer: {
    tagline: "Kaasaegne anime ja manga jälgija — ehitatud ainult AniListile.",
    badge: "Avatud lähtekood · tasuta",
    project: "Projekt",
    github: "GitHub",
    download: "Laadi alla",
    changelog: "Muudatuste logi",
    nightly: "Nightly-versioonid",
    help: "Abi",
    docs: "Dokumentatsioon",
    issue: "Teata probleemist",
    feature: "Soovi funktsiooni",
    discord: "Discord",
    elsewhere: "Mujal",
    anilist: "AniList",
    security: "Turvapoliitika",
    contributing: "Kaasaaitamine",
    license: "AGPL-3.0 litsents",
    copyright: "Litsentsitud AGPL-3.0 all · © 2026 Kyusetzu ja Karasu kaasautorid",
    disclaimer:
      "Karasu on sõltumatu projekt ning pole AniListiga seotud ega AniListi poolt heaks kiidetud. SN Pro't kasutatakse SIL Open Font License 1.1 alusel.",
    language: "Keel",
    aiNote: "Iga keel peale inglise ja saksa keele on tehisintellekti tõlge, mida pole ükski inimene üle vaadanud.",
  },
  notFound: {
    title: "Siin ei istu keegi.",
    body: "Lehte, mida otsisid, pole olemas. Kogu sait on üks leht ja see pole see.",
    back: "Tagasi Karasu juurde",
  },
  shots: {
    "anime-grid": {
      alt: "Animenimekiri kaanteruudustikuna, selle kõrval staatuste ja oma nimekirjade veerg ning selle kohal otsing, sortimine, filtrid ja eelseadistused.",
      caption: "Animenimekiri, ruudustikuvaade",
    },
    overview: {
      alt: "Ülevaade: tervitus otsingu ja järgmise 48 tunniga hooaja bänneri kohal, nimekirjad riiulitena, järelejõudmist ootavad eetris olevad pealkirjad ning veerg statistika ja sinu enda tegevusega.",
      caption: "Ülevaade — sinu nimekirjad, nädal, mida järele jõuda",
    },
    "now-playing": {
      alt: "Aken Praegu mängib hõljub animenimekirja kohal: Mushoku Tensei kolmas hooaeg tuvastatud mpv-s, 3. hooaja 9. episood, edenemisega, mille see sisse kannab.",
      caption: "Praegu mängib — mpv-s tuvastatud episood",
    },
    seasonal: {
      alt: "Hooaja leht: 2026. aasta sügise pealkirjad kaartidena koos žanrite ja loenduriga, nende kõrval aasta, hooaja ja vormingute veerg.",
      caption: "Hooaeg",
    },
    calendar: {
      alt: "Kalendri päevakava: nädala eetris olevad episoodid tänasest alates, igaüks kaardil koos kaane, kellaaja ja episoodi numbriga.",
      caption: "Kalender",
    },
    "stats-overview": {
      alt: "Statistikalehe ülevaade: nimekirja kogusummad, staatuste ja vormingute rõngas, päritoluriigid, kuhu vaatamisaeg kulus, ja sarjade pikkused.",
      caption: "Statistika — ülevaade",
    },
    franchise: {
      alt: "Mushoku Tensei frantsiisigraaf: kolmas hooaeg seotud varasemate hooaegadega, kerge romaani ja kõrvalloo mangaga, küljel valitud pealkirja kaart.",
      caption: "Frantsiisigraaf",
    },
    "phone-overview": {
      alt: "Ülevaade telefonis: tervitus otsinguga hooaja bänneri kohal ja nimekirjad riiulitena, alumise riba kohal.",
      caption: "Android — ülevaade",
    },
    "phone-list": {
      alt: "Animenimekiri telefonis kolmeveerulise kaanteruudustikuna, selle kohal staatuse valija ja nimekirja otsing.",
      caption: "Android — animenimekiri",
    },
    "phone-detail": {
      alt: "Mushoku Tensei üksikasjade leht telefonis avatud staatuselehega: staatus, edenemine ja hinne kogukonna enda hinnete jaotuse kohal.",
      caption: "Android — pealkiri avatud kirjega",
    },
    "phone-search": {
      alt: "Otsingulehe telefonis tulemustega päringule „season 2“ kaanteruudustikuna.",
      caption: "Android — otsing",
    },
  },
} satisfies Messages;
