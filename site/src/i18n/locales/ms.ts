import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Penjejak anime & manga moden untuk AniList",
    description:
      "Karasu ialah penjejak anime dan manga percuma dan sumber terbuka yang dibina khas untuk AniList. Ia mengesan apa yang anda mainkan — dan di Windows, apa yang anda baca — serta memastikan kemajuan AniList anda sentiasa disegerakkan. Windows, Linux dan Android.",
    notFoundTitle: "Halaman tidak ditemui — Karasu",
  },
  skip: "Langkau ke kandungan",
  nav: {
    label: "Navigasi utama",
    home: "Karasu — kembali ke atas",
    changes: "Apa yang berubah",
    screenshots: "Tangkapan skrin",
    join: "Sertai kami",
    faq: "Soalan lazim",
    github: "GitHub",
    download: "Muat turun",
    downloadKarasu: "Muat turun Karasu",
    openMenu: "Buka menu",
    closeMenu: "Tutup menu",
  },
  hero: {
    eyebrow: "Percuma · sumber terbuka · untuk AniList",
    title: "Klien AniList yang mencatat episod anda untuk anda",
    lede: "Senarai anda, musim tayangan, kalendar siaran, statistik, suapan dan forum dalam satu tetingkap yang pantas, serta pengesanan yang mengemas kini senarai anda apabila sesuatu episod tamat.",
    windows: "Muat turun untuk Windows",
    linux: "Linux",
    android: "Android",
    note: "Versi {version}. Pemasang Windows belum ditandatangani kod, jadi SmartScreen mungkin memberi amaran pada larian pertama · Linux ialah AppImage eksperimen · Android ialah APK yang dipasang sendiri · tiada macOS",
    checksums: "checksum",
    everyDownload: "semua muat turun",
  },
  changes: {
    title: "Apa yang berubah",
    nightly: "Dalam Nightly",
    version: "Versi {version}",
    since: "Sejak {version}, belum ada dalam mana-mana keluaran Stable",
    added: "Ditambah",
    changed: "Diubah",
    fixed: "Dibaiki",
    whole: "Keseluruhan changelog",
  },
  gallery: {
    eyebrow: "Tangkapan skrin",
    title: "Aplikasinya, seadanya",
    which: "Pilih tangkapan skrin",
    desktop: "Desktop",
    android: "Android",
    open: "Buka: {caption}",
    dialog: "Tangkapan skrin {n} daripada {total}: {caption}",
    previous: "Tangkapan skrin sebelumnya",
    next: "Tangkapan skrin seterusnya",
    close: "Tutup",
  },
  join: {
    title: "Cubalah, kemudian ceritakan pengalaman anda",
    body: "Karasu dibina oleh seorang penyelenggara bersama sesiapa sahaja yang menyertai. Laporan pepijat, idea atau sekadar makluman bahawa ia berfungsi pada komputer anda sangat membantu, terutamanya di Linux dan Android.",
    discord: "Sertai Discord",
    bug: "Laporkan pepijat",
    source: "Kod sumber di GitHub",
  },
  faq: {
    eyebrow: "Soalan lazim",
    title: "Soalan, dijawab berdasarkan kod.",
    items: {
      what: {
        q: "Apakah Karasu?",
        a: "Aplikasi desktop dan Android yang menguruskan senarai anime dan manga AniList anda. Ia mengesan apa yang sedang anda mainkan atau baca dan mengemas kini kemajuan anda di AniList secara automatik, dengan bertanya sekali dahulu untuk bab daripada laman yang namanya tidak dikenali, dan ia memberikan senarai itu antara muka tempatan yang pantas dengan statistik, pemberitahuan dan halaman sosial.",
      },
      free: {
        q: "Adakah ia percuma?",
        a: "Ya. Karasu percuma dan dikeluarkan di bawah GNU AGPL-3.0, atau mana-mana versi yang lebih baharu. Tiada pelan berbayar dan tiada apa yang perlu dibuka kuncinya.",
      },
      open: {
        q: "Adakah ia sumber terbuka?",
        a: "Ya. Keseluruhan kod sumbernya ada di GitHub, dan setiap keluaran dibina di sana daripada commit yang bertag.",
      },
      anilist: {
        q: "Apakah AniList?",
        a: "Pangkalan data anime dan manga serta laman penjejakan percuma di anilist.co. Senarai anda berada di sana; Karasu membaca dan menulisnya melalui API awam AniList.",
      },
      replace: {
        q: "Adakah Karasu menggantikan AniList?",
        a: "Tidak. Ia ialah klien untuk AniList. Senarai anda kekal di AniList dan setiap perubahan yang dibuat oleh Karasu kelihatan di laman web sebentar kemudian. Anda juga boleh menggunakan Karasu tanpa akaun, dengan senarai tempatan sahaja.",
      },
      platforms: {
        q: "Platform apakah yang disokong?",
        a: "Windows dan Android ialah Stable, Linux ialah AppImage eksperimen, dan tiada binaan macOS. Windows mempunyai semua ciri. Android mempunyai senarai, statistik, pemberitahuan, widget, halaman sosial dan pengemas kini tersendiri, tetapi tiada pustaka tempatan dan tiada dulang sistem. Pengesanan berbeza: Windows membaca sesi media, tetingkap pemain dan pelayar, mpv dan Jellyfin; Linux membaca sesi media, mpv dan Jellyfin, tanpa tajuk tetingkap; Android membaca Jellyfin.",
      },
      credentials: {
        q: "Adakah Karasu menyimpan bukti kelayakan AniList saya?",
        a: "Ia tidak pernah melihat kata laluan anda. Log masuk berlaku di anilist.co dalam pelayar anda, yang menyerahkan token kepada Karasu. Token itu disimpan dalam stor bukti kelayakan sistem pengendalian anda pada desktop, dalam fail yang disulitkan di sebelah aplikasi dalam mod mudah alih, dan dalam fail yang dimeterai Keystore pada Android — dan ia tidak pernah diserahkan semula kepada paparan web aplikasi.",
      },
      offline: {
        q: "Bolehkah Karasu berfungsi tanpa talian?",
        a: "Senarai anda dicache secara tempatan, jadi ia dibuka tanpa rangkaian, tajuk di dalamnya memaparkan halaman yang dicache dengan +1 yang berfungsi, dan suntingan disusun dalam baris gilir lalu dihantar apabila sambungan kembali. Menyemak imbas tajuk yang tiada dalam senarai anda, carian dan halaman sosial memerlukan rangkaian.",
      },
      automatic: {
        q: "Adakah ia mengemas kini kemajuan AniList saya secara automatik?",
        a: "Ya, secara lalai apabila sesuatu episod telah dimainkan selama dua pertiga daripada panjangnya — atau selama minit yang anda tetapkan, atau selepas anda mengesahkan paparan pemberitahuan, jika anda lebih suka ditanya. Bab daripada laman yang tidak dinamakan oleh Karasu sentiasa bertanya dahulu. Kemajuan hanya bergerak ke hadapan, dan Karasu membaca semula senarai anda sebelum menulis.",
      },
      affiliated: {
        q: "Adakah Karasu bergabung dengan AniList?",
        a: "Tidak. Ia projek bebas yang menggunakan API awam AniList, dengan id klien yang didaftarkan dan tiada akses istimewa.",
      },
      smartscreen: {
        q: "Mengapakah Windows memberi amaran apabila saya memasangnya?",
        a: "Pemasang itu belum ditandatangani kod, jadi SmartScreen tidak pernah melihatnya sebelum ini dan memberitahu sedemikian. Setiap keluaran disertakan dengan SHA256SUMS.txt yang boleh anda gunakan untuk menyemak muat turun anda.",
      },
      network: {
        q: "Dengan apakah Karasu berhubung?",
        a: "API dan pelayan imej AniList; GitHub, untuk semakan kemas kini dan muat turun; data perhubungan episod komuniti di GitHub, paling kerap seminggu sekali; pelayan Jellyfin anda sendiri jika anda menyediakannya; soket tempatan Discord untuk Rich Presence jika anda mengaktifkannya. Imej dalam bio pengguna AniList diambil melalui proksi terhad milik Karasu sendiri, jadi hos tersebut mengetahui alamat IP anda apabila anda membuka profil. Tiada yang lain, dan tiada analitik.",
      },
    },
  },
  footer: {
    tagline: "Penjejak anime & manga moden — dibina khas untuk AniList.",
    badge: "Sumber terbuka · percuma",
    project: "Projek",
    github: "GitHub",
    download: "Muat turun",
    changelog: "Changelog",
    nightly: "Binaan Nightly",
    help: "Bantuan",
    docs: "Dokumentasi",
    issue: "Laporkan isu",
    feature: "Minta ciri",
    discord: "Discord",
    elsewhere: "Di tempat lain",
    anilist: "AniList",
    security: "Dasar keselamatan",
    contributing: "Menyumbang",
    license: "Lesen AGPL-3.0",
    copyright: "Dilesenkan di bawah AGPL-3.0 · © 2026 Kyu dan penyumbang Karasu",
    disclaimer:
      "Karasu ialah projek bebas dan tidak bergabung atau disokong oleh AniList. SN Pro digunakan di bawah SIL Open Font License 1.1.",
    language: "Bahasa",
    aiNote: "Setiap bahasa selain bahasa Inggeris dan bahasa Jerman ialah terjemahan AI yang belum disemak oleh sesiapa.",
  },
  notFound: {
    title: "Tiada burung yang hinggap di sini.",
    body: "Halaman yang anda cari tidak wujud. Seluruh laman ini hanyalah satu halaman, dan ini bukan halaman itu.",
    back: "Kembali ke Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Senarai anime sebagai grid kulit, dengan lajur status dan senarai tersuai di sebelahnya serta carian, isihan, penapis dan pratetap di atasnya.",
      caption: "Senarai anime, paparan grid",
    },
    overview: {
      alt: "Gambaran Keseluruhan: ucapan dengan carian dan 48 jam akan datang di atas sepanduk sesuatu musim, senarai-senarai sebagai rak, tajuk yang sedang disiarkan untuk dikejar, dan lajur dengan statistik serta aktiviti anda sendiri.",
      caption: "Gambaran Keseluruhan — senarai anda, minggu ini, apa yang perlu dikejar",
    },
    "now-playing": {
      alt: "Tetingkap Sedang Dimainkan terapung di atas senarai anime: musim ketiga Mushoku Tensei dikesan dalam mpv, musim 3 episod 9, dengan kemajuan yang akan ditulis.",
      caption: "Sedang Dimainkan — satu episod dikesan dalam mpv",
    },
    seasonal: {
      alt: "Halaman Bermusim: tajuk Musim Luruh 2026 sebagai kad dengan genre dan kiraan detik, dengan lajur tahun, musim dan format di sebelahnya.",
      caption: "Bermusim",
    },
    calendar: {
      alt: "Agenda Kalendar: episod yang disiarkan minggu ini bermula hari ini, masing-masing pada sekeping kad dengan kulit, masa dan nombor episod.",
      caption: "Kalendar",
    },
    "stats-overview": {
      alt: "Gambaran keseluruhan halaman Statistik: jumlah senarai, gelang status dan format, negara asal, ke mana masa menonton dihabiskan dan panjang siri.",
      caption: "Statistik — gambaran keseluruhan",
    },
    franchise: {
      alt: "Graf francais Mushoku Tensei: musim ketiga dipautkan kepada musim-musim terdahulu, novel ringan dan manga sampingan, dengan kad tajuk yang dipilih di sisinya.",
      caption: "Graf francais",
    },
    "phone-overview": {
      alt: "Gambaran Keseluruhan pada telefon: ucapan dengan carian di atas sepanduk sesuatu musim dan senarai-senarai sebagai rak, di atas bar bawah.",
      caption: "Android — gambaran keseluruhan",
    },
    "phone-list": {
      alt: "Senarai anime pada telefon sebagai grid kulit tiga lajur, dengan pemilih status dan carian senarai di atasnya.",
      caption: "Android — senarai anime",
    },
    "phone-detail": {
      alt: "Halaman butiran Mushoku Tensei pada telefon dengan helaian status terbuka: status, kemajuan dan skor di atas taburan skor komuniti sendiri.",
      caption: "Android — satu tajuk, dengan entrinya terbuka",
    },
    "phone-search": {
      alt: "Halaman carian pada telefon dengan hasil untuk “season 2” sebagai grid kulit.",
      caption: "Android — carian",
    },
  },
} satisfies Messages;
