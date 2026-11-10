import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Nowoczesny tracker anime i mangi dla AniList",
    description:
      "Karasu to darmowy tracker anime i mangi o otwartym kodzie, stworzony wyłącznie dla AniList. Zauważa, co odtwarzasz — a w Windows także co czytasz — i na bieżąco aktualizuje Twój postęp na AniList. Windows, Linux i Android.",
    notFoundTitle: "Nie znaleziono strony — Karasu",
  },
  skip: "Przejdź do treści",
  nav: {
    label: "Menu główne",
    home: "Karasu — wróć na górę",
    changes: "Co nowego",
    screenshots: "Zrzuty ekranu",
    join: "Dołącz",
    faq: "FAQ",
    github: "GitHub",
    download: "Pobierz",
    downloadKarasu: "Pobierz Karasu",
    openMenu: "Otwórz menu",
    closeMenu: "Zamknij menu",
  },
  hero: {
    eyebrow: "Darmowy · otwarty kod · dla AniList",
    title: "Klient AniList, który wpisuje Twoje odcinki za Ciebie",
    lede: "Twoje listy, sezon, kalendarz emisji, statystyki, aktualności i forum w jednym szybkim oknie — oraz rozpoznawanie, które aktualizuje Twoją listę, gdy odcinek się skończy.",
    windows: "Pobierz dla Windows",
    linux: "Linux",
    android: "Android",
    note: "Wersja {version}. Instalator dla Windows nie jest podpisany cyfrowo, więc SmartScreen może ostrzec przy pierwszym uruchomieniu · Linux to eksperymentalny AppImage · Android to APK do instalacji ręcznej · brak macOS",
    checksums: "sumy kontrolne",
    everyDownload: "wszystkie pliki do pobrania",
  },
  changes: {
    title: "Co nowego",
    nightly: "W Nightly",
    version: "Wersja {version}",
    since: "Od {version}, jeszcze w żadnym wydaniu Stable",
    added: "Dodano",
    changed: "Zmieniono",
    fixed: "Naprawiono",
    whole: "Cały dziennik zmian",
  },
  gallery: {
    eyebrow: "Zrzuty ekranu",
    title: "Aplikacja taka, jaka jest",
    which: "Które zrzuty ekranu",
    desktop: "Komputer",
    android: "Android",
    open: "Otwórz: {caption}",
    dialog: "Zrzut ekranu {n} z {total}: {caption}",
    previous: "Poprzedni zrzut ekranu",
    next: "Następny zrzut ekranu",
    close: "Zamknij",
  },
  join: {
    title: "Wypróbuj i daj znać, jak poszło",
    body: "Karasu tworzy jeden opiekun razem ze wszystkimi, którzy się przyłączą. Zgłoszenie błędu, pomysł albo wiadomość, że coś działa na Twoim komputerze, bardzo pomaga — zwłaszcza na Linuksie i Androidzie.",
    discord: "Dołącz do Discorda",
    bug: "Zgłoś błąd",
    source: "Kod źródłowy na GitHubie",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Pytania, na które odpowiada kod.",
    items: {
      what: {
        q: "Czym jest Karasu?",
        a: "Aplikacją na komputer i Androida, która prowadzi Twoją listę anime i mangi na AniList. Zauważa, co odtwarzasz lub czytasz, i sama aktualizuje Twój postęp na AniList — przy rozdziale ze strony, której nie zna z nazwy, najpierw raz pyta — a do tego daje tej liście szybki lokalny interfejs ze statystykami, powiadomieniami i stronami społecznościowymi.",
      },
      free: {
        q: "Czy jest darmowa?",
        a: "Tak. Karasu nic nie kosztuje i jest wydane na licencji GNU AGPL-3.0 lub dowolnej późniejszej wersji. Nie ma płatnego poziomu ani niczego do odblokowania.",
      },
      open: {
        q: "Czy ma otwarty kod?",
        a: "Tak. Cały kod źródłowy jest na GitHubie i każde wydanie jest tam budowane z oznaczonego commita.",
      },
      anilist: {
        q: "Czym jest AniList?",
        a: "Darmową bazą danych i serwisem do śledzenia anime i mangi pod adresem anilist.co. Tam znajduje się Twoja lista; Karasu czyta ją i zapisuje przez publiczne API AniList.",
      },
      replace: {
        q: "Czy Karasu zastępuje AniList?",
        a: "Nie. To klient dla AniList. Twoja lista zostaje na AniList, a każda zmiana wprowadzona przez Karasu jest widoczna na stronie chwilę później. Możesz też używać Karasu w ogóle bez konta, tylko z lokalną listą.",
      },
      platforms: {
        q: "Jakie platformy są obsługiwane?",
        a: "Windows i Android to Stable, Linux to eksperymentalny AppImage, a wersji na macOS nie ma. Windows ma wszystkie funkcje. Android ma listę, statystyki, powiadomienia, widżety, strony społecznościowe i własny aktualizator, ale nie ma lokalnej biblioteki ani zasobnika systemowego. Rozpoznawanie różni się: Windows czyta sesje multimedialne, okna odtwarzaczy i przeglądarek, mpv i Jellyfin; Linux czyta sesje multimedialne, mpv i Jellyfin, bez tytułów okien; Android czyta Jellyfin.",
      },
      credentials: {
        q: "Czy Karasu przechowuje moje dane logowania do AniList?",
        a: "Nigdy nie widzi Twojego hasła. Logowanie odbywa się na anilist.co w Twojej przeglądarce, która przekazuje Karasu token. Ten token jest przechowywany w magazynie poświadczeń systemu operacyjnego na komputerze, w zaszyfrowanym pliku obok aplikacji w trybie przenośnym i w pliku zapieczętowanym przez Keystore na Androidzie — i nigdy nie jest przekazywany z powrotem do widoku webowego aplikacji.",
      },
      offline: {
        q: "Czy Karasu działa offline?",
        a: "Twoja lista jest lokalnie buforowana, więc otwiera się bez sieci, tytuł z niej pokazuje zapisaną stronę z działającym +1, a zmiany są kolejkowane i wysyłane po powrocie połączenia. Przeglądanie tytułów spoza Twojej listy, wyszukiwanie i strony społecznościowe wymagają sieci.",
      },
      automatic: {
        q: "Czy aktualizuje mój postęp na AniList automatycznie?",
        a: "Tak, domyślnie gdy odcinek zostanie odtworzony przez dwie trzecie swojej długości — albo przez ustawioną liczbę minut, albo po potwierdzeniu powiadomienia, jeśli wolisz być pytany. Rozdział ze strony, której Karasu nie zna z nazwy, zawsze najpierw pyta. Postęp zawsze idzie tylko do przodu, a Karasu czyta Twoją listę ponownie tuż przed zapisem.",
      },
      affiliated: {
        q: "Czy Karasu jest powiązane z AniList?",
        a: "Nie. To niezależny projekt korzystający z publicznego API AniList, z zarejestrowanym identyfikatorem klienta i bez specjalnego dostępu.",
      },
      smartscreen: {
        q: "Dlaczego Windows ostrzega podczas instalacji?",
        a: "Instalator nie jest podpisany cyfrowo, więc SmartScreen nigdy wcześniej go nie widział i mówi o tym. Każde wydanie zawiera plik SHA256SUMS.txt, z którym możesz porównać pobrany plik.",
      },
      network: {
        q: "Z kim rozmawia Karasu?",
        a: "Z API i serwerami obrazów AniList; z GitHubem w celu sprawdzenia aktualizacji i pobrania; z danymi społeczności o relacjach odcinków na GitHubie, najwyżej raz w tygodniu; z Twoim własnym serwerem Jellyfin, jeśli go skonfigurujesz; z lokalnym gniazdem Discorda dla Rich Presence, jeśli to włączysz. Obrazy w opisach użytkowników AniList są pobierane przez własne, ograniczone proxy Karasu, więc te serwery poznają Twój adres IP, gdy otworzysz profil. Nic poza tym i żadnej analityki.",
      },
    },
  },
  footer: {
    tagline: "Nowoczesny tracker anime i mangi — stworzony wyłącznie dla AniList.",
    badge: "Otwarty kod · darmowy",
    project: "Projekt",
    github: "GitHub",
    download: "Pobierz",
    changelog: "Dziennik zmian",
    nightly: "Kompilacje Nightly",
    help: "Pomoc",
    docs: "Dokumentacja",
    issue: "Zgłoś problem",
    feature: "Zaproponuj funkcję",
    discord: "Discord",
    elsewhere: "Gdzie indziej",
    anilist: "AniList",
    security: "Polityka bezpieczeństwa",
    contributing: "Współtworzenie",
    license: "Licencja AGPL-3.0",
    copyright: "Na licencji AGPL-3.0 · © 2026 Kyusetzu i współtwórcy Karasu",
    disclaimer:
      "Karasu to niezależny projekt, niepowiązany z AniList ani przez AniList niezatwierdzony. SN Pro jest używany na licencji SIL Open Font License 1.1.",
    language: "Język",
    aiNote: "Każdy język poza angielskim i niemieckim to tłumaczenie AI, którego żaden człowiek nie sprawdził.",
  },
  notFound: {
    title: "Nikt tu nie przysiadł.",
    body: "Strona, której szukasz, nie istnieje. Cała witryna to jedna strona, a to nie ona.",
    back: "Wróć do Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Lista anime jako siatka okładek, obok kolumna ze statusami i własnymi listami, a nad nią wyszukiwanie, sortowanie, filtry i ustawienia wstępne.",
      caption: "Lista anime, widok siatki",
    },
    overview: {
      alt: "Przegląd: powitanie z wyszukiwaniem i najbliższe 48 godzin nad bannerem sezonu, listy jako półki, emitowane tytuły do nadrobienia oraz kolumna ze statystykami i Twoją własną aktywnością.",
      caption: "Przegląd — Twoje listy, tydzień, co możesz nadrobić",
    },
    "now-playing": {
      alt: "Okno Teraz odtwarzane unosi się nad listą anime: trzeci sezon Mushoku Tensei rozpoznany w mpv, sezon 3 odcinek 9, z postępem, który zostanie zapisany.",
      caption: "Teraz odtwarzane — odcinek rozpoznany w mpv",
    },
    seasonal: {
      alt: "Strona sezonu: tytuły z jesieni 2026 jako karty z gatunkami i odliczaniem, obok kolumna z rokiem, sezonem i formatami.",
      caption: "Sezon",
    },
    calendar: {
      alt: "Plan kalendarza: emitowane odcinki tygodnia od dziś, każdy na karcie z okładką, godziną i numerem odcinka.",
      caption: "Kalendarz",
    },
    "stats-overview": {
      alt: "Przegląd strony statystyk: sumy listy, pierścień statusów i formatów, kraje pochodzenia, na co poszedł czas oglądania i długości serii.",
      caption: "Statystyki — przegląd",
    },
    franchise: {
      alt: "Graf franczyzy Mushoku Tensei: trzeci sezon połączony z wcześniejszymi sezonami, light novel i mangą spin-off, a z boku karta wybranego tytułu.",
      caption: "Graf franczyzy",
    },
    "phone-overview": {
      alt: "Przegląd na telefonie: powitanie z wyszukiwaniem nad bannerem sezonu i listy jako półki, nad dolnym paskiem.",
      caption: "Android — przegląd",
    },
    "phone-list": {
      alt: "Lista anime na telefonie jako trzykolumnowa siatka okładek, nad nią wybór statusu i wyszukiwanie listy.",
      caption: "Android — lista anime",
    },
    "phone-detail": {
      alt: "Strona szczegółów Mushoku Tensei na telefonie z otwartym arkuszem statusu: status, postęp i ocena nad rozkładem ocen społeczności.",
      caption: "Android — tytuł z otwartym wpisem",
    },
    "phone-search": {
      alt: "Strona wyszukiwania na telefonie z wynikami dla „season 2” jako siatką okładek.",
      caption: "Android — wyszukiwanie",
    },
  },
} satisfies Messages;
