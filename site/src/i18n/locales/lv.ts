import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — mūsdienīgs anime un mangas izsekotājs AniList lietotājiem",
    description:
      "Karasu ir bezmaksas atvērtā koda anime un mangas izsekotājs, kas izveidots tikai AniList. Tas pamana, ko tu atskaņo, bet Windows sistēmā arī to, ko lasi, un uztur tavu progresu AniList atjauninātu. Windows, Linux un Android.",
    notFoundTitle: "Lapa nav atrasta — Karasu",
  },
  skip: "Pāriet uz saturu",
  nav: {
    label: "Galvenā navigācija",
    home: "Karasu — atpakaļ uz augšu",
    changes: "Kas jauns",
    screenshots: "Ekrānuzņēmumi",
    join: "Pievienojies",
    faq: "BUJ",
    github: "GitHub",
    download: "Lejupielādēt",
    downloadKarasu: "Lejupielādēt Karasu",
    openMenu: "Atvērt izvēlni",
    closeMenu: "Aizvērt izvēlni",
  },
  hero: {
    eyebrow: "Bezmaksas · atvērtais kods · AniList lietotājiem",
    title: "AniList klients, kas ieraksta tavas sērijas tavā vietā",
    lede: "Tavi saraksti, sezona, pārraižu kalendārs, statistika, ziņu plūsma un forums vienā ātrā logā, kā arī noteikšana, kas atjaunina tavu sarakstu, kad sērija beidzas.",
    windows: "Lejupielādēt Windows",
    linux: "Linux",
    android: "Android",
    note: "Versija {version}. Windows instalētājs nav parakstīts, tāpēc SmartScreen pirmajā palaišanas reizē var brīdināt · Linux ir eksperimentāls AppImage · Android ir manuāli instalējams APK · macOS nav",
    checksums: "kontrolsummas",
    everyDownload: "visas lejupielādes",
  },
  changes: {
    title: "Kas jauns",
    nightly: "Nightly versijā",
    version: "Versija {version}",
    since: "Kopš {version}, vēl nav Stable izlaidumā",
    added: "Pievienots",
    changed: "Mainīts",
    fixed: "Labots",
    whole: "Visa izmaiņu vēsture",
  },
  gallery: {
    eyebrow: "Ekrānuzņēmumi",
    title: "Lietotne tāda, kāda tā ir",
    which: "Kuri ekrānuzņēmumi",
    desktop: "Dators",
    android: "Android",
    open: "Atvērt: {caption}",
    dialog: "Ekrānuzņēmums {n} no {total}: {caption}",
    previous: "Iepriekšējais ekrānuzņēmums",
    next: "Nākamais ekrānuzņēmums",
    close: "Aizvērt",
  },
  join: {
    title: "Izmēģini un pastāsti, kā gāja",
    body: "Karasu veido viens uzturētājs kopā ar ikvienu, kas pievienojas. Palīdz kļūdas ziņojums, ideja vai ziņa, ka kaut kas darbojas tavā datorā, īpaši Linux un Android sistēmā.",
    discord: "Pievienoties Discord",
    bug: "Ziņot par kļūdu",
    source: "Pirmkods GitHub",
  },
  faq: {
    eyebrow: "BUJ",
    title: "Jautājumi, uz kuriem atbild kods.",
    items: {
      what: {
        q: "Kas ir Karasu?",
        a: "Datora un Android lietotne, kas uztur tavu anime un mangas sarakstu AniList. Tā pamana, ko tu skaties vai lasi, un pati atjaunina tavu progresu AniList, par nodaļu no vietnes, ko tā nenosauc, vispirms vienreiz pajautājot, un dod šim sarakstam ātru lokālu saskarni ar statistiku, paziņojumiem un sociālajām lapām.",
      },
      free: {
        q: "Vai tas ir bezmaksas?",
        a: "Jā. Karasu ir bezmaksas un izlaists ar licenci GNU AGPL-3.0 vai jebkuru jaunāku versiju. Maksas līmeņa nav un nav ko atbloķēt.",
      },
      open: {
        q: "Vai tas ir ar atvērto kodu?",
        a: "Jā. Viss pirmkods ir GitHub, un katrs izlaidums tur tiek būvēts no atzīmēta commit.",
      },
      anilist: {
        q: "Kas ir AniList?",
        a: "Bezmaksas anime un mangas datubāze un izsekošanas vietne adresē anilist.co. Tavs saraksts dzīvo tur; Karasu to lasa un raksta tajā, izmantojot AniList publisko API.",
      },
      replace: {
        q: "Vai Karasu aizstāj AniList?",
        a: "Nē. Tas ir klients tam. Tavs saraksts paliek AniList, un katra Karasu veiktā izmaiņa mirkli vēlāk ir redzama vietnē. Karasu vari izmantot arī bez jebkāda konta, tikai ar lokālu sarakstu.",
      },
      platforms: {
        q: "Kuras platformas tiek atbalstītas?",
        a: "Windows un Android ir Stable, Linux ir eksperimentāls AppImage, un macOS būvējuma nav. Windows ir visas funkcijas. Android ir saraksts, statistika, paziņojumi, logrīki, sociālās lapas un savs atjauninātājs, bet nav lokālās bibliotēkas un sistēmas teknes ikonas. Noteikšana atšķiras: Windows lasa multivides sesijas, atskaņotāju un pārlūku logus, mpv un Jellyfin; Linux lasa multivides sesijas, mpv un Jellyfin, bet ne logu virsrakstus; Android lasa Jellyfin.",
      },
      credentials: {
        q: "Vai Karasu glabā manus AniList akreditācijas datus?",
        a: "Tavu paroli tas nekad neredz. Pieteikšanās notiek anilist.co tavā pārlūkā, kas nodod Karasu pilnvaru. Šī pilnvara datorā tiek glabāta tavas operētājsistēmas akreditācijas datu krātuvē, pārnēsājamajā režīmā šifrētā failā līdzās lietotnei un Android sistēmā ar Keystore aizzīmogotā failā — un tā nekad netiek atdota atpakaļ lietotnes tīmekļa skatam.",
      },
      offline: {
        q: "Vai Karasu var strādāt bezsaistē?",
        a: "Tavs saraksts tiek kešots lokāli, tāpēc tas atveras bez tīkla, tajā esošs nosaukums rāda savu saglabāto lapu ar darbojošos +1, un labojumi tiek ielikti rindā un nosūtīti, kad savienojums atgriežas. Nosaukumu, kuru nav tavā sarakstā, pārlūkošanai, meklēšanai un sociālajām lapām ir vajadzīgs tīkls.",
      },
      automatic: {
        q: "Vai tas automātiski atjaunina manu progresu AniList?",
        a: "Jā, pēc noklusējuma, tiklīdz sērija ir atskaņota divas trešdaļas no sava garuma — vai tik minūtes, cik tu iestatīsi, vai pēc tam, kad apstiprināsi paziņojumu, ja vēlies, lai tev jautā. Nodaļa no vietnes, ko Karasu nenosauc, vienmēr vispirms jautā. Progress virzās tikai uz priekšu, un Karasu tieši pirms rakstīšanas vēlreiz nolasa tavu sarakstu.",
      },
      affiliated: {
        q: "Vai Karasu ir saistīts ar AniList?",
        a: "Nē. Tas ir neatkarīgs projekts, kas izmanto AniList publisko API ar reģistrētu client id un bez īpašas piekļuves.",
      },
      smartscreen: {
        q: "Kāpēc Windows brīdina, kad es to instalēju?",
        a: "Instalētājs nav parakstīts, tāpēc SmartScreen to nekad nav redzējis un to pasaka. Katram izlaidumam līdzi nāk SHA256SUMS.txt, pēc kura vari pārbaudīt lejupielādi.",
      },
      network: {
        q: "Ar ko Karasu sazinās?",
        a: "Ar AniList API un attēlu serveriem; ar GitHub, lai pārbaudītu atjauninājumus un tos lejupielādētu; ar kopienas sēriju savstarpējo saistību datiem GitHub, ne biežāk kā reizi nedēļā; ar tavu paša Jellyfin serveri, ja tādu esi iestatījis; ar Discord lokālo ligzdu Rich Presence vajadzībām, ja to ieslēdz. Attēli AniList lietotāju biogrāfijās tiek ielādēti caur paša Karasu ierobežoto starpniekserveri, tāpēc šie resursdatori uzzina tavu IP adresi, kad atver profilu. Nekā cita un nekādas analītikas.",
      },
    },
  },
  footer: {
    tagline: "Mūsdienīgs anime un mangas izsekotājs — izveidots tikai AniList.",
    badge: "Atvērtais kods · bezmaksas",
    project: "Projekts",
    github: "GitHub",
    download: "Lejupielādēt",
    changelog: "Izmaiņu vēsture",
    nightly: "Nightly būvējumi",
    help: "Palīdzība",
    docs: "Dokumentācija",
    issue: "Ziņot par problēmu",
    feature: "Pieprasīt funkciju",
    discord: "Discord",
    elsewhere: "Citur",
    anilist: "AniList",
    security: "Drošības politika",
    contributing: "Kā piedalīties",
    license: "AGPL-3.0 licence",
    copyright: "Licencēts ar AGPL-3.0 · © 2026 Kyu un Karasu līdzautori",
    disclaimer:
      "Karasu ir neatkarīgs projekts, un tas nav saistīts ar AniList vai tā apstiprināts. SN Pro tiek izmantots saskaņā ar SIL Open Font License 1.1.",
    language: "Valoda",
    aiNote: "Katra valoda, izņemot angļu un vācu, ir mākslīgā intelekta tulkojums, ko neviens cilvēks nav pārskatījis.",
  },
  notFound: {
    title: "Šeit neviens nav nolaidies.",
    body: "Lapas, ko meklēji, nav. Visa vietne ir viena lapa, un šī nav tā.",
    back: "Atpakaļ uz Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Anime saraksts kā vāku režģis, blakus ir sleja ar statusiem un pielāgotajiem sarakstiem, bet virs tā meklēšana, kārtošana, filtri un sagatavotie iestatījumi.",
      caption: "Anime saraksts, režģa skats",
    },
    overview: {
      alt: "Pārskats: sveiciens ar meklēšanu un tuvākajām 48 stundām virs sezonas reklāmkarogs, saraksti kā plaukti, pārraidāmie nosaukumi, kas jāsasniedz, un sleja ar statistiku un tavu pašu aktivitāti.",
      caption: "Pārskats — tavi saraksti, nedēļa, kas jāsasniedz",
    },
    "now-playing": {
      alt: "Logs “Tagad atskaņo” lido virs anime saraksta: mpv noteiktā Mushoku Tensei trešā sezona, 3. sezonas 9. sērija, ar progresu, ko tas ierakstīs.",
      caption: "Tagad atskaņo — mpv noteikta sērija",
    },
    seasonal: {
      alt: "Sezonas lapa: 2026. gada rudens nosaukumi kā kartītes ar žanriem un atpakaļskaitīšanu, blakus sleja ar gadu, sezonu un formātiem.",
      caption: "Sezona",
    },
    calendar: {
      alt: "Kalendāra dienaskārtība: nedēļas pārraidāmās sērijas no šodienas, katra uz kartītes ar vāku, laiku un sērijas numuru.",
      caption: "Kalendārs",
    },
    "stats-overview": {
      alt: "Statistikas lapas pārskats: saraksta kopsummas, statusu un formātu gredzens, izcelsmes valstis, kur aizgājis skatīšanās laiks, un seriālu garumi.",
      caption: "Statistika — pārskats",
    },
    franchise: {
      alt: "Mushoku Tensei franšīzes grafs: trešā sezona, kas saistīta ar iepriekšējām sezonām, light novel un blakussižeta mangu, ar izvēlētā nosaukuma kartīti malā.",
      caption: "Franšīzes grafs",
    },
    "phone-overview": {
      alt: "Pārskats tālrunī: sveiciens ar meklēšanu virs sezonas reklāmkarogs un saraksti kā plaukti, virs apakšējās joslas.",
      caption: "Android — pārskats",
    },
    "phone-list": {
      alt: "Anime saraksts tālrunī kā trīs kolonnu vāku režģis, ar statusa izvēli un saraksta meklēšanu virs tā.",
      caption: "Android — anime saraksts",
    },
    "phone-detail": {
      alt: "Mushoku Tensei detalizētā lapa tālrunī ar atvērtu statusa lapu: statuss, progress un vērtējums virs kopienas vērtējumu sadalījuma.",
      caption: "Android — nosaukums ar atvērtu ierakstu",
    },
    "phone-search": {
      alt: "Meklēšanas lapa tālrunī ar rezultātiem pēc “season 2” kā vāku režģis.",
      caption: "Android — meklēšana",
    },
  },
} satisfies Messages;
