import type { PartialLocale } from "../types";

/** fr-CA, machine-translated from English; a missing key shows in English. */
const locale: PartialLocale = {
  nav: {
    settings: "Paramètres",
  },
  syncPanel: {
    src_genreTags: "Genres et étiquettes",
    src_listOptions: "Paramètres des listes",
  },
  keys: {
    spoiler: "Divulgâcheur",
  },
  composer: {
    spoiler: "Divulgâcheur",
    spoilerLabelled: "Divulgâcheur avec un titre",
  },
  ctx: {
    settings: "Paramètres",
  },
  stats: {
    localMissing: "Le temps de visionnage et les classements de genres, étiquettes, studios, doubleurs et équipes nécessitent un compte AniList : AniList les précalcule sur tous les titres que tu as suivis, et une entrée de liste ne porte ni durée d'épisode ni crédit d'équipe. Tout ce qui est au-dessus est calculé depuis ta propre liste.",
    genresTags: "Genres et étiquettes",
    tags: "Étiquettes",
  },
  about: {
    apkNeedsPermission: "Android a besoin de ton autorisation pour que Karasu installe des mises à jour : un seul réglage, « Installer des applications inconnues », rien que pour cette application.",
    apkBlockedMetered: "{{version}} attend le Wi-Fi. Le charger en données cellulaires coûte environ 23 Mo.",
    email: "Courriel",
  },
  list: {
    colTags: "Étiquettes",
    toSettings: "Aller aux paramètres",
    groupTag: "Étiquette",
    groupUntagged: "Sans étiquette",
    filterTags: "Chercher des étiquettes…",
  },
  search: {
    tagLabel: "Étiquette",
  },
  detail: {
    moreAnime: "Plus · revisionnages, étiquettes, notes",
    moreManga: "Plus · relectures, étiquettes, notes",
    tags: "Étiquettes",
    showSpoilerTags: "Afficher {{n}} étiquettes de divulgâcheur",
    links: "Liens externes et de diffusion en continu",
    filteredHint: "Tu peux changer le filtre dans les paramètres.",
  },
  library: {
    toSettings: "Ouvrir les paramètres",
  },
  tags: {
    label: "Étiquettes",
    placeholder: "Ajouter une étiquette…",
  },
  social: {
    otherAccountSettings: "Autres paramètres du compte AniList →",
    mdSpoiler: "Divulgâcheur",
    mdSpoilerLabelled: "Divulgâcheur : {{label}}",
  },
  settings: {
    alAccount: "Paramètres du compte",
    title: "Paramètres",
    groupTags: "Étiquettes",
    tagsHint: "Choisis une couleur pour chaque étiquette. Les couleurs restent sur cet appareil ; les étiquettes elles-mêmes vivent dans tes notes AniList.",
    tagsEmpty: "Pas encore d'étiquette. Ajoutes-en à une entrée sous Plus · revisionnages, étiquettes, notes.",
    stepClientId: "Aucun ID client intégré trouvé. Crée un client API dans tes paramètres de développeur AniList (URL de redirection {{url}}) et saisis son ID ici.",
    openDeveloper: "Ouvrir les paramètres de développeur",
    batteryFailed: "Impossible d'ouvrir les paramètres de la batterie ({{message}})",
    jellyfinExternalHint: "Utilisée quand le serveur n'est pas joignable à l'adresse ci-dessus — hors de chez toi, en données cellulaires. Karasu vérifie qu'il s'agit du même serveur avant d'envoyer quoi que ce soit.",
    dangerTitle: "Ces paramètres peuvent faire perdre des données",
    hotkeyHintPortal: "Sous Wayland, ton bureau gère les raccourcis globaux : Karasu propose celui-ci, le bureau peut te demander de le confirmer, puis la touche se change dans les paramètres du bureau. Laisse vide pour désactiver.",
    hotkeyBoundNoTrigger: "Enregistré auprès de ton bureau ; règle la touche dans ses propres paramètres de raccourcis.",
    hotkeyDenied: "Ton bureau a refusé le raccourci. Appuie sur Entrée dans le champ pour qu'il soit redemandé, ou attribue une touche dans les paramètres clavier de ton système.",
    hotkeyConfigure: "Changer dans les paramètres système",
    apkMetered: "Télécharger les mises à jour en données cellulaires",
  },
};

export default locale;
