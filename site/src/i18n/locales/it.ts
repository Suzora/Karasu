import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Un tracker moderno di anime e manga per AniList",
    description:
      "Karasu è un tracker gratuito e open source di anime e manga, creato esclusivamente per AniList. Si accorge di ciò che riproduci — e, su Windows, di ciò che leggi — e mantiene aggiornati i tuoi progressi su AniList. Windows, Linux e Android.",
    notFoundTitle: "Pagina non trovata — Karasu",
  },
  skip: "Vai al contenuto",
  nav: {
    label: "Principale",
    home: "Karasu — torna in alto",
    changes: "Novità",
    screenshots: "Schermate",
    join: "Partecipa",
    faq: "FAQ",
    github: "GitHub",
    download: "Scarica",
    downloadKarasu: "Scarica Karasu",
    openMenu: "Apri il menu",
    closeMenu: "Chiudi il menu",
  },
  hero: {
    eyebrow: "Gratis · open source · per AniList",
    title: "Il client AniList che segna i tuoi episodi al posto tuo",
    lede: "Le tue liste, la stagione, il calendario delle uscite, le statistiche, il feed e il forum in un'unica finestra veloce, e un rilevamento che aggiorna la tua lista quando finisce un episodio.",
    windows: "Scarica per Windows",
    linux: "Linux",
    android: "Android",
    note: "Versione {version}. L'installer di Windows non è firmato, quindi SmartScreen può mostrare un avviso al primo avvio · Linux è un AppImage sperimentale · Android è un APK da installare manualmente · nessun macOS",
    checksums: "checksum",
    everyDownload: "tutti i download",
  },
  changes: {
    title: "Novità",
    nightly: "Nella Nightly",
    version: "Versione {version}",
    since: "Da {version}, non ancora in una release Stable",
    added: "Aggiunto",
    changed: "Modificato",
    fixed: "Corretto",
    whole: "Tutto il changelog",
  },
  gallery: {
    eyebrow: "Schermate",
    title: "L'app, così com'è",
    which: "Quali schermate",
    desktop: "Desktop",
    android: "Android",
    open: "Apri: {caption}",
    dialog: "Schermata {n} di {total}: {caption}",
    previous: "Schermata precedente",
    next: "Schermata successiva",
    close: "Chiudi",
  },
  join: {
    title: "Provalo, poi raccontaci com'è andata",
    body: "Karasu è sviluppato da un solo maintainer insieme a chiunque voglia unirsi. Una segnalazione di bug, un'idea o un messaggio per dire che qualcosa funziona sul tuo computer aiuta, soprattutto su Linux e Android.",
    discord: "Unisciti al Discord",
    bug: "Segnala un bug",
    source: "Codice sorgente su GitHub",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Domande, con risposte tratte dal codice.",
    items: {
      what: {
        q: "Che cos'è Karasu?",
        a: "Un'app per desktop e Android che gestisce la tua lista di anime e manga su AniList. Si accorge di ciò che stai guardando o leggendo e aggiorna da sola i tuoi progressi su AniList — chiedendo prima conferma una volta per un capitolo di un sito che non nomina — e dà a quella lista un'interfaccia locale veloce, con statistiche, notifiche e le pagine social.",
      },
      free: {
        q: "È gratis?",
        a: "Sì. Karasu è gratuito e rilasciato sotto la GNU AGPL-3.0, o qualsiasi versione successiva. Non esiste un piano a pagamento e non c'è nulla da sbloccare.",
      },
      open: {
        q: "È open source?",
        a: "Sì. Il codice sorgente completo è su GitHub, e ogni release viene compilata lì a partire da un commit con tag.",
      },
      anilist: {
        q: "Che cos'è AniList?",
        a: "Un database e sito di tracciamento gratuito di anime e manga su anilist.co. La tua lista vive lì; Karasu la legge e ci scrive tramite l'API pubblica di AniList.",
      },
      replace: {
        q: "Karasu sostituisce AniList?",
        a: "No. È un client per AniList. La tua lista resta su AniList e ogni modifica fatta da Karasu è visibile sul sito un attimo dopo. Puoi anche usare Karasu senza alcun account, con una lista solo locale.",
      },
      platforms: {
        q: "Quali piattaforme sono supportate?",
        a: "Windows e Android sono Stable, Linux è un AppImage sperimentale e non esiste una build per macOS. Windows ha tutte le funzioni. Android ha la lista, le statistiche, le notifiche, i widget, le pagine social e un proprio updater, ma niente libreria locale e niente area di notifica. Il rilevamento cambia: Windows legge le sessioni multimediali, le finestre di player e browser, mpv e Jellyfin; Linux legge le sessioni multimediali, mpv e Jellyfin, senza titoli delle finestre; Android legge Jellyfin.",
      },
      credentials: {
        q: "Karasu salva le mie credenziali di AniList?",
        a: "Non vede mai la tua password. L'accesso avviene su anilist.co nel tuo browser, che consegna un token a Karasu. Quel token è conservato nell'archivio delle credenziali del tuo sistema operativo sul desktop, in un file cifrato accanto all'app in modalità portatile, e in un file sigillato dal Keystore su Android — e non viene mai restituito alla vista web dell'app.",
      },
      offline: {
        q: "Karasu funziona offline?",
        a: "La tua lista è salvata in cache in locale, quindi si apre senza rete, un titolo al suo interno mostra la pagina in cache con un +1 funzionante, e le modifiche vengono messe in coda e inviate al ritorno della connessione. Sfogliare titoli che non sono nella tua lista, la ricerca e le pagine social richiedono la rete.",
      },
      automatic: {
        q: "Aggiorna automaticamente i miei progressi su AniList?",
        a: "Sì, per impostazione predefinita quando un episodio è stato riprodotto per due terzi della sua durata — oppure per i minuti che imposti, o dopo che hai confermato un avviso, se preferisci che ti venga chiesto. Un capitolo di un sito che Karasu non nomina chiede sempre prima. I progressi vanno solo avanti, e Karasu rilegge la tua lista subito prima di scrivere.",
      },
      affiliated: {
        q: "Karasu è affiliato ad AniList?",
        a: "No. È un progetto indipendente che usa l'API pubblica di AniList, con un client id registrato e nessun accesso speciale.",
      },
      smartscreen: {
        q: "Perché Windows mostra un avviso durante l'installazione?",
        a: "L'installer non è firmato, quindi SmartScreen non l'ha mai visto prima e lo segnala. Ogni release include un SHA256SUMS.txt con cui puoi verificare il download.",
      },
      network: {
        q: "Con cosa comunica Karasu?",
        a: "Con l'API e i server di immagini di AniList; con GitHub, per il controllo degli aggiornamenti e il download; con i dati sulle relazioni tra episodi della community su GitHub, al massimo una volta a settimana; con il tuo server Jellyfin, se ne configuri uno; con il socket locale di Discord per Rich Presence, se lo attivi. Le immagini nelle bio degli utenti AniList vengono recuperate tramite il proxy limitato di Karasu, quindi quegli host conoscono il tuo indirizzo IP quando apri un profilo. Nient'altro, e nessuna analisi d'uso.",
      },
    },
  },
  footer: {
    tagline: "Un tracker moderno di anime e manga — creato esclusivamente per AniList.",
    badge: "Open source · gratis",
    project: "Progetto",
    github: "GitHub",
    download: "Scarica",
    changelog: "Changelog",
    nightly: "Build Nightly",
    help: "Aiuto",
    docs: "Documentazione",
    issue: "Segnala un problema",
    feature: "Proponi una funzione",
    discord: "Discord",
    elsewhere: "Altrove",
    anilist: "AniList",
    security: "Politica di sicurezza",
    contributing: "Contribuire",
    license: "Licenza AGPL-3.0",
    copyright: "Con licenza AGPL-3.0 · © 2026 Kyu e i collaboratori di Karasu",
    disclaimer:
      "Karasu è un progetto indipendente e non è affiliato né approvato da AniList. SN Pro è usato con la SIL Open Font License 1.1.",
    language: "Lingua",
    aiNote: "Tutte le lingue diverse dall'inglese e dal tedesco sono traduzioni automatiche che nessuna persona ha rivisto.",
  },
  notFound: {
    title: "Qui non si è appollaiato nessuno.",
    body: "La pagina che cercavi non esiste. L'intero sito è una pagina sola, e questa non è quella.",
    back: "Torna a Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "La lista di anime come griglia di copertine, con gli stati e le liste personalizzate in una colonna accanto, e ricerca, ordinamento, filtri e preset sopra.",
      caption: "Lista anime, vista a griglia",
    },
    overview: {
      alt: "La Panoramica: un saluto con la ricerca e le prossime 48 ore sul banner di una stagione, le liste come scaffali, i titoli in onda da recuperare e una colonna con le statistiche e la tua attività.",
      caption: "Panoramica — le tue liste, la settimana, cosa recuperare",
    },
    "now-playing": {
      alt: "La finestra «In riproduzione» sospesa sopra la lista di anime: la terza stagione di Mushoku Tensei rilevata in mpv, stagione 3 episodio 9, con il progresso che verrà scritto.",
      caption: "In riproduzione — un episodio rilevato in mpv",
    },
    seasonal: {
      alt: "La pagina Stagioni: i titoli dell'autunno 2026 come schede con i loro generi e un conto alla rovescia, l'anno, la stagione e i formati in una colonna accanto.",
      caption: "Stagioni",
    },
    calendar: {
      alt: "L'agenda del Calendario: gli episodi in onda questa settimana a partire da oggi, ciascuno su una scheda con copertina, orario e numero dell'episodio.",
      caption: "Calendario",
    },
    "stats-overview": {
      alt: "La panoramica della pagina Statistiche: i totali della lista, un anello di stati e formati, i paesi di origine, dove è andato il tempo di visione e la durata delle serie.",
      caption: "Statistiche — panoramica",
    },
    franchise: {
      alt: "Il grafo del franchise di Mushoku Tensei: la terza stagione collegata alle stagioni precedenti, alla light novel e a un manga spin-off, con la scheda del titolo selezionato a lato.",
      caption: "Grafo del franchise",
    },
    "phone-overview": {
      alt: "La Panoramica sul telefono: un saluto con la ricerca sul banner di una stagione e le liste come scaffali, sopra la barra inferiore.",
      caption: "Android — panoramica",
    },
    "phone-list": {
      alt: "La lista di anime sul telefono come griglia di copertine a tre colonne, con il selettore di stato e la ricerca della lista sopra.",
      caption: "Android — lista anime",
    },
    "phone-detail": {
      alt: "La pagina di dettaglio di Mushoku Tensei sul telefono con il foglio dello stato aperto: lo stato, il progresso e il voto sopra la distribuzione dei voti della community.",
      caption: "Android — un titolo, con la sua voce aperta",
    },
    "phone-search": {
      alt: "La pagina di ricerca sul telefono con i risultati per «season 2» come griglia di copertine.",
      caption: "Android — ricerca",
    },
  },
} satisfies Messages;
