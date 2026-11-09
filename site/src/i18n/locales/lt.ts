import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — modernus anime ir mangos sekiklis, skirtas AniList",
    description:
      "Karasu yra nemokamas atvirojo kodo anime ir mangos sekiklis, sukurtas tik AniList. Jis pastebi, ką leidi, o Windows sistemoje ir ką skaitai, ir palaiko tavo pažangą AniList atnaujintą. Windows, Linux ir Android.",
    notFoundTitle: "Puslapis nerastas — Karasu",
  },
  skip: "Pereiti prie turinio",
  nav: {
    label: "Pagrindinė naršymo juosta",
    home: "Karasu — atgal į viršų",
    changes: "Kas naujo",
    screenshots: "Ekrano nuotraukos",
    join: "Prisijunk",
    faq: "DUK",
    github: "GitHub",
    download: "Atsisiųsti",
    downloadKarasu: "Atsisiųsti Karasu",
    openMenu: "Atidaryti meniu",
    closeMenu: "Uždaryti meniu",
  },
  hero: {
    eyebrow: "Nemokama · atviras kodas · skirta AniList",
    title: "AniList klientas, kuris įrašo tavo serijas už tave",
    lede: "Tavo sąrašai, sezonas, transliacijų kalendorius, statistika, srautas ir forumas viename greitame lange, o dar atpažinimas, kuris atnaujina tavo sąrašą, kai serija pasibaigia.",
    windows: "Atsisiųsti, skirta Windows",
    linux: "Linux",
    android: "Android",
    note: "Versija {version}. Windows diegimo programa nepasirašyta, todėl pirmą kartą paleidus SmartScreen gali perspėti · Linux yra eksperimentinis AppImage · Android yra rankiniu būdu diegiamas APK · macOS nėra",
    checksums: "kontrolinės sumos",
    everyDownload: "visi atsisiuntimai",
  },
  changes: {
    title: "Kas naujo",
    nightly: "Nightly versijoje",
    version: "Versija {version}",
    since: "Nuo {version}, dar ne Stable išleidime",
    added: "Pridėta",
    changed: "Pakeista",
    fixed: "Ištaisyta",
    whole: "Visas pakeitimų žurnalas",
  },
  gallery: {
    eyebrow: "Ekrano nuotraukos",
    title: "Programa tokia, kokia yra",
    which: "Kurios ekrano nuotraukos",
    desktop: "Kompiuteris",
    android: "Android",
    open: "Atidaryti: {caption}",
    dialog: "Ekrano nuotrauka {n} iš {total}: {caption}",
    previous: "Ankstesnė ekrano nuotrauka",
    next: "Kita ekrano nuotrauka",
    close: "Uždaryti",
  },
  join: {
    title: "Išbandyk ir papasakok, kaip sekėsi",
    body: "Karasu kuria vienas prižiūrėtojas kartu su visais, kas prisijungia. Padeda pranešimas apie klaidą, idėja ar žinutė, kad kažkas veikia tavo kompiuteryje, ypač Linux ir Android.",
    discord: "Prisijungti prie Discord",
    bug: "Pranešti apie klaidą",
    source: "Šaltinio kodas GitHub",
  },
  faq: {
    eyebrow: "DUK",
    title: "Klausimai, atsakyti iš kodo.",
    items: {
      what: {
        q: "Kas yra Karasu?",
        a: "Kompiuterio ir Android programa, kuri tvarko tavo anime ir mangos sąrašą AniList. Ji pastebi, ką žiūri ar skaitai, ir pati atnaujina tavo pažangą AniList, o dėl skyriaus iš svetainės, kurios nevadina, pirmiausia vieną kartą paklausia, bei suteikia tam sąrašui greitą vietinę sąsają su statistika, pranešimais ir socialiniais puslapiais.",
      },
      free: {
        q: "Ar tai nemokama?",
        a: "Taip. Karasu yra nemokama ir išleista pagal GNU AGPL-3.0 arba bet kurią vėlesnę versiją. Mokamo lygio nėra ir nėra ko atrakinti.",
      },
      open: {
        q: "Ar tai atviro kodo?",
        a: "Taip. Visas šaltinio kodas yra GitHub, o kiekvienas leidimas ten sukompiliuojamas iš pažymėto commit.",
      },
      anilist: {
        q: "Kas yra AniList?",
        a: "Nemokama anime ir mangos duomenų bazė bei sekimo svetainė adresu anilist.co. Tavo sąrašas gyvena ten; Karasu jį skaito ir rašo per viešąją AniList API.",
      },
      replace: {
        q: "Ar Karasu pakeičia AniList?",
        a: "Ne. Tai jo klientas. Tavo sąrašas lieka AniList, o kiekvienas Karasu atliktas pakeitimas po akimirkos matomas svetainėje. Karasu gali naudoti ir be jokios paskyros, tik su vietiniu sąrašu.",
      },
      platforms: {
        q: "Kurios platformos palaikomos?",
        a: "Windows ir Android yra Stable, Linux yra eksperimentinis AppImage, o macOS versijos nėra. Windows turi visas funkcijas. Android turi sąrašą, statistiką, pranešimus, valdiklius, socialinius puslapius ir savo atnaujintuvą, bet neturi vietinės bibliotekos ir sistemos dėklo. Atpažinimas skiriasi: Windows skaito medijos sesijas, grotuvų ir naršyklių langus, mpv ir Jellyfin; Linux skaito medijos sesijas, mpv ir Jellyfin, bet ne langų pavadinimus; Android skaito Jellyfin.",
      },
      credentials: {
        q: "Ar Karasu saugo mano AniList prisijungimo duomenis?",
        a: "Slaptažodžio ji niekada nemato. Prisijungimas vyksta anilist.co tavo naršyklėje, kuri Karasu perduoda prieigos raktą. Šis raktas kompiuteryje laikomas tavo operacinės sistemos kredencialų saugykloje, nešiojamuoju režimu užšifruotame faile šalia programos, o Android sistemoje Keystore užantspauduotame faile — ir jis niekada negrąžinamas programos žiniatinklio rodiniui.",
      },
      offline: {
        q: "Ar Karasu veikia be interneto?",
        a: "Tavo sąrašas talpinamas vietoje, todėl atsidaro be tinklo, jame esantis pavadinimas rodo išsaugotą savo puslapį su veikiančiu +1, o pakeitimai sudedami į eilę ir išsiunčiami, kai ryšys grįžta. Pavadinių, kurių nėra tavo sąraše, naršymui, paieškai ir socialiniams puslapiams reikia tinklo.",
      },
      automatic: {
        q: "Ar jis automatiškai atnaujina mano pažangą AniList?",
        a: "Taip, pagal numatytuosius nustatymus, kai serija atkurta dvi trečdalius savo trukmės — arba tiek minučių, kiek nustatysi, arba kai patvirtini pranešimą, jei nori, kad būtų klausiama. Skyrius iš svetainės, kurios Karasu nevadina, visada pirmiausia klausia. Pažanga juda tik pirmyn, o Karasu prieš rašydama dar kartą perskaito tavo sąrašą.",
      },
      affiliated: {
        q: "Ar Karasu yra susijusi su AniList?",
        a: "Ne. Tai nepriklausomas projektas, naudojantis viešąją AniList API su užregistruotu client id ir be ypatingos prieigos.",
      },
      smartscreen: {
        q: "Kodėl diegiant Windows perspėja?",
        a: "Diegimo programa nepasirašyta, todėl SmartScreen jos dar niekada nematė ir tai pasako. Kiekvienas leidimas pateikiamas su SHA256SUMS.txt, pagal kurį gali patikrinti atsisiųstą failą.",
      },
      network: {
        q: "Su kuo kalbasi Karasu?",
        a: "Su AniList API ir vaizdų serveriais; su GitHub, kad patikrintų naujinius ir juos atsisiųstų; su bendruomenės serijų ryšių duomenimis GitHub, daugiausia kartą per savaitę; su tavo paties Jellyfin serveriu, jei jį nustatai; su vietiniu Discord lizdu, skirtu Rich Presence, jei jį įjungi. Paveikslėliai AniList naudotojų biografijose gaunami per paties Karasu ribotą tarpinį serverį, todėl tie serveriai sužino tavo IP adresą, kai atidarai profilį. Daugiau nieko ir jokios analitikos.",
      },
    },
  },
  footer: {
    tagline: "Modernus anime ir mangos sekiklis — sukurtas tik AniList.",
    badge: "Atviras kodas · nemokama",
    project: "Projektas",
    github: "GitHub",
    download: "Atsisiųsti",
    changelog: "Pakeitimų žurnalas",
    nightly: "Nightly darbiniai leidimai",
    help: "Pagalba",
    docs: "Dokumentacija",
    issue: "Pranešti apie problemą",
    feature: "Pasiūlyti funkciją",
    discord: "Discord",
    elsewhere: "Kitur",
    anilist: "AniList",
    security: "Saugumo politika",
    contributing: "Kaip prisidėti",
    license: "AGPL-3.0 licencija",
    copyright: "Licencijuota pagal AGPL-3.0 · © 2026 Kyu ir Karasu bendraautoriai",
    disclaimer:
      "Karasu yra nepriklausomas projektas, nesusijęs su AniList ir jo nepatvirtintas. SN Pro naudojamas pagal SIL Open Font License 1.1.",
    language: "Kalba",
    aiNote: "Kiekviena kalba, išskyrus anglų ir vokiečių, yra dirbtinio intelekto vertimas, kurio nė vienas žmogus nepatikrino.",
  },
  notFound: {
    title: "Čia niekas nenutūpė.",
    body: "Puslapio, kurio ieškojai, nėra. Visa svetainė yra vienas puslapis, ir tai ne jis.",
    back: "Atgal į Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Anime sąrašas kaip viršelių tinklelis, šalia stulpelis su būsenomis ir pasirinktais sąrašais, o viršuje paieška, rikiavimas, filtrai ir parinkčių rinkiniai.",
      caption: "Anime sąrašas, tinklelio rodinys",
    },
    overview: {
      alt: "Apžvalga: sveikinimas su paieška ir artimiausiomis 48 valandomis virš sezono reklamjuostės, sąrašai kaip lentynos, transliuojami pavadinimai, kuriuos reikia pasivyti, ir stulpelis su statistika bei tavo paties veikla.",
      caption: "Apžvalga — tavo sąrašai, savaitė, ką pasivyti",
    },
    "now-playing": {
      alt: "Langas „Dabar groja“ plūduriuoja virš anime sąrašo: trečias Mushoku Tensei sezonas, atpažintas mpv, 3 sezono 9 serija, su pažanga, kurią jis įrašys.",
      caption: "Dabar groja — mpv atpažinta serija",
    },
    seasonal: {
      alt: "Sezono puslapis: 2026 m. rudens pavadinimai kaip kortelės su žanrais ir atgaliniu skaičiavimu, šalia stulpelis su metais, sezonu ir formatais.",
      caption: "Sezonas",
    },
    calendar: {
      alt: "Kalendoriaus darbotvarkė: savaitės transliuojamos serijos nuo šiandien, kiekviena kortelėje su viršeliu, laiku ir serijos numeriu.",
      caption: "Kalendorius",
    },
    "stats-overview": {
      alt: "Statistikos puslapio apžvalga: sąrašo sumos, būsenų ir formatų žiedas, kilmės šalys, kur nuėjo žiūrėjimo laikas, ir serialų trukmės.",
      caption: "Statistika — apžvalga",
    },
    franchise: {
      alt: "Mushoku Tensei franšizės grafas: trečias sezonas, susietas su ankstesniais sezonais, light novel ir šalutine manga, o šone pasirinkto pavadinimo kortelė.",
      caption: "Franšizės grafas",
    },
    "phone-overview": {
      alt: "Apžvalga telefone: sveikinimas su paieška virš sezono reklamjuostės ir sąrašai kaip lentynos, virš apatinės juostos.",
      caption: "Android — apžvalga",
    },
    "phone-list": {
      alt: "Anime sąrašas telefone kaip trijų stulpelių viršelių tinklelis, su būsenos parinkikliu ir sąrašo paieška viršuje.",
      caption: "Android — anime sąrašas",
    },
    "phone-detail": {
      alt: "Mushoku Tensei išsamus puslapis telefone su atidarytu būsenos lapu: būsena, pažanga ir vertinimas virš bendruomenės vertinimų pasiskirstymo.",
      caption: "Android — pavadinimas su atidarytu įrašu",
    },
    "phone-search": {
      alt: "Paieškos puslapis telefone su rezultatais pagal „season 2“ kaip viršelių tinklelis.",
      caption: "Android — paieška",
    },
  },
} satisfies Messages;
