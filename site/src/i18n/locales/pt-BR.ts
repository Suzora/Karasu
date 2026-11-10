import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Um rastreador moderno de anime e mangá para o AniList",
    description:
      "O Karasu é um rastreador gratuito e de código aberto de anime e mangá, feito exclusivamente para o AniList. Ele percebe o que você assiste — e, no Windows, o que você lê — e mantém seu progresso no AniList em dia. Windows, Linux e Android.",
    notFoundTitle: "Página não encontrada — Karasu",
  },
  skip: "Ir para o conteúdo",
  nav: {
    label: "Principal",
    home: "Karasu — voltar ao topo",
    changes: "Novidades",
    screenshots: "Capturas de tela",
    join: "Participe",
    faq: "FAQ",
    github: "GitHub",
    download: "Baixar",
    downloadKarasu: "Baixar o Karasu",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
  },
  hero: {
    eyebrow: "Grátis · código aberto · para o AniList",
    title: "O cliente do AniList que registra seus episódios por você",
    lede: "Suas listas, a temporada, o calendário de exibição, as estatísticas, o feed e o fórum em uma única janela rápida, e uma detecção que atualiza sua lista quando um episódio termina.",
    windows: "Baixar para Windows",
    linux: "Linux",
    android: "Android",
    note: "Versão {version}. O instalador do Windows não é assinado, então o SmartScreen pode exibir um aviso na primeira execução · o Linux é um AppImage experimental · o Android é um APK de instalação manual · sem macOS",
    checksums: "checksums",
    everyDownload: "todos os downloads",
  },
  changes: {
    title: "Novidades",
    nightly: "Na Nightly",
    version: "Versão {version}",
    since: "Desde a {version}, ainda não em uma versão Stable",
    added: "Adicionado",
    changed: "Alterado",
    fixed: "Corrigido",
    whole: "Todo o changelog",
  },
  gallery: {
    eyebrow: "Capturas de tela",
    title: "O app, como ele é",
    which: "Quais capturas",
    desktop: "Desktop",
    android: "Android",
    open: "Abrir: {caption}",
    dialog: "Captura {n} de {total}: {caption}",
    previous: "Captura anterior",
    next: "Próxima captura",
    close: "Fechar",
  },
  join: {
    title: "Experimente e conte como foi",
    body: "O Karasu é feito por um único mantenedor, junto com quem quiser participar. Um relatório de bug, uma ideia ou um aviso de que algo funciona no seu computador ajuda, principalmente no Linux e no Android.",
    discord: "Entrar no Discord",
    bug: "Reportar um bug",
    source: "Código-fonte no GitHub",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Perguntas, respondidas a partir do código.",
    items: {
      what: {
        q: "O que é o Karasu?",
        a: "Um app para desktop e Android que cuida da sua lista de anime e mangá do AniList. Ele percebe o que você está assistindo ou lendo e atualiza seu progresso no AniList sozinho — perguntando antes, uma vez, no caso de um capítulo de um site que ele não nomeia — e dá a essa lista uma interface local rápida, com estatísticas, notificações e as páginas sociais.",
      },
      free: {
        q: "É grátis?",
        a: "Sim. O Karasu é gratuito e é publicado sob a GNU AGPL-3.0, ou qualquer versão posterior. Não existe plano pago nem nada para desbloquear.",
      },
      open: {
        q: "É de código aberto?",
        a: "Sim. O código-fonte completo está no GitHub, e cada versão é compilada lá a partir de um commit com tag.",
      },
      anilist: {
        q: "O que é o AniList?",
        a: "Um banco de dados e site de acompanhamento de anime e mangá gratuito em anilist.co. Sua lista vive lá; o Karasu a lê e escreve nela pela API pública do AniList.",
      },
      replace: {
        q: "O Karasu substitui o AniList?",
        a: "Não. Ele é um cliente para o AniList. Sua lista continua no AniList e cada alteração feita pelo Karasu aparece no site um instante depois. Você também pode usar o Karasu sem nenhuma conta, só com uma lista local.",
      },
      platforms: {
        q: "Quais plataformas são compatíveis?",
        a: "Windows e Android são Stable, o Linux é um AppImage experimental e não há versão para macOS. O Windows tem todos os recursos. O Android tem a lista, as estatísticas, as notificações, os widgets, as páginas sociais e seu próprio atualizador, mas não tem biblioteca local nem bandeja do sistema. A detecção varia: o Windows lê sessões de mídia, janelas de players e navegadores, mpv e Jellyfin; o Linux lê sessões de mídia, mpv e Jellyfin, sem títulos de janelas; o Android lê o Jellyfin.",
      },
      credentials: {
        q: "O Karasu guarda minhas credenciais do AniList?",
        a: "Ele nunca vê sua senha. O login acontece em anilist.co, no seu navegador, que entrega um token ao Karasu. Esse token fica no repositório de credenciais do seu sistema operacional no desktop, em um arquivo criptografado ao lado do app no modo portátil, e em um arquivo selado pelo Keystore no Android — e nunca é devolvido à visualização web do app.",
      },
      offline: {
        q: "O Karasu funciona offline?",
        a: "Sua lista fica em cache local, então ela abre sem rede, um título dela mostra a página em cache com um +1 funcionando, e as alterações entram numa fila e são enviadas quando a conexão volta. Navegar por títulos que não estão na sua lista, a busca e as páginas sociais precisam de rede.",
      },
      automatic: {
        q: "Ele atualiza meu progresso no AniList automaticamente?",
        a: "Sim, por padrão quando um episódio foi reproduzido por dois terços da duração — ou pelos minutos que você definir, ou depois de você confirmar um aviso, se preferir que perguntem. Um capítulo de um site que o Karasu não nomeia sempre pergunta antes. O progresso só avança, e o Karasu lê sua lista de novo logo antes de escrever.",
      },
      affiliated: {
        q: "O Karasu é afiliado ao AniList?",
        a: "Não. É um projeto independente que usa a API pública do AniList, com um client id registrado e sem acesso especial.",
      },
      smartscreen: {
        q: "Por que o Windows avisa quando eu instalo?",
        a: "O instalador não é assinado, então o SmartScreen nunca o viu antes e avisa isso. Cada versão inclui um SHA256SUMS.txt com o qual você pode conferir o download.",
      },
      network: {
        q: "Com o que o Karasu se comunica?",
        a: "Com a API e os servidores de imagens do AniList; com o GitHub, para a verificação de atualizações e o download; com os dados de relações entre episódios da comunidade no GitHub, no máximo uma vez por semana; com o seu próprio servidor Jellyfin, se você configurar um; com o socket local do Discord para o Rich Presence, se você ativar. As imagens nas bios de usuários do AniList são buscadas pelo proxy limitado do Karasu, então esses hosts ficam sabendo seu endereço IP quando você abre um perfil. Nada além disso, e nenhuma análise de uso.",
      },
    },
  },
  footer: {
    tagline: "Um rastreador moderno de anime e mangá — feito exclusivamente para o AniList.",
    badge: "Código aberto · grátis",
    project: "Projeto",
    github: "GitHub",
    download: "Baixar",
    changelog: "Changelog",
    nightly: "Builds Nightly",
    help: "Ajuda",
    docs: "Documentação",
    issue: "Reportar um problema",
    feature: "Sugerir um recurso",
    discord: "Discord",
    elsewhere: "Em outros lugares",
    anilist: "AniList",
    security: "Política de segurança",
    contributing: "Contribuir",
    license: "Licença AGPL-3.0",
    copyright: "Licenciado sob a AGPL-3.0 · © 2026 Kyusetzu e os colaboradores do Karasu",
    disclaimer:
      "O Karasu é um projeto independente e não é afiliado nem endossado pelo AniList. A SN Pro é usada sob a SIL Open Font License 1.1.",
    language: "Idioma",
    aiNote: "Todos os idiomas além do inglês e do alemão são traduções de IA que nenhuma pessoa revisou.",
  },
  notFound: {
    title: "Aqui não pousou ninguém.",
    body: "A página que você procurava não existe. O site inteiro é uma página só, e esta não é ela.",
    back: "Voltar ao Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "A lista de anime como grade de capas, com os status e as listas personalizadas em uma coluna ao lado, e a busca, a ordenação, os filtros e as predefinições acima.",
      caption: "Lista de anime, visualização em grade",
    },
    overview: {
      alt: "A Visão geral: uma saudação com busca e as próximas 48 horas sobre o banner de uma temporada, as listas como prateleiras, os títulos em exibição para pôr em dia e uma coluna com as estatísticas e a sua própria atividade.",
      caption: "Visão geral — suas listas, a semana, o que pôr em dia",
    },
    "now-playing": {
      alt: "A janela «Reproduzindo agora» flutuando sobre a lista de anime: a terceira temporada de Mushoku Tensei detectada no mpv, temporada 3 episódio 9, com o progresso que será registrado.",
      caption: "Reproduzindo agora — um episódio detectado no mpv",
    },
    seasonal: {
      alt: "A página de Temporadas: os títulos do outono de 2026 como cartões com seus gêneros e uma contagem regressiva, o ano, a temporada e os formatos em uma coluna ao lado.",
      caption: "Temporadas",
    },
    calendar: {
      alt: "A agenda do Calendário: os episódios exibidos esta semana a partir de hoje, cada um em um cartão com a capa, o horário e o número do episódio.",
      caption: "Calendário",
    },
    "stats-overview": {
      alt: "A visão geral da página de Estatísticas: os totais da lista, um anel de status e formatos, os países de origem, para onde foi o tempo assistido e a duração das séries.",
      caption: "Estatísticas — visão geral",
    },
    franchise: {
      alt: "O grafo de franquia de Mushoku Tensei: a terceira temporada ligada às anteriores, à light novel e a um mangá derivado, com o cartão do título selecionado ao lado.",
      caption: "Grafo de franquia",
    },
    "phone-overview": {
      alt: "A Visão geral no celular: uma saudação com busca sobre o banner de uma temporada e as listas como prateleiras, acima da barra inferior.",
      caption: "Android — visão geral",
    },
    "phone-list": {
      alt: "A lista de anime no celular como grade de capas de três colunas, com o seletor de status e a busca da lista acima.",
      caption: "Android — lista de anime",
    },
    "phone-detail": {
      alt: "A página de detalhes de Mushoku Tensei no celular com a folha de status aberta: o status, o progresso e a nota sobre a distribuição de notas da comunidade.",
      caption: "Android — um título, com a sua entrada aberta",
    },
    "phone-search": {
      alt: "A página de busca no celular com os resultados de «season 2» como grade de capas.",
      caption: "Android — busca",
    },
  },
} satisfies Messages;
