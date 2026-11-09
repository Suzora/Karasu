import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — AniList のための現代的なアニメ・マンガトラッカー",
    description:
      "Karasu は AniList 専用に作られた、無料でオープンソースのアニメ・マンガトラッカーです。再生中の作品を検知し、Windows では読んでいる作品も検知して、AniList の進捗を最新に保ちます。Windows、Linux、Android に対応。",
    notFoundTitle: "ページが見つかりません — Karasu",
  },
  skip: "本文へスキップ",
  nav: {
    label: "メインナビゲーション",
    home: "Karasu — ページの先頭へ戻る",
    changes: "更新内容",
    screenshots: "スクリーンショット",
    join: "参加する",
    faq: "FAQ",
    github: "GitHub",
    download: "ダウンロード",
    downloadKarasu: "Karasu をダウンロード",
    openMenu: "メニューを開く",
    closeMenu: "メニューを閉じる",
  },
  hero: {
    eyebrow: "無料 · オープンソース · AniList 専用",
    title: "話数の記録を代わりにつけてくれる AniList クライアント",
    lede: "リスト、シーズン、放送カレンダー、統計、フィード、フォーラムをひとつの軽快なウィンドウにまとめ、エピソードが終わるとリストを自動で更新する検知機能を備えています。",
    windows: "Windows 版をダウンロード",
    linux: "Linux",
    android: "Android",
    note: "バージョン {version}。Windows のインストーラーはコード署名されていないため、初回起動時に SmartScreen が警告を表示することがあります · Linux は実験的な AppImage です · Android はサイドロード用の APK です · macOS には対応していません",
    checksums: "チェックサム",
    everyDownload: "すべてのダウンロード",
  },
  changes: {
    title: "更新内容",
    nightly: "Nightly 版",
    version: "バージョン {version}",
    since: "{version} 以降、まだ Stable リリースには含まれていません",
    added: "追加",
    changed: "変更",
    fixed: "修正",
    whole: "変更履歴をすべて見る",
  },
  gallery: {
    eyebrow: "スクリーンショット",
    title: "ありのままのアプリ",
    which: "表示するスクリーンショット",
    desktop: "デスクトップ",
    android: "Android",
    open: "開く：{caption}",
    dialog: "スクリーンショット {n}/{total}：{caption}",
    previous: "前のスクリーンショット",
    next: "次のスクリーンショット",
    close: "閉じる",
  },
  join: {
    title: "まず試して、感想を聞かせてください",
    body: "Karasu は、ひとりのメンテナーと、参加してくれる皆さんで作られています。バグ報告、アイデア、あなたの環境で動いたという一言が助けになります。特に Linux と Android では大歓迎です。",
    discord: "Discord に参加",
    bug: "バグを報告",
    source: "GitHub のソースコード",
  },
  faq: {
    eyebrow: "FAQ",
    title: "コードに基づいてお答えします。",
    items: {
      what: {
        q: "Karasu とは何ですか？",
        a: "AniList のアニメ・マンガリストを管理するデスクトップ／Android アプリです。再生中や閲覧中の作品を検知して AniList の進捗を自動で更新します。名前を把握していないサイトのチャプターは、最初に一度確認します。さらに、そのリストに統計、通知、ソーシャルページを備えた高速なローカルのインターフェースを提供します。",
      },
      free: {
        q: "無料ですか？",
        a: "はい。Karasu は無料で、GNU AGPL-3.0 またはそれ以降のバージョンで公開されています。有料プランも、解除が必要な機能もありません。",
      },
      open: {
        q: "オープンソースですか？",
        a: "はい。ソースコードはすべて GitHub にあり、リリースはどれもタグ付けされたコミットから GitHub 上でビルドされます。",
      },
      anilist: {
        q: "AniList とは何ですか？",
        a: "anilist.co にある、無料のアニメ・マンガデータベース兼トラッキングサイトです。あなたのリストはそこにあり、Karasu は AniList の公開 API を通じてリストを読み書きします。",
      },
      replace: {
        q: "Karasu は AniList の代わりになりますか？",
        a: "いいえ。AniList のためのクライアントです。リストは AniList に残り、Karasu が行った変更は少し後にウェブサイトにも反映されます。アカウントなしで、ローカルのリストだけで Karasu を使うこともできます。",
      },
      platforms: {
        q: "どのプラットフォームに対応していますか？",
        a: "Windows と Android は Stable、Linux は実験的な AppImage で、macOS 向けのビルドはありません。すべての機能が使えるのは Windows です。Android にはリスト、統計、通知、ウィジェット、ソーシャルページ、独自のアップデーターがありますが、ローカルライブラリとトレイはありません。検知の仕組みも異なります。Windows はメディアセッション、プレーヤーとブラウザーのウィンドウ、mpv、Jellyfin を読み取ります。Linux はメディアセッション、mpv、Jellyfin を読み取りますが、ウィンドウタイトルは読み取りません。Android は Jellyfin を読み取ります。",
      },
      credentials: {
        q: "Karasu は AniList の認証情報を保存しますか？",
        a: "パスワードは一切見ません。サインインはブラウザー上の anilist.co で行われ、そこから Karasu にトークンが渡されます。このトークンは、デスクトップでは OS の資格情報ストア、ポータブルモードではアプリの隣にある暗号化ファイル、Android では Keystore で保護されたファイルに保存され、アプリの Web ビューに返されることはありません。",
      },
      offline: {
        q: "Karasu はオフラインでも使えますか？",
        a: "リストはローカルにキャッシュされるので、ネットワークなしでも開けます。リスト内の作品はキャッシュされたページが表示され、+1 も使えます。編集はキューに入り、接続が戻ると送信されます。リストにない作品の閲覧、検索、ソーシャルページにはネットワークが必要です。",
      },
      automatic: {
        q: "AniList の進捗は自動で更新されますか？",
        a: "はい。初期設定ではエピソードの長さの3分の2を再生した時点で更新されます。分数を自分で設定することも、確認されたい場合はトーストを承認してから更新することもできます。Karasu が名前を把握していないサイトのチャプターは、必ず先に確認します。進捗が進むだけで戻ることはなく、Karasu は書き込む直前にもう一度リストを読み込みます。",
      },
      affiliated: {
        q: "Karasu は AniList と提携していますか？",
        a: "いいえ。AniList の公開 API を利用する独立したプロジェクトで、登録済みのクライアント ID を使っており、特別なアクセス権はありません。",
      },
      smartscreen: {
        q: "インストール時に Windows が警告するのはなぜですか？",
        a: "インストーラーがコード署名されておらず、SmartScreen がこれまで見たことのないファイルだからです。各リリースには SHA256SUMS.txt が付属しており、ダウンロードしたファイルの確認に使えます。",
      },
      network: {
        q: "Karasu はどこと通信しますか？",
        a: "AniList の API と画像サーバー、アップデートの確認とダウンロードのための GitHub、GitHub 上のコミュニティ提供のエピソード関連データ（週に最大1回）、設定した場合はご自身の Jellyfin サーバー、有効にした場合は Rich Presence のための Discord のローカルソケットです。AniList のプロフィール文に含まれる画像は Karasu 独自の制限付きプロキシ経由で取得されるため、プロフィールを開くとそれらのホストにあなたの IP アドレスが知られます。それ以外とは通信せず、アナリティクスもありません。",
      },
    },
  },
  footer: {
    tagline: "現代的なアニメ・マンガトラッカー — AniList 専用に作られています。",
    badge: "オープンソース · 無料",
    project: "プロジェクト",
    github: "GitHub",
    download: "ダウンロード",
    changelog: "変更履歴",
    nightly: "Nightly ビルド",
    help: "ヘルプ",
    docs: "ドキュメント",
    issue: "問題を報告",
    feature: "機能をリクエスト",
    discord: "Discord",
    elsewhere: "その他",
    anilist: "AniList",
    security: "セキュリティポリシー",
    contributing: "コントリビューション",
    license: "AGPL-3.0 ライセンス",
    copyright: "AGPL-3.0 ライセンス · © 2026 Kyu and Karasu contributors",
    disclaimer:
      "Karasu は独立したプロジェクトであり、AniList と提携しておらず、AniList の公認も受けていません。SN Pro は SIL Open Font License 1.1 のもとで使用しています。",
    language: "言語",
    aiNote: "英語とドイツ語以外の言語は AI による翻訳で、人によるレビューは行われていません。",
  },
  notFound: {
    title: "ここには誰も止まっていません。",
    body: "お探しのページは存在しません。このサイトは1ページだけで、ここはそのページではありません。",
    back: "Karasu に戻る",
  },
  shots: {
    "anime-grid": {
      alt: "カバー画像のグリッドで表示したアニメリスト。横にステータスとカスタムリストの列があり、上には検索、並べ替え、フィルター、プリセットが並んでいます。",
      caption: "アニメリスト、グリッド表示",
    },
    overview: {
      alt: "概要画面：シーズンのバナーの上に、検索付きのあいさつと今後48時間の予定。その下にリストが棚のように並び、追いかける放送中の作品、統計とあなた自身のアクティビティの列があります。",
      caption: "概要 — リスト、今週、追いつくべき作品",
    },
    "now-playing": {
      alt: "アニメリストの上に浮かぶ「再生中」ウィンドウ：mpv でMushoku Tenseiの第3期を検知し、シーズン3 第9話と、書き込む予定の進捗が表示されています。",
      caption: "再生中 — mpv でエピソードを検知",
    },
    seasonal: {
      alt: "シーズンページ：2026年秋の作品がジャンルとカウントダウン付きのカードで並び、横に年、シーズン、フォーマットの列があります。",
      caption: "シーズン",
    },
    calendar: {
      alt: "カレンダーのアジェンダ：今日から1週間の放送エピソードが、カバー、時刻、話数付きのカードで並んでいます。",
      caption: "カレンダー",
    },
    "stats-overview": {
      alt: "統計ページの概要：リストの合計、ステータスとフォーマットのリング、制作国、視聴時間の内訳、シリーズの長さ。",
      caption: "統計 — 概要",
    },
    franchise: {
      alt: "Mushoku Tenseiのフランチャイズグラフ：第3期が以前のシーズン、ライトノベル、スピンオフのマンガとつながり、横には選択した作品のカードがあります。",
      caption: "フランチャイズグラフ",
    },
    "phone-overview": {
      alt: "スマートフォンの概要画面：シーズンのバナーの上に検索付きのあいさつ、その下にリストが棚のように並び、最下部にはボトムバーがあります。",
      caption: "Android — 概要",
    },
    "phone-list": {
      alt: "スマートフォンのアニメリスト。3列のカバーグリッドで、上にステータスの選択とリスト内検索があります。",
      caption: "Android — アニメリスト",
    },
    "phone-detail": {
      alt: "スマートフォンのMushoku Tenseiの詳細ページで、ステータスシートが開いています：ステータス、進捗、スコアの上に、コミュニティ全体のスコア分布が表示されています。",
      caption: "Android — エントリーを開いた作品",
    },
    "phone-search": {
      alt: "スマートフォンの検索ページ。「season 2」の検索結果がカバーグリッドで表示されています。",
      caption: "Android — 検索",
    },
  },
} satisfies Messages;
