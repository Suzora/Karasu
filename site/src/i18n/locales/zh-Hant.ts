import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — 為 AniList 打造的現代動漫追番工具",
    description:
      "Karasu 是專為 AniList 打造的免費開源動畫與漫畫追蹤工具。它能察覺你正在播放的內容，在 Windows 上還能察覺你正在閱讀的內容，並讓你的 AniList 進度保持同步。支援 Windows、Linux 與 Android。",
    notFoundTitle: "找不到頁面 — Karasu",
  },
  skip: "跳到主要內容",
  nav: {
    label: "主要導覽",
    home: "Karasu — 回到頂端",
    changes: "更新內容",
    screenshots: "螢幕截圖",
    join: "一起參與",
    faq: "常見問題",
    github: "GitHub",
    download: "下載",
    downloadKarasu: "下載 Karasu",
    openMenu: "開啟選單",
    closeMenu: "關閉選單",
  },
  hero: {
    eyebrow: "免費 · 開源 · 專為 AniList",
    title: "幫你記錄集數的 AniList 用戶端",
    lede: "你的清單、當季新番、播出日曆、統計、動態與論壇，全都在一個流暢的視窗裡；還有自動偵測功能，一集看完就幫你更新清單。",
    windows: "下載 Windows 版",
    linux: "Linux",
    android: "Android",
    note: "版本 {version}。Windows 安裝程式未經程式碼簽署，首次執行時 SmartScreen 可能會顯示警告 · Linux 版是實驗性的 AppImage · Android 版是需要自行側載的 APK · 不支援 macOS",
    checksums: "檢查碼",
    everyDownload: "所有下載",
  },
  changes: {
    title: "更新內容",
    nightly: "Nightly 版中",
    version: "版本 {version}",
    since: "自 {version} 起，尚未收錄於 Stable 版本",
    added: "新增",
    changed: "變更",
    fixed: "修正",
    whole: "完整更新日誌",
  },
  gallery: {
    eyebrow: "螢幕截圖",
    title: "App 原本的樣子",
    which: "選擇截圖",
    desktop: "桌面版",
    android: "Android",
    open: "開啟：{caption}",
    dialog: "第 {n} 張截圖，共 {total} 張：{caption}",
    previous: "上一張截圖",
    next: "下一張截圖",
    close: "關閉",
  },
  join: {
    title: "先試試看，再告訴我們感覺如何",
    body: "Karasu 由一位維護者和所有願意加入的人共同打造。一份錯誤回報、一個點子，或是一句「在我的電腦上可以用」，都很有幫助，尤其是在 Linux 和 Android 上。",
    discord: "加入 Discord",
    bug: "回報錯誤",
    source: "GitHub 上的原始碼",
  },
  faq: {
    eyebrow: "常見問題",
    title: "問題，依據程式碼回答。",
    items: {
      what: {
        q: "Karasu 是什麼？",
        a: "一款管理你 AniList 動畫與漫畫清單的桌面與 Android App。它會察覺你正在播放或閱讀的內容，並自動更新你在 AniList 上的進度；遇到來自它不認得名稱的網站的章節時，會先詢問一次。它也為這份清單提供快速的本機介面，具備統計、通知與社群頁面。",
      },
      free: {
        q: "免費嗎？",
        a: "是的。Karasu 完全免費，並以 GNU AGPL-3.0 或任何更新的版本發布。沒有付費方案，也沒有需要解鎖的功能。",
      },
      open: {
        q: "它是開源的嗎？",
        a: "是的。完整的原始碼都在 GitHub 上，每個版本都是在那裡依據帶標籤的提交建置的。",
      },
      anilist: {
        q: "AniList 是什麼？",
        a: "位於 anilist.co 的免費動畫與漫畫資料庫暨追蹤網站。你的清單存放在那裡，Karasu 透過 AniList 的公開 API 讀取並寫入它。",
      },
      replace: {
        q: "Karasu 會取代 AniList 嗎？",
        a: "不會。它只是 AniList 的用戶端。你的清單仍在 AniList 上，Karasu 所做的每項變更稍後都會顯示在網站上。你也可以不登入任何帳號，只使用本機清單。",
      },
      platforms: {
        q: "支援哪些平台？",
        a: "Windows 與 Android 是 Stable 版，Linux 是實驗性的 AppImage，沒有 macOS 版本。Windows 擁有全部功能。Android 有清單、統計、通知、小工具、社群頁面和內建的更新程式，但沒有本機媒體庫和系統匣。偵測方式也不同：Windows 讀取媒體工作階段、播放器與瀏覽器視窗、mpv 以及 Jellyfin；Linux 讀取媒體工作階段、mpv 和 Jellyfin，但不讀取視窗標題；Android 讀取 Jellyfin。",
      },
      credentials: {
        q: "Karasu 會儲存我的 AniList 憑證嗎？",
        a: "它永遠看不到你的密碼。登入是在瀏覽器中的 anilist.co 上完成，由它把權杖交給 Karasu。這個權杖在桌面版存放於作業系統的憑證儲存區，在可攜模式下存放於 App 旁的加密檔案，在 Android 上則存放於由 Keystore 封存的檔案，而且絕不會交還給 App 的網頁檢視。",
      },
      offline: {
        q: "Karasu 可以離線使用嗎？",
        a: "你的清單會快取在本機，所以不用網路也能開啟；清單中的作品會顯示其快取頁面，+1 也能正常使用，編輯會排入佇列，連線恢復後再送出。瀏覽不在你清單中的作品、搜尋與社群頁面則需要網路。",
      },
      automatic: {
        q: "它會自動更新我在 AniList 上的進度嗎？",
        a: "會。預設在一集播放到三分之二時更新，也可以依你設定的分鐘數更新，如果你比較希望被詢問，也可以在確認提示後再更新。來自 Karasu 不認得名稱的網站的章節，一律先詢問。進度只會往前推進，而且 Karasu 會在寫入前重新讀取一次你的清單。",
      },
      affiliated: {
        q: "Karasu 與 AniList 有關係嗎？",
        a: "沒有。它是使用 AniList 公開 API 的獨立專案，使用已註冊的用戶端 ID，沒有任何特殊權限。",
      },
      smartscreen: {
        q: "為什麼安裝時 Windows 會顯示警告？",
        a: "安裝程式沒有程式碼簽署，SmartScreen 以前從未見過它，所以會提醒。每個版本都附有一份 SHA256SUMS.txt，你可以用它來核對下載的檔案。",
      },
      network: {
        q: "Karasu 會與哪些服務連線？",
        a: "AniList 的 API 與圖片伺服器；GitHub，用於檢查更新與下載；GitHub 上由社群維護的劇集關聯資料，每週最多一次；你自己的 Jellyfin 伺服器（如果你設定了）；以及 Discord 的本機 socket，用於 Rich Presence（如果你啟用了）。AniList 使用者簡介中的圖片會透過 Karasu 自己的受限代理伺服器取得，因此開啟某個個人檔案時，這些主機會得知你的 IP 位址。除此之外沒有別的，也沒有任何分析工具。",
      },
    },
  },
  footer: {
    tagline: "現代動漫追番工具 — 專為 AniList 打造。",
    badge: "開源 · 免費",
    project: "專案",
    github: "GitHub",
    download: "下載",
    changelog: "更新日誌",
    nightly: "Nightly 建置版",
    help: "說明",
    docs: "文件",
    issue: "回報問題",
    feature: "提出功能需求",
    discord: "Discord",
    elsewhere: "其他",
    anilist: "AniList",
    security: "安全政策",
    contributing: "參與貢獻",
    license: "AGPL-3.0 授權",
    copyright: "以 AGPL-3.0 授權 · © 2026 Kyu and Karasu contributors",
    disclaimer:
      "Karasu 是獨立專案，與 AniList 沒有關係，也未獲得 AniList 的背書。SN Pro 依據 SIL Open Font License 1.1 使用。",
    language: "語言",
    aiNote: "除英文與德文外，所有語言皆為 AI 翻譯，尚未經過人工審閱。",
  },
  notFound: {
    title: "這裡沒有鳥停留。",
    body: "你要找的頁面不存在。整個網站只有一頁，而這裡不是那一頁。",
    back: "回到 Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "以封面格狀顯示的動畫清單，旁邊是狀態與自訂清單的一欄，上方是搜尋、排序、篩選與預設組合。",
      caption: "動畫清單，格狀檢視",
    },
    overview: {
      alt: "總覽頁：在某一季的橫幅之上，是附搜尋的問候語與未來 48 小時的安排；清單以書架形式排列，還有需要追的播出中作品，以及一欄統計和你自己的動態。",
      caption: "總覽 — 你的清單、本週安排、需要追的內容",
    },
    "now-playing": {
      alt: "「正在播放」視窗浮在動畫清單之上：在 mpv 中偵測到 Mushoku Tensei 第三季，第 3 季第 9 集，並顯示即將寫入的進度。",
      caption: "正在播放 — 在 mpv 中偵測到一集",
    },
    seasonal: {
      alt: "當季新番頁面：2026 年秋季的作品以卡片顯示，附有類型與倒數計時，旁邊一欄是年份、季度與格式。",
      caption: "當季新番",
    },
    calendar: {
      alt: "日曆的行程檢視：從今天起本週播出的劇集，每集一張卡片，附有封面、時間與集數。",
      caption: "日曆",
    },
    "stats-overview": {
      alt: "統計頁面的總覽：清單的總數、狀態與格式的環形圖、製作國家、觀看時間的去向，以及系列長度。",
      caption: "統計 — 總覽",
    },
    franchise: {
      alt: "Mushoku Tensei 的系列關係圖：第三季與先前幾季、輕小說和一部衍生漫畫相連，側邊是所選作品的卡片。",
      caption: "系列關係圖",
    },
    "phone-overview": {
      alt: "手機上的總覽頁：在某一季的橫幅之上是附搜尋的問候語，清單以書架形式排列，下方是底部列。",
      caption: "Android — 總覽",
    },
    "phone-list": {
      alt: "手機上的動畫清單，為三欄封面格狀，上方是狀態選擇器與清單搜尋。",
      caption: "Android — 動畫清單",
    },
    "phone-detail": {
      alt: "手機上 Mushoku Tensei 的詳細資料頁，狀態面板已展開：狀態、進度與評分之上，是社群自己的評分分布。",
      caption: "Android — 一部作品，項目已展開",
    },
    "phone-search": {
      alt: "手機上的搜尋頁，以封面格狀顯示「season 2」的搜尋結果。",
      caption: "Android — 搜尋",
    },
  },
} satisfies Messages;
