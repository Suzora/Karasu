import type { PartialLocale } from "../types";

/** es-419, machine-translated from English; a missing key shows in English. */
const locale: PartialLocale = {
  nav: {
    settings: "Configuración",
  },
  syncPanel: {
    src_listOptions: "Configuración de la lista",
  },
  notif: {
    groupLikes: "le gustó {{n}} de tus actividades",
    groupReplyLikes: "le gustó {{n}} de tus respuestas",
    groupReplies: "respondió a {{n}} de tus actividades",
    siteFollowing: "empezó a seguirte",
    siteActivityMention: "te mencionó en una actividad",
    siteActivityReply: "respondió a tu actividad",
    siteActivityReplySubscribed: "respondió a una actividad que sigues",
    siteActivityLike: "le gustó tu actividad",
    siteActivityReplyLike: "le gustó tu respuesta",
    siteThreadMention: "{{name}} te mencionó aquí",
    siteThreadReply: "{{name}} respondió a tu comentario",
    siteThreadSubscribed: "{{name}} comentó en este hilo que sigues",
    siteThreadCommentLike: "A {{name}} le gustó tu comentario",
    siteThreadLike: "A {{name}} le gustó tu hilo",
    siteActivityReplyLikeTo: "le gustó tu respuesta a",
  },
  composer: {
    video: "Video de YouTube — youtube(url)",
  },
  ctx: {
    settings: "Configuración",
  },
  list: {
    toSettings: "Ir a Configuración",
  },
  detail: {
    filteredHint: "Puedes cambiar el filtro en Configuración.",
  },
  library: {
    toSettings: "Abrir configuración",
  },
  social: {
    bioMarkdownHint: "Funciona markdown, imágenes incluidas; los videos se muestran como enlaces. La vista previa es exactamente cómo se verá tu perfil en Karasu.",
    otherAccountSettings: "Otras configuraciones de la cuenta de AniList →",
    composerPlaceholder: "Di algo. Ctrl+Enter para publicar.",
    noUserComments: "{{name}} no comentó en el foro",
    mdVideo: "Video",
  },
  settings: {
    alAccount: "Configuración de la cuenta",
    alSaveFailed: "Esa configuración no se guardó",
    alOverrideTitleLanguage: "Karasu elige los títulos con su propia configuración e ignora esta.",
    alOverrideAdult: "Karasu filtra el contenido adulto con su propia configuración, que es la más estricta de los dos.",
    alOverrideWhere: "Configuración de Karasu →",
    title: "Configuración",
    stepClientId: "No se encontró ningún ID de cliente integrado. Crea un cliente de API en la configuración de desarrollador de AniList (URL de redirección {{url}}) e introduce aquí su ID.",
    openDeveloper: "Abrir configuración de desarrollador",
    mediaSessionsHint: "Detecta también los reproductores que informan a los controles multimedia de tu escritorio en lugar de poner el título en su ventana. Incluye Jellyfin Media Player, Plex y video del navegador.",
    jellyfinDeviceHelp: "Si se deja vacío, cuenta cualquier dispositivo en el que reproduzcas: escritorio, navegador, celular o TV. Indica uno para registrar solo ese dispositivo; «Probar conexión» muestra cómo se llama realmente cada uno de los tuyos.",
    trackingSaveFailed: "Esa configuración no se guardó ({{message}}), así que se restableció.",
    jellyfinKarasuMobile: "Karasu · celular",
    batteryVendors: "Algunos fabricantes añaden reglas propias encima. Los pasos para cada celular:",
    batteryFailed: "No se pudo abrir la configuración de batería ({{message}})",
    notifJobRefusedHint: "La configuración está guardada; Karasu la reintenta en el próximo inicio",
    contentSaveFailed: "Esa configuración no se guardó ({{message}}), así que se restableció.",
    dangerTitle: "Esta configuración puede hacer perder datos",
    contrastHint: "Alto eleva el texto, el color de acento y todos los bordes a al menos 7:1 y desactiva degradados, sombras y cristal, en oscuro y en claro. Sistema sigue la configuración de contraste de tu sistema operativo.",
    hotkeyHintPortal: "En Wayland tu escritorio es el dueño de los atajos globales: Karasu propone este, el escritorio puede pedirte confirmarlo y, desde entonces, la tecla se cambia en la configuración del propio escritorio. Déjalo vacío para desactivarlo.",
    hotkeyBoundNoTrigger: "Registrado en tu escritorio; fija la tecla en su propia configuración de atajos.",
    hotkeyDenied: "Tu escritorio rechazó el atajo. Presiona Enter en el campo para que te lo pregunte otra vez, o asigna una tecla en la configuración de teclado del sistema.",
    hotkeyFailed: "Tu escritorio no pudo aceptar el atajo, así que esto solo funciona mientras una ventana X11 tiene el foco; el registro tiene el motivo. Presiona Enter en el campo para reintentarlo.",
    hotkeyConfigure: "Cambiar en la configuración del sistema",
  },
};

export default locale;
