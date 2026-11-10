import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Un tracker modern de anime și manga pentru AniList",
    description:
      "Karasu este un tracker gratuit și open source de anime și manga, creat exclusiv pentru AniList. Observă ce redai — și, pe Windows, ce citești — și îți ține la zi progresul pe AniList. Windows, Linux și Android.",
    notFoundTitle: "Pagina nu a fost găsită — Karasu",
  },
  skip: "Salt la conținut",
  nav: {
    label: "Principal",
    home: "Karasu — înapoi sus",
    changes: "Noutăți",
    screenshots: "Capturi de ecran",
    join: "Implică-te",
    faq: "Întrebări frecvente",
    github: "GitHub",
    download: "Descarcă",
    downloadKarasu: "Descarcă Karasu",
    openMenu: "Deschide meniul",
    closeMenu: "Închide meniul",
  },
  hero: {
    eyebrow: "Gratuit · open source · pentru AniList",
    title: "Clientul AniList care îți notează episoadele în locul tău",
    lede: "Listele tale, sezonul, calendarul de difuzare, statisticile, feedul și forumul într-o singură fereastră rapidă, plus o detecție care îți actualizează lista când se termină un episod.",
    windows: "Descarcă pentru Windows",
    linux: "Linux",
    android: "Android",
    note: "Versiunea {version}. Programul de instalare pentru Windows nu este semnat, așa că SmartScreen poate afișa un avertisment la prima rulare · Linux este un AppImage experimental · Android este un APK instalat manual · fără macOS",
    checksums: "sume de control",
    everyDownload: "toate descărcările",
  },
  changes: {
    title: "Noutăți",
    nightly: "În Nightly",
    version: "Versiunea {version}",
    since: "De la {version}, încă fără versiune Stable",
    added: "Adăugat",
    changed: "Modificat",
    fixed: "Remediat",
    whole: "Întregul jurnal de modificări",
  },
  gallery: {
    eyebrow: "Capturi de ecran",
    title: "Aplicația, așa cum este",
    which: "Ce capturi de ecran",
    desktop: "Desktop",
    android: "Android",
    open: "Deschide: {caption}",
    dialog: "Captura {n} din {total}: {caption}",
    previous: "Captura anterioară",
    next: "Captura următoare",
    close: "Închide",
  },
  join: {
    title: "Încearcă-l, apoi spune-ne cum a mers",
    body: "Karasu este construit de un singur întreținător, împreună cu cei care se alătură. Un raport de eroare, o idee sau un mesaj că ceva funcționează pe calculatorul tău ajută, mai ales pe Linux și Android.",
    discord: "Intră pe Discord",
    bug: "Raportează o eroare",
    source: "Cod sursă pe GitHub",
  },
  faq: {
    eyebrow: "Întrebări frecvente",
    title: "Întrebări, cu răspunsuri din cod.",
    items: {
      what: {
        q: "Ce este Karasu?",
        a: "O aplicație pentru desktop și Android care îți ține lista de anime și manga de pe AniList. Observă ce vezi sau ce citești și îți actualizează singură progresul pe AniList — întrebându-te mai întâi o dată în cazul unui capitol de pe un site pe care nu îl numește — și oferă listei o interfață locală rapidă, cu statistici, notificări și paginile sociale.",
      },
      free: {
        q: "Este gratuit?",
        a: "Da. Karasu este gratuit și este lansat sub GNU AGPL-3.0, sau orice versiune ulterioară. Nu există un nivel plătit și nimic de deblocat.",
      },
      open: {
        q: "Este open source?",
        a: "Da. Codul sursă complet se află pe GitHub, iar fiecare versiune este construită acolo dintr-un commit etichetat.",
      },
      anilist: {
        q: "Ce este AniList?",
        a: "O bază de date și un site gratuit de urmărire a anime-urilor și manga pe anilist.co. Lista ta se află acolo; Karasu o citește și scrie în ea prin API-ul public al AniList.",
      },
      replace: {
        q: "Înlocuiește Karasu AniList?",
        a: "Nu. Este un client pentru AniList. Lista ta rămâne pe AniList, iar fiecare modificare făcută de Karasu se vede pe site câteva clipe mai târziu. Poți folosi Karasu și fără niciun cont, doar cu o listă locală.",
      },
      platforms: {
        q: "Ce platforme sunt acceptate?",
        a: "Windows și Android sunt Stable, Linux este un AppImage experimental și nu există versiune pentru macOS. Windows are toate funcțiile. Android are lista, statisticile, notificările, widgeturile, paginile sociale și propriul program de actualizare, dar nu are bibliotecă locală și nici zonă de notificare. Detecția diferă: Windows citește sesiunile media, ferestrele playerelor și ale browserelor, mpv și Jellyfin; Linux citește sesiunile media, mpv și Jellyfin, fără titlurile ferestrelor; Android citește Jellyfin.",
      },
      credentials: {
        q: "Stochează Karasu datele mele de autentificare AniList?",
        a: "Nu îți vede niciodată parola. Autentificarea se face pe anilist.co, în browserul tău, care îi dă lui Karasu un token. Acel token este păstrat în magazia de credențiale a sistemului tău de operare pe desktop, într-un fișier criptat lângă aplicație în modul portabil și într-un fișier sigilat de Keystore pe Android — și nu este niciodată înapoiat vizualizării web a aplicației.",
      },
      offline: {
        q: "Funcționează Karasu offline?",
        a: "Lista ta este păstrată în cache local, deci se deschide fără rețea, un titlu din ea își arată pagina din cache cu un +1 funcțional, iar modificările sunt puse în coadă și trimise când revine conexiunea. Răsfoirea titlurilor care nu sunt în lista ta, căutarea și paginile sociale au nevoie de rețea.",
      },
      automatic: {
        q: "Îmi actualizează automat progresul pe AniList?",
        a: "Da, implicit după ce un episod a rulat două treimi din durata lui — sau pentru minutele pe care le stabilești, sau după ce confirmi o notificare, dacă preferi să fii întrebat. Un capitol de pe un site pe care Karasu nu îl numește întreabă întotdeauna mai întâi. Progresul merge doar înainte, iar Karasu îți recitește lista chiar înainte de a scrie.",
      },
      affiliated: {
        q: "Este Karasu afiliat cu AniList?",
        a: "Nu. Este un proiect independent care folosește API-ul public al AniList, cu un client id înregistrat și fără acces special.",
      },
      smartscreen: {
        q: "De ce mă avertizează Windows la instalare?",
        a: "Programul de instalare nu este semnat, așa că SmartScreen nu l-a mai văzut niciodată și o spune. Fiecare versiune vine cu un SHA256SUMS.txt cu care poți verifica descărcarea.",
      },
      network: {
        q: "Cu ce comunică Karasu?",
        a: "Cu API-ul și serverele de imagini ale AniList; cu GitHub, pentru verificarea actualizărilor și descărcare; cu datele comunității despre relațiile dintre episoade, de pe GitHub, cel mult o dată pe săptămână; cu propriul tău server Jellyfin, dacă îl configurezi; cu socketul local al Discord pentru Rich Presence, dacă îl activezi. Imaginile din biografiile utilizatorilor AniList sunt preluate prin proxy-ul limitat al lui Karasu, așa că acele servere îți află adresa IP când deschizi un profil. Nimic altceva și nicio analiză de utilizare.",
      },
    },
  },
  footer: {
    tagline: "Un tracker modern de anime și manga — creat exclusiv pentru AniList.",
    badge: "Open source · gratuit",
    project: "Proiect",
    github: "GitHub",
    download: "Descarcă",
    changelog: "Jurnal de modificări",
    nightly: "Versiuni Nightly",
    help: "Ajutor",
    docs: "Documentație",
    issue: "Raportează o problemă",
    feature: "Propune o funcție",
    discord: "Discord",
    elsewhere: "În altă parte",
    anilist: "AniList",
    security: "Politica de securitate",
    contributing: "Contribuie",
    license: "Licență AGPL-3.0",
    copyright: "Licențiat sub AGPL-3.0 · © 2026 Kyusetzu și contribuitorii Karasu",
    disclaimer:
      "Karasu este un proiect independent și nu este afiliat cu AniList și nici susținut de acesta. SN Pro este folosit sub SIL Open Font License 1.1.",
    language: "Limba",
    aiNote: "Toate limbile în afară de engleză și germană sunt traduceri făcute de IA, pe care nicio persoană nu le-a revizuit.",
  },
  notFound: {
    title: "Aici nu s-a cocoțat nimeni.",
    body: "Pagina pe care o căutai nu există. Întregul site este o singură pagină, iar aceasta nu este ea.",
    back: "Înapoi la Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Lista de anime ca grilă de coperți, cu stările și listele personalizate într-o coloană alături, iar căutarea, sortarea, filtrele și presetările deasupra.",
      caption: "Lista de anime, vizualizare în grilă",
    },
    overview: {
      alt: "Prezentarea generală: un salut cu căutare și următoarele 48 de ore peste bannerul unui sezon, listele ca rafturi, titlurile aflate în difuzare de recuperat și o coloană cu statisticile și propria ta activitate.",
      caption: "Prezentare generală — listele tale, săptămâna, ce ai de recuperat",
    },
    "now-playing": {
      alt: "Fereastra „Se redă acum” plutind deasupra listei de anime: al treilea sezon din Mushoku Tensei detectat în mpv, sezonul 3 episodul 9, cu progresul pe care îl va scrie.",
      caption: "Se redă acum — un episod detectat în mpv",
    },
    seasonal: {
      alt: "Pagina Sezoane: titlurile din toamna lui 2026 ca fișe cu genurile lor și un cronometru invers, anul, sezonul și formatele într-o coloană alături.",
      caption: "Sezoane",
    },
    calendar: {
      alt: "Agenda Calendarului: episoadele difuzate în această săptămână începând de azi, fiecare pe o fișă cu coperta, ora și numărul episodului.",
      caption: "Calendar",
    },
    "stats-overview": {
      alt: "Prezentarea generală a paginii Statistici: totalurile listei, un inel cu stări și formate, țările de origine, încotro a mers timpul de vizionare și lungimea serialelor.",
      caption: "Statistici — prezentare generală",
    },
    franchise: {
      alt: "Graful francizei Mushoku Tensei: al treilea sezon legat de sezoanele anterioare, de light novel și de un manga derivat, cu fișa titlului selectat în lateral.",
      caption: "Graful francizei",
    },
    "phone-overview": {
      alt: "Prezentarea generală pe telefon: un salut cu căutare peste bannerul unui sezon și listele ca rafturi, deasupra barei de jos.",
      caption: "Android — prezentare generală",
    },
    "phone-list": {
      alt: "Lista de anime pe telefon ca grilă de coperți pe trei coloane, cu selectorul de stare și căutarea listei deasupra.",
      caption: "Android — lista de anime",
    },
    "phone-detail": {
      alt: "Pagina de detalii Mushoku Tensei pe telefon, cu foaia de stare deschisă: starea, progresul și nota peste distribuția notelor comunității.",
      caption: "Android — un titlu, cu intrarea lui deschisă",
    },
    "phone-search": {
      alt: "Pagina de căutare pe telefon, cu rezultatele pentru „season 2” ca grilă de coperți.",
      caption: "Android — căutare",
    },
  },
} satisfies Messages;
