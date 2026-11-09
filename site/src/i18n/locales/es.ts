import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Un seguidor moderno de anime y manga para AniList",
    description:
      "Karasu es un seguidor gratuito y de código abierto de anime y manga, creado exclusivamente para AniList. Se da cuenta de lo que reproduces — y, en Windows, de lo que lees — y mantiene al día tu progreso en AniList. Windows, Linux y Android.",
    notFoundTitle: "Página no encontrada — Karasu",
  },
  skip: "Saltar al contenido",
  nav: {
    label: "Principal",
    home: "Karasu — volver arriba",
    changes: "Novedades",
    screenshots: "Capturas de pantalla",
    join: "Participa",
    faq: "FAQ",
    github: "GitHub",
    download: "Descargar",
    downloadKarasu: "Descargar Karasu",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
  },
  hero: {
    eyebrow: "Gratis · código abierto · para AniList",
    title: "El cliente de AniList que anota tus episodios por ti",
    lede: "Tus listas, la temporada, el calendario de emisión, las estadísticas, el feed y el foro en una sola ventana rápida, y una detección que pone al día tu lista cuando termina un episodio.",
    windows: "Descargar para Windows",
    linux: "Linux",
    android: "Android",
    note: "Versión {version}. El instalador de Windows no está firmado, así que SmartScreen puede mostrar un aviso la primera vez · Linux es un AppImage experimental · Android es un APK de instalación manual · sin macOS",
    checksums: "sumas de verificación",
    everyDownload: "todas las descargas",
  },
  changes: {
    title: "Novedades",
    nightly: "En la Nightly",
    version: "Versión {version}",
    since: "Desde {version}, aún no en una versión Stable",
    added: "Añadido",
    changed: "Cambiado",
    fixed: "Corregido",
    whole: "Todo el registro de cambios",
  },
  gallery: {
    eyebrow: "Capturas de pantalla",
    title: "La app, tal como es",
    which: "Qué capturas",
    desktop: "Escritorio",
    android: "Android",
    open: "Abrir: {caption}",
    dialog: "Captura {n} de {total}: {caption}",
    previous: "Captura anterior",
    next: "Captura siguiente",
    close: "Cerrar",
  },
  join: {
    title: "Pruébalo y cuéntanos qué tal te fue",
    body: "Karasu lo hace un solo mantenedor junto con quien quiera sumarse. Un informe de error, una idea o un aviso de que algo funciona en tu equipo ayuda, sobre todo en Linux y Android.",
    discord: "Unirse al Discord",
    bug: "Informar de un error",
    source: "Código fuente en GitHub",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Preguntas, respondidas desde el código.",
    items: {
      what: {
        q: "¿Qué es Karasu?",
        a: "Una app de escritorio y Android que mantiene tu lista de anime y manga de AniList. Se da cuenta de lo que estás viendo o leyendo y actualiza tu progreso en AniList por sí sola — preguntando primero una vez si se trata de un capítulo de un sitio que no nombra — y le da a esa lista una interfaz local rápida, con estadísticas, notificaciones y las páginas sociales.",
      },
      free: {
        q: "¿Es gratis?",
        a: "Sí. Karasu es gratuito y se publica bajo la GNU AGPL-3.0, o cualquier versión posterior. No hay plan de pago ni nada que desbloquear.",
      },
      open: {
        q: "¿Es de código abierto?",
        a: "Sí. El código fuente completo está en GitHub, y cada versión se compila allí a partir de un commit etiquetado.",
      },
      anilist: {
        q: "¿Qué es AniList?",
        a: "Una base de datos y sitio de seguimiento de anime y manga gratuito en anilist.co. Tu lista vive allí; Karasu la lee y escribe en ella a través de la API pública de AniList.",
      },
      replace: {
        q: "¿Karasu reemplaza a AniList?",
        a: "No. Es un cliente para AniList. Tu lista sigue en AniList y cada cambio que hace Karasu se ve en la web un momento después. También puedes usar Karasu sin ninguna cuenta, solo con una lista local.",
      },
      platforms: {
        q: "¿Qué plataformas son compatibles?",
        a: "Windows y Android son Stable, Linux es un AppImage experimental y no hay versión para macOS. Windows tiene todas las funciones. Android tiene la lista, las estadísticas, las notificaciones, los widgets, las páginas sociales y su propio actualizador, pero no biblioteca local ni bandeja del sistema. La detección varía: Windows lee sesiones multimedia, ventanas de reproductores y navegadores, mpv y Jellyfin; Linux lee sesiones multimedia, mpv y Jellyfin, sin títulos de ventana; Android lee Jellyfin.",
      },
      credentials: {
        q: "¿Karasu guarda mis credenciales de AniList?",
        a: "Nunca ve tu contraseña. El inicio de sesión se hace en anilist.co, en tu navegador, que le entrega un token a Karasu. Ese token se guarda en el almacén de credenciales de tu sistema operativo en el escritorio, en un archivo cifrado junto a la app en modo portátil, y en un archivo sellado con el Keystore en Android — y nunca se devuelve a la vista web de la app.",
      },
      offline: {
        q: "¿Karasu funciona sin conexión?",
        a: "Tu lista se guarda en caché local, así que se abre sin red, un título de ella muestra su página en caché con un +1 que funciona, y los cambios se ponen en cola y se envían cuando vuelve la conexión. Explorar títulos que no están en tu lista, la búsqueda y las páginas sociales necesitan red.",
      },
      automatic: {
        q: "¿Actualiza mi progreso en AniList automáticamente?",
        a: "Sí, por defecto cuando un episodio se ha reproducido durante dos tercios de su duración — o durante los minutos que fijes, o tras confirmar un aviso, si prefieres que te pregunte. Un capítulo de un sitio que Karasu no nombra siempre pregunta antes. El progreso solo avanza, y Karasu vuelve a leer tu lista justo antes de escribir.",
      },
      affiliated: {
        q: "¿Está Karasu afiliado a AniList?",
        a: "No. Es un proyecto independiente que usa la API pública de AniList, con un client id registrado y sin acceso especial.",
      },
      smartscreen: {
        q: "¿Por qué Windows muestra una advertencia al instalarlo?",
        a: "El instalador no está firmado, así que SmartScreen nunca lo había visto y lo avisa. Cada versión incluye un SHA256SUMS.txt con el que puedes comprobar la descarga.",
      },
      network: {
        q: "¿Con qué se comunica Karasu?",
        a: "Con la API y los servidores de imágenes de AniList; con GitHub, para buscar actualizaciones y descargarlas; con los datos de relaciones entre episodios de la comunidad en GitHub, como máximo una vez por semana; con tu propio servidor Jellyfin si configuras uno; con el socket local de Discord para Rich Presence si lo activas. Las imágenes de las biografías de usuarios de AniList se obtienen a través del proxy acotado de Karasu, así que esos servidores conocen tu dirección IP cuando abres un perfil. Nada más, y ningún análisis de uso.",
      },
    },
  },
  footer: {
    tagline: "Un seguidor moderno de anime y manga — creado exclusivamente para AniList.",
    badge: "Código abierto · gratis",
    project: "Proyecto",
    github: "GitHub",
    download: "Descargar",
    changelog: "Registro de cambios",
    nightly: "Compilaciones Nightly",
    help: "Ayuda",
    docs: "Documentación",
    issue: "Informar de un problema",
    feature: "Proponer una función",
    discord: "Discord",
    elsewhere: "En otros sitios",
    anilist: "AniList",
    security: "Política de seguridad",
    contributing: "Contribuir",
    license: "Licencia AGPL-3.0",
    copyright: "Licenciado bajo AGPL-3.0 · © 2026 Kyu y los colaboradores de Karasu",
    disclaimer:
      "Karasu es un proyecto independiente y no está afiliado a AniList ni cuenta con su respaldo. SN Pro se usa bajo la SIL Open Font License 1.1.",
    language: "Idioma",
    aiNote: "Todos los idiomas distintos del inglés y el alemán son traducciones de IA que ninguna persona ha revisado.",
  },
  notFound: {
    title: "Aquí no hay nadie posado.",
    body: "La página que buscabas no existe. Todo el sitio es una sola página, y esta no es.",
    back: "Volver a Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "La lista de anime como cuadrícula de portadas, con los estados y las listas personalizadas en una columna al lado, y la búsqueda, el orden, los filtros y los ajustes preestablecidos encima.",
      caption: "Lista de anime, vista de cuadrícula",
    },
    overview: {
      alt: "El Resumen: un saludo con búsqueda y las próximas 48 horas sobre el banner de una temporada, las listas como estantes, los títulos en emisión para ponerse al día y una columna con las estadísticas y tu propia actividad.",
      caption: "Resumen — tus listas, la semana, lo que toca ponerse al día",
    },
    "now-playing": {
      alt: "La ventana «Reproduciendo ahora» flotando sobre la lista de anime: la tercera temporada de Mushoku Tensei detectada en mpv, temporada 3 episodio 9, con el progreso que anotará.",
      caption: "Reproduciendo ahora — un episodio detectado en mpv",
    },
    seasonal: {
      alt: "La página de Temporadas: los títulos del otoño de 2026 como tarjetas con sus géneros y una cuenta atrás, el año, la temporada y los formatos en una columna al lado.",
      caption: "Temporadas",
    },
    calendar: {
      alt: "La agenda del Calendario: los episodios que se emiten esta semana desde hoy, cada uno en una tarjeta con su portada, hora y número de episodio.",
      caption: "Calendario",
    },
    "stats-overview": {
      alt: "El resumen de la página de Estadísticas: los totales de la lista, un anillo de estados y formatos, los países de origen, en qué se fue el tiempo de visionado y la duración de las series.",
      caption: "Estadísticas — resumen",
    },
    franchise: {
      alt: "El grafo de franquicia de Mushoku Tensei: la tercera temporada enlazada con las anteriores, la novela ligera y un manga derivado, con la tarjeta del título seleccionado al lado.",
      caption: "Grafo de franquicia",
    },
    "phone-overview": {
      alt: "El Resumen en el móvil: un saludo con búsqueda sobre el banner de una temporada y las listas como estantes, encima de la barra inferior.",
      caption: "Android — resumen",
    },
    "phone-list": {
      alt: "La lista de anime en el móvil como cuadrícula de portadas de tres columnas, con el selector de estado y la búsqueda de la lista encima.",
      caption: "Android — lista de anime",
    },
    "phone-detail": {
      alt: "La página de detalle de Mushoku Tensei en el móvil con la hoja de estado abierta: el estado, el progreso y la puntuación sobre la distribución de puntuaciones de la comunidad.",
      caption: "Android — un título, con su entrada abierta",
    },
    "phone-search": {
      alt: "La página de búsqueda en el móvil con los resultados de «season 2» como cuadrícula de portadas.",
      caption: "Android — búsqueda",
    },
  },
} satisfies Messages;
