import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Um gestor moderno de anime e manga para o AniList",
    description:
      "O Karasu é um gestor gratuito e de código aberto de anime e manga, criado exclusivamente para o AniList. Repara no que reproduzes — e, no Windows, no que lês — e mantém o teu progresso no AniList atualizado. Windows, Linux e Android.",
    notFoundTitle: "Página não encontrada — Karasu",
  },
  skip: "Saltar para o conteúdo",
  nav: {
    label: "Principal",
    home: "Karasu — voltar ao topo",
    changes: "Novidades",
    screenshots: "Capturas de ecrã",
    join: "Participa",
    faq: "FAQ",
    github: "GitHub",
    download: "Transferir",
    downloadKarasu: "Transferir o Karasu",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
  },
  hero: {
    eyebrow: "Gratuito · código aberto · para o AniList",
    title: "O cliente do AniList que regista os teus episódios por ti",
    lede: "As tuas listas, a temporada, o calendário de emissão, as estatísticas, o feed e o fórum numa só janela rápida, e uma deteção que atualiza a tua lista quando um episódio termina.",
    windows: "Transferir para Windows",
    linux: "Linux",
    android: "Android",
    note: "Versão {version}. O instalador do Windows não está assinado, por isso o SmartScreen pode mostrar um aviso na primeira execução · o Linux é um AppImage experimental · o Android é um APK de instalação manual · sem macOS",
    checksums: "somas de verificação",
    everyDownload: "todas as transferências",
  },
  changes: {
    title: "Novidades",
    nightly: "Na Nightly",
    version: "Versão {version}",
    since: "Desde a {version}, ainda não numa versão Stable",
    added: "Adicionado",
    changed: "Alterado",
    fixed: "Corrigido",
    whole: "Todo o registo de alterações",
  },
  gallery: {
    eyebrow: "Capturas de ecrã",
    title: "A app, tal como é",
    which: "Que capturas",
    desktop: "Computador",
    android: "Android",
    open: "Abrir: {caption}",
    dialog: "Captura {n} de {total}: {caption}",
    previous: "Captura anterior",
    next: "Captura seguinte",
    close: "Fechar",
  },
  join: {
    title: "Experimenta e conta-nos como correu",
    body: "O Karasu é feito por um único responsável, juntamente com quem queira participar. Um relatório de erro, uma ideia ou um aviso de que algo funciona no teu computador ajuda, sobretudo em Linux e Android.",
    discord: "Entrar no Discord",
    bug: "Reportar um erro",
    source: "Código-fonte no GitHub",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Perguntas, respondidas a partir do código.",
    items: {
      what: {
        q: "O que é o Karasu?",
        a: "Uma app para computador e Android que mantém a tua lista de anime e manga do AniList. Repara no que estás a ver ou a ler e atualiza o teu progresso no AniList sozinha — perguntando primeiro uma vez no caso de um capítulo de um site que não nomeia — e dá a essa lista uma interface local rápida, com estatísticas, notificações e as páginas sociais.",
      },
      free: {
        q: "É gratuito?",
        a: "Sim. O Karasu é gratuito e é publicado sob a GNU AGPL-3.0, ou qualquer versão posterior. Não há plano pago nem nada para desbloquear.",
      },
      open: {
        q: "É de código aberto?",
        a: "Sim. O código-fonte completo está no GitHub, e cada versão é compilada lá a partir de um commit com etiqueta.",
      },
      anilist: {
        q: "O que é o AniList?",
        a: "Uma base de dados e site de acompanhamento de anime e manga gratuito em anilist.co. A tua lista vive lá; o Karasu lê-a e escreve nela através da API pública do AniList.",
      },
      replace: {
        q: "O Karasu substitui o AniList?",
        a: "Não. É um cliente para o AniList. A tua lista continua no AniList e cada alteração feita pelo Karasu fica visível no site pouco depois. Também podes usar o Karasu sem qualquer conta, apenas com uma lista local.",
      },
      platforms: {
        q: "Que plataformas são suportadas?",
        a: "O Windows e o Android são Stable, o Linux é um AppImage experimental e não há versão para macOS. O Windows tem todas as funcionalidades. O Android tem a lista, as estatísticas, as notificações, os widgets, as páginas sociais e o seu próprio atualizador, mas não tem biblioteca local nem área de notificação. A deteção varia: o Windows lê sessões multimédia, janelas de leitores e navegadores, mpv e Jellyfin; o Linux lê sessões multimédia, mpv e Jellyfin, sem títulos de janelas; o Android lê o Jellyfin.",
      },
      credentials: {
        q: "O Karasu guarda as minhas credenciais do AniList?",
        a: "Nunca vê a tua palavra-passe. O início de sessão faz-se em anilist.co, no teu navegador, que entrega um token ao Karasu. Esse token é guardado no armazenamento de credenciais do teu sistema operativo no computador, num ficheiro cifrado junto à app no modo portátil, e num ficheiro selado pelo Keystore no Android — e nunca é devolvido à vista web da app.",
      },
      offline: {
        q: "O Karasu funciona offline?",
        a: "A tua lista fica em cache local, por isso abre sem rede, um título dela mostra a sua página em cache com um +1 funcional, e as alterações ficam em fila e são enviadas quando a ligação regressa. Explorar títulos que não estão na tua lista, a pesquisa e as páginas sociais precisam de rede.",
      },
      automatic: {
        q: "Atualiza o meu progresso no AniList automaticamente?",
        a: "Sim, por predefinição quando um episódio foi reproduzido durante dois terços da sua duração — ou durante os minutos que definires, ou depois de confirmares um aviso, se preferires que te perguntem. Um capítulo de um site que o Karasu não nomeia pergunta sempre primeiro. O progresso só avança, e o Karasu volta a ler a tua lista mesmo antes de escrever.",
      },
      affiliated: {
        q: "O Karasu é afiliado ao AniList?",
        a: "Não. É um projeto independente que usa a API pública do AniList, com um client id registado e sem acesso especial.",
      },
      smartscreen: {
        q: "Porque é que o Windows avisa quando o instalo?",
        a: "O instalador não está assinado, por isso o SmartScreen nunca o tinha visto e avisa disso. Cada versão inclui um SHA256SUMS.txt com o qual podes verificar a transferência.",
      },
      network: {
        q: "Com o que comunica o Karasu?",
        a: "Com a API e os servidores de imagens do AniList; com o GitHub, para a verificação de atualizações e a transferência; com os dados de relações entre episódios da comunidade no GitHub, no máximo uma vez por semana; com o teu próprio servidor Jellyfin, se configurares um; com o socket local do Discord para o Rich Presence, se o ativares. As imagens nas biografias de utilizadores do AniList são obtidas através do proxy limitado do Karasu, por isso esses servidores ficam a conhecer o teu endereço IP quando abres um perfil. Mais nada, e sem análise de utilização.",
      },
    },
  },
  footer: {
    tagline: "Um gestor moderno de anime e manga — criado exclusivamente para o AniList.",
    badge: "Código aberto · gratuito",
    project: "Projeto",
    github: "GitHub",
    download: "Transferir",
    changelog: "Registo de alterações",
    nightly: "Compilações Nightly",
    help: "Ajuda",
    docs: "Documentação",
    issue: "Reportar um problema",
    feature: "Sugerir uma funcionalidade",
    discord: "Discord",
    elsewhere: "Noutros sítios",
    anilist: "AniList",
    security: "Política de segurança",
    contributing: "Contribuir",
    license: "Licença AGPL-3.0",
    copyright: "Licenciado sob a AGPL-3.0 · © 2026 Kyu e os colaboradores do Karasu",
    disclaimer:
      "O Karasu é um projeto independente e não é afiliado nem endossado pelo AniList. A SN Pro é usada ao abrigo da SIL Open Font License 1.1.",
    language: "Idioma",
    aiNote: "Todos os idiomas além do inglês e do alemão são traduções de IA que nenhuma pessoa reviu.",
  },
  notFound: {
    title: "Aqui não pousou ninguém.",
    body: "A página que procuravas não existe. O site inteiro é uma só página, e esta não é.",
    back: "Voltar ao Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "A lista de anime como grelha de capas, com os estados e as listas personalizadas numa coluna ao lado, e a pesquisa, a ordenação, os filtros e as predefinições por cima.",
      caption: "Lista de anime, vista em grelha",
    },
    overview: {
      alt: "A Visão geral: uma saudação com pesquisa e as próximas 48 horas sobre o banner de uma temporada, as listas como prateleiras, os títulos em emissão para pôr em dia e uma coluna com as estatísticas e a tua própria atividade.",
      caption: "Visão geral — as tuas listas, a semana, o que pôr em dia",
    },
    "now-playing": {
      alt: "A janela «A reproduzir» a flutuar sobre a lista de anime: a terceira temporada de Mushoku Tensei detetada no mpv, temporada 3 episódio 9, com o progresso que vai registar.",
      caption: "A reproduzir — um episódio detetado no mpv",
    },
    seasonal: {
      alt: "A página de Temporadas: os títulos do outono de 2026 como cartões com os seus géneros e uma contagem decrescente, o ano, a temporada e os formatos numa coluna ao lado.",
      caption: "Temporadas",
    },
    calendar: {
      alt: "A agenda do Calendário: os episódios emitidos esta semana a partir de hoje, cada um num cartão com a capa, a hora e o número do episódio.",
      caption: "Calendário",
    },
    "stats-overview": {
      alt: "A visão geral da página de Estatísticas: os totais da lista, um anel de estados e formatos, os países de origem, para onde foi o tempo de visualização e a duração das séries.",
      caption: "Estatísticas — visão geral",
    },
    franchise: {
      alt: "O grafo de franquia de Mushoku Tensei: a terceira temporada ligada às anteriores, à light novel e a um manga derivado, com o cartão do título selecionado ao lado.",
      caption: "Grafo de franquia",
    },
    "phone-overview": {
      alt: "A Visão geral no telemóvel: uma saudação com pesquisa sobre o banner de uma temporada e as listas como prateleiras, acima da barra inferior.",
      caption: "Android — visão geral",
    },
    "phone-list": {
      alt: "A lista de anime no telemóvel como grelha de capas de três colunas, com o seletor de estado e a pesquisa da lista por cima.",
      caption: "Android — lista de anime",
    },
    "phone-detail": {
      alt: "A página de detalhe de Mushoku Tensei no telemóvel com a folha de estado aberta: o estado, o progresso e a pontuação sobre a distribuição de pontuações da comunidade.",
      caption: "Android — um título, com a sua entrada aberta",
    },
    "phone-search": {
      alt: "A página de pesquisa no telemóvel com os resultados de «season 2» como grelha de capas.",
      caption: "Android — pesquisa",
    },
  },
} satisfies Messages;
