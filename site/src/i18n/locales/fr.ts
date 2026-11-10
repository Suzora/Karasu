import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Un outil moderne de suivi d’anime et de manga pour AniList",
    description:
      "Karasu est un outil gratuit et open source de suivi d’anime et de manga, conçu exclusivement pour AniList. Il repère ce que tu regardes — et, sous Windows, ce que tu lis — et garde ta progression AniList à jour. Windows, Linux et Android.",
    notFoundTitle: "Page introuvable — Karasu",
  },
  skip: "Aller au contenu",
  nav: {
    label: "Navigation principale",
    home: "Karasu — retour en haut",
    changes: "Nouveautés",
    screenshots: "Captures d’écran",
    join: "Participer",
    faq: "FAQ",
    github: "GitHub",
    download: "Télécharger",
    downloadKarasu: "Télécharger Karasu",
    openMenu: "Ouvrir le menu",
    closeMenu: "Fermer le menu",
  },
  hero: {
    eyebrow: "Gratuit · open source · pour AniList",
    title: "Le client AniList qui note tes épisodes à ta place",
    lede: "Tes listes, la saison, le calendrier de diffusion, les statistiques, le fil d’actualité et le forum dans une seule fenêtre rapide, avec une détection qui met ta liste à jour quand un épisode se termine.",
    windows: "Télécharger pour Windows",
    linux: "Linux",
    android: "Android",
    note: "Version {version}. L’installateur Windows n’est pas signé, donc SmartScreen peut afficher un avertissement au premier lancement · Linux est un AppImage expérimental · Android est un APK à installer manuellement · pas de macOS",
    checksums: "sommes de contrôle",
    everyDownload: "tous les téléchargements",
  },
  changes: {
    title: "Nouveautés",
    nightly: "Dans la Nightly",
    version: "Version {version}",
    since: "Depuis {version}, pas encore dans une version Stable",
    added: "Ajouts",
    changed: "Modifications",
    fixed: "Corrections",
    whole: "Tout le journal des modifications",
  },
  gallery: {
    eyebrow: "Captures d’écran",
    title: "L’appli, telle qu’elle est",
    which: "Quelles captures d’écran",
    desktop: "Ordinateur",
    android: "Android",
    open: "Ouvrir : {caption}",
    dialog: "Capture d’écran {n} sur {total} : {caption}",
    previous: "Capture d’écran précédente",
    next: "Capture d’écran suivante",
    close: "Fermer",
  },
  join: {
    title: "Essaie-le, puis dis-nous comment ça s’est passé",
    body: "Karasu est développé par un seul mainteneur, avec tous ceux qui se joignent à lui. Un rapport de bug, une idée ou un simple mot pour dire que ça marche chez toi, ça aide, surtout sous Linux et Android.",
    discord: "Rejoindre le Discord",
    bug: "Signaler un bug",
    source: "Code source sur GitHub",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Des questions, des réponses tirées du code.",
    items: {
      what: {
        q: "Qu’est-ce que Karasu ?",
        a: "Une appli pour ordinateur et Android qui gère ta liste d’anime et de manga AniList. Elle repère ce que tu regardes ou lis et met ta progression à jour sur AniList toute seule — en te demandant d’abord confirmation pour un chapitre venant d’un site qu’elle ne nomme pas — et elle offre à cette liste une interface locale rapide, avec statistiques, notifications et pages sociales.",
      },
      free: {
        q: "Est-ce gratuit ?",
        a: "Oui. Karasu est gratuit et publié sous la GNU AGPL-3.0, ou toute version ultérieure. Il n’y a pas d’offre payante et rien à débloquer.",
      },
      open: {
        q: "Est-ce open source ?",
        a: "Oui. Le code source complet est sur GitHub, et chaque version y est compilée à partir d’un commit étiqueté.",
      },
      anilist: {
        q: "Qu’est-ce qu’AniList ?",
        a: "Une base de données et un site de suivi d’anime et de manga gratuits, sur anilist.co. Ta liste y vit ; Karasu la lit et y écrit via l’API publique d’AniList.",
      },
      replace: {
        q: "Karasu remplace-t-il AniList ?",
        a: "Non. C’est un client pour AniList. Ta liste reste sur AniList et chaque changement fait par Karasu est visible sur le site un instant plus tard. Tu peux aussi utiliser Karasu sans aucun compte, avec une liste locale uniquement.",
      },
      platforms: {
        q: "Quelles plateformes sont prises en charge ?",
        a: "Windows et Android sont en Stable, Linux est un AppImage expérimental, et il n’y a pas de version macOS. Windows a toutes les fonctionnalités. Android a la liste, les statistiques, les notifications, les widgets, les pages sociales et son propre outil de mise à jour, mais pas de bibliothèque locale ni de zone de notification. La détection varie : Windows lit les sessions multimédias, les fenêtres de lecteurs et de navigateurs, mpv et Jellyfin ; Linux lit les sessions multimédias, mpv et Jellyfin, sans titres de fenêtres ; Android lit Jellyfin.",
      },
      credentials: {
        q: "Karasu stocke-t-il mes identifiants AniList ?",
        a: "Il ne voit jamais ton mot de passe. La connexion se fait sur anilist.co dans ton navigateur, qui remet un jeton à Karasu. Ce jeton est conservé dans le gestionnaire d’identifiants de ton système sur ordinateur, dans un fichier chiffré à côté de l’appli en mode portable, et dans un fichier scellé par le Keystore sur Android — et il n’est jamais renvoyé à la vue web de l’appli.",
      },
      offline: {
        q: "Karasu fonctionne-t-il hors ligne ?",
        a: "Ta liste est mise en cache localement : elle s’ouvre donc sans réseau, un titre qui s’y trouve affiche sa page en cache avec un +1 fonctionnel, et les modifications sont mises en file d’attente puis envoyées au retour de la connexion. Parcourir des titres qui ne sont pas dans ta liste, la recherche et les pages sociales nécessitent le réseau.",
      },
      automatic: {
        q: "Met-il à jour ma progression AniList automatiquement ?",
        a: "Oui, par défaut dès qu’un épisode a été lu aux deux tiers de sa durée — ou après le nombre de minutes que tu fixes, ou une fois que tu as confirmé une notification, si tu préfères qu’on te demande. Un chapitre venant d’un site que Karasu ne nomme pas demande toujours d’abord. La progression ne fait qu’avancer, et Karasu relit ta liste juste avant d’écrire.",
      },
      affiliated: {
        q: "Karasu est-il affilié à AniList ?",
        a: "Non. C’est un projet indépendant qui utilise l’API publique d’AniList, avec un identifiant client enregistré et sans accès particulier.",
      },
      smartscreen: {
        q: "Pourquoi Windows affiche-t-il un avertissement à l’installation ?",
        a: "L’installateur n’est pas signé, donc SmartScreen ne l’a jamais vu et le signale. Chaque version est accompagnée d’un fichier SHA256SUMS.txt qui te permet de vérifier le téléchargement.",
      },
      network: {
        q: "Avec quoi Karasu communique-t-il ?",
        a: "L’API et les serveurs d’images d’AniList ; GitHub, pour la recherche de mises à jour et le téléchargement ; les données de relations entre épisodes de la communauté, sur GitHub, au plus une fois par semaine ; ton propre serveur Jellyfin si tu en configures un ; le socket local de Discord pour Rich Presence si tu l’actives. Les images des bios d’utilisateurs AniList passent par le proxy limité de Karasu, si bien que ces hébergeurs apprennent ton adresse IP quand tu ouvres un profil. Rien d’autre, et aucune analyse d’audience.",
      },
    },
  },
  footer: {
    tagline: "Un outil moderne de suivi d’anime et de manga — conçu exclusivement pour AniList.",
    badge: "Open source · gratuit",
    project: "Projet",
    github: "GitHub",
    download: "Télécharger",
    changelog: "Journal des modifications",
    nightly: "Versions Nightly",
    help: "Aide",
    docs: "Documentation",
    issue: "Signaler un problème",
    feature: "Proposer une fonctionnalité",
    discord: "Discord",
    elsewhere: "Ailleurs",
    anilist: "AniList",
    security: "Politique de sécurité",
    contributing: "Contribuer",
    license: "Licence AGPL-3.0",
    copyright: "Sous licence AGPL-3.0 · © 2026 Kyusetzu et les contributeurs de Karasu",
    disclaimer:
      "Karasu est un projet indépendant, sans affiliation avec AniList ni approbation de sa part. SN Pro est utilisée sous la SIL Open Font License 1.1.",
    language: "Langue",
    aiNote: "Toutes les langues autres que l’anglais et l’allemand sont des traductions par IA qu’aucune personne n’a relues.",
  },
  notFound: {
    title: "Personne n’est perché ici.",
    body: "La page que tu cherchais n’existe pas. Tout le site tient sur une seule page, et ce n’est pas celle-ci.",
    back: "Retour à Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "La liste d’anime sous forme de grille de jaquettes, avec les statuts et les listes personnalisées dans une colonne à côté, et la recherche, le tri, les filtres et les préréglages au-dessus.",
      caption: "Liste d’anime, vue en grille",
    },
    overview: {
      alt: "L’Aperçu : un message d’accueil avec la recherche et les 48 prochaines heures sur la bannière d’une saison, les listes en étagères, les titres en cours de diffusion à rattraper, et une colonne avec les statistiques et ta propre activité.",
      caption: "Aperçu — tes listes, la semaine, ce qu’il y a à rattraper",
    },
    "now-playing": {
      alt: "La fenêtre « En cours de lecture » flottant au-dessus de la liste d’anime : la troisième saison de Mushoku Tensei détectée dans mpv, saison 3 épisode 9, avec la progression qui sera enregistrée.",
      caption: "En cours de lecture — un épisode détecté dans mpv",
    },
    seasonal: {
      alt: "La page Saisons : les titres de l’automne 2026 sous forme de cartes avec leurs genres et un compte à rebours, l’année, la saison et les formats dans une colonne à côté.",
      caption: "Saisons",
    },
    calendar: {
      alt: "L’agenda du Calendrier : les épisodes diffusés cette semaine à partir d’aujourd’hui, chacun sur une carte avec sa jaquette, son heure et son numéro d’épisode.",
      caption: "Calendrier",
    },
    "stats-overview": {
      alt: "L’aperçu de la page Statistiques : les totaux de la liste, un anneau des statuts et des formats, les pays d’origine, où est passé le temps de visionnage et la durée des séries.",
      caption: "Statistiques — aperçu",
    },
    franchise: {
      alt: "Le graphe de franchise de Mushoku Tensei : la troisième saison reliée aux saisons précédentes, au light novel et à un manga dérivé, avec la carte du titre sélectionné sur le côté.",
      caption: "Graphe de franchise",
    },
    "phone-overview": {
      alt: "L’Aperçu sur téléphone : un message d’accueil avec la recherche sur la bannière d’une saison et les listes en étagères, au-dessus de la barre du bas.",
      caption: "Android — aperçu",
    },
    "phone-list": {
      alt: "La liste d’anime sur téléphone sous forme de grille de jaquettes à trois colonnes, avec le sélecteur de statut et la recherche de la liste au-dessus.",
      caption: "Android — liste d’anime",
    },
    "phone-detail": {
      alt: "La page de détail de Mushoku Tensei sur téléphone avec la feuille de statut ouverte : le statut, la progression et la note au-dessus de la répartition des notes de la communauté.",
      caption: "Android — un titre, avec son entrée ouverte",
    },
    "phone-search": {
      alt: "La page de recherche sur téléphone avec les résultats pour « season 2 » sous forme de grille de jaquettes.",
      caption: "Android — recherche",
    },
  },
} satisfies Messages;
