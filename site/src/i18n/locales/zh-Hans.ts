import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — 面向 AniList 的现代动漫追番工具",
    description:
      "Karasu 是专为 AniList 打造的免费开源动画与漫画追踪工具。它能察觉你正在播放的内容，在 Windows 上还能察觉你正在阅读的内容，并让你的 AniList 进度保持同步。支持 Windows、Linux 和 Android。",
    notFoundTitle: "页面未找到 — Karasu",
  },
  skip: "跳到正文",
  nav: {
    label: "主导航",
    home: "Karasu — 回到顶部",
    changes: "更新内容",
    screenshots: "截图",
    join: "参与进来",
    faq: "常见问题",
    github: "GitHub",
    download: "下载",
    downloadKarasu: "下载 Karasu",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
  },
  hero: {
    eyebrow: "免费 · 开源 · 专为 AniList",
    title: "替你记录集数的 AniList 客户端",
    lede: "你的列表、当季新番、放送日历、统计、动态和论坛，都在一个流畅的窗口里；还有自动检测功能，一集看完就帮你更新列表。",
    windows: "下载 Windows 版",
    linux: "Linux",
    android: "Android",
    note: "版本 {version}。Windows 安装程序未进行代码签名，首次运行时 SmartScreen 可能会发出警告 · Linux 版是实验性的 AppImage · Android 版是需要自行侧载的 APK · 不支持 macOS",
    checksums: "校验和",
    everyDownload: "所有下载",
  },
  changes: {
    title: "更新内容",
    nightly: "Nightly 版中",
    version: "版本 {version}",
    since: "自 {version} 起，尚未进入 Stable 版本",
    added: "新增",
    changed: "变更",
    fixed: "修复",
    whole: "完整更新日志",
  },
  gallery: {
    eyebrow: "截图",
    title: "应用的真实样子",
    which: "选择截图",
    desktop: "桌面端",
    android: "Android",
    open: "打开：{caption}",
    dialog: "第 {n} 张截图，共 {total} 张：{caption}",
    previous: "上一张截图",
    next: "下一张截图",
    close: "关闭",
  },
  join: {
    title: "先试试，再告诉我们感受如何",
    body: "Karasu 由一位维护者和所有愿意加入的人共同打造。一份错误报告、一个想法，或者一句“在我的电脑上能用”，都很有帮助，尤其是在 Linux 和 Android 上。",
    discord: "加入 Discord",
    bug: "报告错误",
    source: "GitHub 上的源代码",
  },
  faq: {
    eyebrow: "常见问题",
    title: "问题，依据代码回答。",
    items: {
      what: {
        q: "Karasu 是什么？",
        a: "一款管理你 AniList 动画和漫画列表的桌面与 Android 应用。它会察觉你正在播放或阅读的内容，并自动更新你在 AniList 上的进度；遇到来自它不认识名称的网站的章节时，会先询问一次。它还为这份列表提供了快速的本地界面，带有统计、通知和社交页面。",
      },
      free: {
        q: "免费吗？",
        a: "是的。Karasu 完全免费，并以 GNU AGPL-3.0 或任何更高版本发布。没有付费档位，也没有需要解锁的功能。",
      },
      open: {
        q: "它是开源的吗？",
        a: "是的。完整源代码都在 GitHub 上，每个版本都是在那里根据带标签的提交构建的。",
      },
      anilist: {
        q: "AniList 是什么？",
        a: "位于 anilist.co 的免费动画与漫画数据库及追踪网站。你的列表存放在那里，Karasu 通过 AniList 的公开 API 读取和写入它。",
      },
      replace: {
        q: "Karasu 会取代 AniList 吗？",
        a: "不会。它只是 AniList 的客户端。你的列表仍在 AniList 上，Karasu 所做的每项更改稍后都会在网站上显示。你也可以不登录任何账号，只使用本地列表。",
      },
      platforms: {
        q: "支持哪些平台？",
        a: "Windows 和 Android 是 Stable 版，Linux 是实验性的 AppImage，没有 macOS 版本。Windows 拥有全部功能。Android 有列表、统计、通知、小组件、社交页面和自带的更新器，但没有本地媒体库和托盘。检测方式也不同：Windows 读取媒体会话、播放器和浏览器窗口、mpv 以及 Jellyfin；Linux 读取媒体会话、mpv 和 Jellyfin，但不读取窗口标题；Android 读取 Jellyfin。",
      },
      credentials: {
        q: "Karasu 会保存我的 AniList 凭据吗？",
        a: "它永远看不到你的密码。登录在浏览器中的 anilist.co 上完成，由它把令牌交给 Karasu。该令牌在桌面端保存在操作系统的凭据存储中，在便携模式下保存在应用旁的加密文件里，在 Android 上保存在由 Keystore 封存的文件中，并且绝不会交还给应用的 Web 视图。",
      },
      offline: {
        q: "Karasu 能离线使用吗？",
        a: "你的列表会缓存在本地，所以无需网络也能打开；列表中的作品会显示其缓存页面，+1 也能正常使用，编辑会排入队列，连接恢复后再发送。浏览不在你列表中的作品、搜索和社交页面则需要网络。",
      },
      automatic: {
        q: "它会自动更新我在 AniList 上的进度吗？",
        a: "会。默认在一集播放到三分之二时更新，也可以按你设定的分钟数更新，如果你更希望被询问，也可以在确认提示后再更新。来自 Karasu 不认识名称的网站的章节，一律先询问。进度只会向前推进，而且 Karasu 会在写入前重新读取一次你的列表。",
      },
      affiliated: {
        q: "Karasu 和 AniList 有关联吗？",
        a: "没有。它是一个使用 AniList 公开 API 的独立项目，使用已注册的客户端 ID，没有任何特殊权限。",
      },
      smartscreen: {
        q: "为什么安装时 Windows 会发出警告？",
        a: "安装程序没有代码签名，SmartScreen 以前从未见过它，所以会提示。每个版本都附带一个 SHA256SUMS.txt，你可以用它校验下载的文件。",
      },
      network: {
        q: "Karasu 会和哪些服务通信？",
        a: "AniList 的 API 和图片服务器；GitHub，用于检查更新和下载；GitHub 上社区维护的剧集关联数据，每周最多一次；你自己的 Jellyfin 服务器（如果你设置了）；以及 Discord 的本地套接字，用于 Rich Presence（如果你启用了）。AniList 用户简介中的图片会通过 Karasu 自己的受限代理获取，因此打开某个资料页时，这些主机会知道你的 IP 地址。除此之外没有别的，也没有任何数据分析。",
      },
    },
  },
  footer: {
    tagline: "现代动漫追番工具 — 专为 AniList 打造。",
    badge: "开源 · 免费",
    project: "项目",
    github: "GitHub",
    download: "下载",
    changelog: "更新日志",
    nightly: "Nightly 构建",
    help: "帮助",
    docs: "文档",
    issue: "报告问题",
    feature: "提出功能请求",
    discord: "Discord",
    elsewhere: "其他",
    anilist: "AniList",
    security: "安全政策",
    contributing: "参与贡献",
    license: "AGPL-3.0 许可证",
    copyright: "以 AGPL-3.0 许可 · © 2026 Kyu and Karasu contributors",
    disclaimer:
      "Karasu 是独立项目，与 AniList 没有关联，也未获得 AniList 的认可。SN Pro 依据 SIL Open Font License 1.1 使用。",
    language: "语言",
    aiNote: "除英语和德语外，所有语言均为 AI 翻译，尚未经过人工审校。",
  },
  notFound: {
    title: "这里没有鸟停留。",
    body: "你要找的页面不存在。整个网站只有一页，而这里不是那一页。",
    back: "返回 Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "以封面网格显示的动画列表，旁边是状态和自定义列表的一栏，上方是搜索、排序、筛选和预设。",
      caption: "动画列表，网格视图",
    },
    overview: {
      alt: "概览页：在某一季的横幅之上，是带搜索框的问候语和未来 48 小时的安排；列表以书架形式排列，还有需要追的正在播出的作品，以及一栏统计和你自己的动态。",
      caption: "概览 — 你的列表、本周安排、需要追的内容",
    },
    "now-playing": {
      alt: "“正在播放”窗口浮在动画列表之上：在 mpv 中检测到 Mushoku Tensei 第三季，第 3 季第 9 集，并显示即将写入的进度。",
      caption: "正在播放 — 在 mpv 中检测到一集",
    },
    seasonal: {
      alt: "当季新番页面：2026 年秋季的作品以卡片显示，带有类型和倒计时，旁边一栏是年份、季度和格式。",
      caption: "当季新番",
    },
    calendar: {
      alt: "日历的日程视图：从今天起本周播出的剧集，每集一张卡片，带有封面、时间和集数。",
      caption: "日历",
    },
    "stats-overview": {
      alt: "统计页面的概览：列表的总数、状态与格式的环形图、制作国家、观看时间的去向以及系列长度。",
      caption: "统计 — 概览",
    },
    franchise: {
      alt: "Mushoku Tensei 的系列关系图：第三季与之前几季、轻小说和一部衍生漫画相连，侧边是所选作品的卡片。",
      caption: "系列关系图",
    },
    "phone-overview": {
      alt: "手机上的概览页：在某一季的横幅之上是带搜索框的问候语，列表以书架形式排列，下方是底部栏。",
      caption: "Android — 概览",
    },
    "phone-list": {
      alt: "手机上的动画列表，为三列封面网格，上方是状态选择器和列表搜索。",
      caption: "Android — 动画列表",
    },
    "phone-detail": {
      alt: "手机上 Mushoku Tensei 的详情页，状态面板已展开：状态、进度和评分之上，是社区自己的评分分布。",
      caption: "Android — 一部作品，条目已展开",
    },
    "phone-search": {
      alt: "手机上的搜索页，以封面网格显示“season 2”的搜索结果。",
      caption: "Android — 搜索",
    },
  },
} satisfies Messages;
