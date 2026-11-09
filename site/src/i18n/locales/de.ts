import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Ein moderner Anime- und Manga-Tracker für AniList",
    description:
      "Karasu ist ein kostenloser Open-Source-Tracker für Anime und Manga, gebaut ausschließlich für AniList. Er bemerkt, was du abspielst — und unter Windows, was du liest — und hält deinen Fortschritt auf AniList aktuell. Windows, Linux und Android.",
    notFoundTitle: "Seite nicht gefunden — Karasu",
  },
  skip: "Zum Inhalt springen",
  nav: {
    label: "Hauptnavigation",
    home: "Karasu — zurück nach oben",
    changes: "Neuigkeiten",
    screenshots: "Screenshots",
    join: "Mitmachen",
    faq: "FAQ",
    github: "GitHub",
    download: "Herunterladen",
    downloadKarasu: "Karasu herunterladen",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
  },
  hero: {
    eyebrow: "Kostenlos · Open Source · für AniList",
    title: "Der AniList-Client, der deine Folgen für dich einträgt",
    lede: "Deine Listen, die Season, der Ausstrahlungskalender, Statistiken, der Feed und das Forum in einem schnellen Fenster — und eine Erkennung, die deine Liste aktualisiert, wenn eine Folge zu Ende ist.",
    windows: "Für Windows herunterladen",
    linux: "Linux",
    android: "Android",
    note: "Version {version}. Der Windows-Installer ist nicht signiert, daher kann SmartScreen beim ersten Start warnen · Linux ist ein experimentelles AppImage · Android ist eine APK zum Sideloaden · kein macOS",
    checksums: "Prüfsummen",
    everyDownload: "alle Downloads",
  },
  changes: {
    title: "Neuigkeiten",
    nightly: "Im Nightly",
    version: "Version {version}",
    since: "Seit {version}, noch in keinem Stable-Release",
    added: "Neu",
    changed: "Geändert",
    fixed: "Behoben",
    whole: "Das ganze Changelog",
  },
  gallery: {
    eyebrow: "Screenshots",
    title: "Die App, wie sie ist",
    which: "Welche Screenshots",
    desktop: "Desktop",
    android: "Android",
    open: "Öffnen: {caption}",
    dialog: "Screenshot {n} von {total}: {caption}",
    previous: "Vorheriger Screenshot",
    next: "Nächster Screenshot",
    close: "Schließen",
  },
  join: {
    title: "Probier es aus und erzähl uns, wie es lief",
    body: "Karasu wird von einem Maintainer gebaut, zusammen mit allen, die mitmachen. Ein Fehlerbericht, eine Idee oder die Rückmeldung, dass etwas auf deinem Rechner läuft, hilft — vor allem unter Linux und Android.",
    discord: "Dem Discord beitreten",
    bug: "Fehler melden",
    source: "Quellcode auf GitHub",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Fragen, beantwortet aus dem Code.",
    items: {
      what: {
        q: "Was ist Karasu?",
        a: "Eine Desktop- und Android-App für deine Anime- und Manga-Liste auf AniList. Sie bemerkt, was du gerade schaust oder liest, und aktualisiert deinen Fortschritt auf AniList von selbst — bei einem Kapitel von einer Seite, die sie nicht namentlich kennt, fragt sie vorher einmal nach — und sie gibt dieser Liste eine schnelle lokale Oberfläche mit Statistiken, Benachrichtigungen und den sozialen Seiten.",
      },
      free: {
        q: "Ist es kostenlos?",
        a: "Ja. Karasu kostet nichts und steht unter der GNU AGPL-3.0 oder einer späteren Version. Es gibt keine Bezahlstufe und nichts freizuschalten.",
      },
      open: {
        q: "Ist es Open Source?",
        a: "Ja. Der komplette Quellcode liegt auf GitHub, und jedes Release wird dort aus einem getaggten Commit gebaut.",
      },
      anilist: {
        q: "Was ist AniList?",
        a: "Eine kostenlose Anime- und Manga-Datenbank mit Tracking unter anilist.co. Dort liegt deine Liste; Karasu liest und schreibt sie über die öffentliche API von AniList.",
      },
      replace: {
        q: "Ersetzt Karasu AniList?",
        a: "Nein. Es ist ein Client dafür. Deine Liste bleibt auf AniList, und jede Änderung, die Karasu macht, ist einen Moment später auf der Website zu sehen. Du kannst Karasu auch ganz ohne Konto nutzen, nur mit einer lokalen Liste.",
      },
      platforms: {
        q: "Welche Plattformen werden unterstützt?",
        a: "Windows und Android sind Stable, Linux ist ein experimentelles AppImage, und für macOS gibt es keinen Build. Windows hat alle Funktionen. Android hat die Liste, Statistiken, Benachrichtigungen, Widgets, die sozialen Seiten und einen eigenen Updater, aber keine lokale Bibliothek und kein Tray. Die Erkennung unterscheidet sich: Windows liest Mediensitzungen, Player- und Browserfenster, mpv und Jellyfin; Linux liest Mediensitzungen, mpv und Jellyfin, aber keine Fenstertitel; Android liest Jellyfin.",
      },
      credentials: {
        q: "Speichert Karasu meine AniList-Zugangsdaten?",
        a: "Dein Passwort sieht es nie. Die Anmeldung läuft auf anilist.co in deinem Browser, der Karasu ein Token übergibt. Dieses Token liegt auf dem Desktop im Anmeldedatenspeicher deines Betriebssystems, im portablen Modus in einer verschlüsselten Datei neben der App und unter Android in einer mit dem Keystore versiegelten Datei — und es wird nie an die Web-Ansicht der App zurückgegeben.",
      },
      offline: {
        q: "Funktioniert Karasu offline?",
        a: "Deine Liste wird lokal zwischengespeichert. Sie öffnet sich also ohne Netzwerk, ein Titel darauf zeigt seine gespeicherte Seite mit funktionierendem +1, und Änderungen werden in eine Warteschlange gestellt und gesendet, sobald die Verbindung zurück ist. Titel außerhalb deiner Liste, die Suche und die sozialen Seiten brauchen das Netzwerk.",
      },
      automatic: {
        q: "Aktualisiert es meinen Fortschritt auf AniList automatisch?",
        a: "Ja, standardmäßig sobald eine Folge zwei Drittel ihrer Länge gelaufen ist — oder nach den Minuten, die du einstellst, oder nachdem du eine Meldung bestätigt hast, wenn du lieber gefragt werden willst. Bei einem Kapitel von einer Seite, die Karasu nicht namentlich kennt, fragt es immer zuerst. Der Fortschritt geht nur vorwärts, und Karasu liest deine Liste direkt vor dem Schreiben noch einmal.",
      },
      affiliated: {
        q: "Gehört Karasu zu AniList?",
        a: "Nein. Es ist ein unabhängiges Projekt, das die öffentliche API von AniList nutzt, mit einer registrierten Client-ID und ohne besonderen Zugang.",
      },
      smartscreen: {
        q: "Warum warnt Windows bei der Installation?",
        a: "Der Installer ist nicht signiert, also hat SmartScreen ihn noch nie gesehen und sagt das. Jedes Release enthält eine SHA256SUMS.txt, mit der du den Download prüfen kannst.",
      },
      network: {
        q: "Mit wem spricht Karasu?",
        a: "Mit der API und den Bildservern von AniList; mit GitHub für die Update-Prüfung und den Download; mit den Episoden-Relationsdaten der Community auf GitHub, höchstens einmal pro Woche; mit deinem eigenen Jellyfin-Server, wenn du einen einrichtest; mit dem lokalen Socket von Discord für Rich Presence, wenn du es einschaltest. Bilder in AniList-Profiltexten werden über Karasus eigenen, begrenzten Proxy geladen, daher erfahren diese Hosts deine IP-Adresse, wenn du ein Profil öffnest. Sonst nichts, und keine Analyse.",
      },
    },
  },
  footer: {
    tagline: "Ein moderner Anime- und Manga-Tracker — ausschließlich für AniList gebaut.",
    badge: "Open Source · kostenlos",
    project: "Projekt",
    github: "GitHub",
    download: "Herunterladen",
    changelog: "Changelog",
    nightly: "Nightly-Builds",
    help: "Hilfe",
    docs: "Dokumentation",
    issue: "Problem melden",
    feature: "Funktion vorschlagen",
    discord: "Discord",
    elsewhere: "Anderswo",
    anilist: "AniList",
    security: "Sicherheitsrichtlinie",
    contributing: "Mitwirken",
    license: "AGPL-3.0-Lizenz",
    copyright: "Lizenziert unter AGPL-3.0 · © 2026 Kyu und die Karasu-Mitwirkenden",
    disclaimer:
      "Karasu ist ein unabhängiges Projekt und steht in keiner Verbindung zu AniList und wird nicht von AniList unterstützt. SN Pro wird unter der SIL Open Font License 1.1 verwendet.",
    language: "Sprache",
    aiNote: "Alle Sprachen außer Englisch und Deutsch sind KI-Übersetzungen, die niemand geprüft hat.",
  },
  notFound: {
    title: "Hier sitzt niemand.",
    body: "Die Seite, die du gesucht hast, gibt es nicht. Die ganze Website ist eine Seite, und das hier ist sie nicht.",
    back: "Zurück zu Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Die Anime-Liste als Cover-Raster, daneben eine Spalte mit den Status und eigenen Listen, darüber Suche, Sortierung, Filter und Voreinstellungen.",
      caption: "Anime-Liste, Rasteransicht",
    },
    overview: {
      alt: "Die Übersicht: eine Begrüßung mit Suche und den nächsten 48 Stunden über dem Banner einer Season, die Listen als Regale, die laufenden Titel zum Aufholen und eine Spalte mit den Statistiken und deiner eigenen Aktivität.",
      caption: "Übersicht — deine Listen, die Woche, was du aufholen kannst",
    },
    "now-playing": {
      alt: "Das Fenster „Läuft gerade“ schwebt über der Anime-Liste: die dritte Staffel von Mushoku Tensei in mpv erkannt, Staffel 3 Folge 9, mit dem Fortschritt, den es eintragen wird.",
      caption: "Läuft gerade — eine Folge in mpv erkannt",
    },
    seasonal: {
      alt: "Die Season-Seite: die Titel von Herbst 2026 als Karten mit ihren Genres und einem Countdown, daneben eine Spalte mit Jahr, Season und Formaten.",
      caption: "Season",
    },
    calendar: {
      alt: "Die Agenda des Kalenders: die ausgestrahlten Folgen der Woche ab heute, jede auf einer Karte mit Cover, Uhrzeit und Folgennummer.",
      caption: "Kalender",
    },
    "stats-overview": {
      alt: "Die Übersicht der Statistikseite: die Summen der Liste, ein Ring aus Status und Formaten, die Herkunftsländer, wohin die Zeit ging und die Serienlängen.",
      caption: "Statistiken — Übersicht",
    },
    franchise: {
      alt: "Der Franchise-Graph von Mushoku Tensei: die dritte Staffel verbunden mit den früheren Staffeln, der Light Novel und einem Spin-off-Manga, mit der Karte des gewählten Titels an der Seite.",
      caption: "Franchise-Graph",
    },
    "phone-overview": {
      alt: "Die Übersicht auf dem Handy: eine Begrüßung mit Suche über dem Banner einer Season und die Listen als Regale, über der unteren Leiste.",
      caption: "Android — Übersicht",
    },
    "phone-list": {
      alt: "Die Anime-Liste auf dem Handy als dreispaltiges Cover-Raster, darüber die Statusauswahl und die Suche der Liste.",
      caption: "Android — Anime-Liste",
    },
    "phone-detail": {
      alt: "Die Detailseite von Mushoku Tensei auf dem Handy mit offenem Status-Sheet: Status, Fortschritt und Bewertung über der Verteilung der Bewertungen der Community.",
      caption: "Android — ein Titel mit offenem Eintrag",
    },
    "phone-search": {
      alt: "Die Suchseite auf dem Handy mit den Ergebnissen für „season 2“ als Cover-Raster.",
      caption: "Android — Suche",
    },
  },
} satisfies Messages;
