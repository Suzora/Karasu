import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Pelacak anime & manga modern untuk AniList",
    description:
      "Karasu adalah pelacak anime dan manga gratis dan open source yang dibuat khusus untuk AniList. Ia mengenali apa yang kamu putar — dan di Windows, apa yang kamu baca — lalu menjaga progres AniList-mu tetap sinkron. Windows, Linux, dan Android.",
    notFoundTitle: "Halaman tidak ditemukan — Karasu",
  },
  skip: "Lewati ke konten",
  nav: {
    label: "Navigasi utama",
    home: "Karasu — kembali ke atas",
    changes: "Apa yang berubah",
    screenshots: "Tangkapan layar",
    join: "Ikut terlibat",
    faq: "FAQ",
    github: "GitHub",
    download: "Unduh",
    downloadKarasu: "Unduh Karasu",
    openMenu: "Buka menu",
    closeMenu: "Tutup menu",
  },
  hero: {
    eyebrow: "Gratis · open source · untuk AniList",
    title: "Klien AniList yang mencatat episodemu untukmu",
    lede: "Daftarmu, musim tayang, kalender tayang, statistik, feed, dan forum dalam satu jendela yang cepat, plus deteksi yang memperbarui daftarmu saat sebuah episode selesai.",
    windows: "Unduh untuk Windows",
    linux: "Linux",
    android: "Android",
    note: "Versi {version}. Installer Windows belum ditandatangani kode, jadi SmartScreen mungkin memberi peringatan saat pertama dijalankan · Linux adalah AppImage eksperimental · Android adalah APK yang dipasang manual · tidak ada macOS",
    checksums: "checksum",
    everyDownload: "semua unduhan",
  },
  changes: {
    title: "Apa yang berubah",
    nightly: "Di Nightly",
    version: "Versi {version}",
    since: "Sejak {version}, belum ada di rilis Stable mana pun",
    added: "Ditambahkan",
    changed: "Diubah",
    fixed: "Diperbaiki",
    whole: "Seluruh changelog",
  },
  gallery: {
    eyebrow: "Tangkapan layar",
    title: "Aplikasinya, apa adanya",
    which: "Pilih tangkapan layar",
    desktop: "Desktop",
    android: "Android",
    open: "Buka: {caption}",
    dialog: "Tangkapan layar {n} dari {total}: {caption}",
    previous: "Tangkapan layar sebelumnya",
    next: "Tangkapan layar berikutnya",
    close: "Tutup",
  },
  join: {
    title: "Coba dulu, lalu ceritakan bagaimana hasilnya",
    body: "Karasu dibuat oleh satu maintainer bersama siapa pun yang mau ikut. Laporan bug, ide, atau kabar bahwa aplikasinya jalan di komputermu sangat membantu, terutama di Linux dan Android.",
    discord: "Gabung ke Discord",
    bug: "Laporkan bug",
    source: "Kode sumber di GitHub",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Pertanyaan, dijawab dari kodenya.",
    items: {
      what: {
        q: "Apa itu Karasu?",
        a: "Aplikasi desktop dan Android yang mengelola daftar anime dan manga AniList-mu. Ia mengenali apa yang sedang kamu putar atau baca dan memperbarui progresmu di AniList secara otomatis, dengan bertanya sekali dulu untuk chapter dari situs yang namanya tidak ia kenal, dan ia memberi daftar itu antarmuka lokal yang cepat dengan statistik, notifikasi, dan halaman sosial.",
      },
      free: {
        q: "Apakah gratis?",
        a: "Ya. Karasu gratis dan dirilis di bawah GNU AGPL-3.0, atau versi yang lebih baru. Tidak ada paket berbayar dan tidak ada yang perlu dibuka.",
      },
      open: {
        q: "Apakah open source?",
        a: "Ya. Seluruh kode sumbernya ada di GitHub, dan setiap rilis dibangun di sana dari commit yang diberi tag.",
      },
      anilist: {
        q: "Apa itu AniList?",
        a: "Basis data anime dan manga sekaligus situs pelacakan gratis di anilist.co. Daftarmu ada di sana; Karasu membaca dan menulisnya lewat API publik AniList.",
      },
      replace: {
        q: "Apakah Karasu menggantikan AniList?",
        a: "Tidak. Ini adalah klien untuk AniList. Daftarmu tetap di AniList dan setiap perubahan yang dibuat Karasu terlihat di situs web beberapa saat kemudian. Kamu juga bisa memakai Karasu tanpa akun, hanya dengan daftar lokal.",
      },
      platforms: {
        q: "Platform apa saja yang didukung?",
        a: "Windows dan Android adalah Stable, Linux adalah AppImage eksperimental, dan tidak ada build macOS. Windows punya semua fitur. Android punya daftar, statistik, notifikasi, widget, halaman sosial, dan pembaru sendiri, tetapi tanpa pustaka lokal dan tanpa tray. Deteksinya berbeda: Windows membaca sesi media, jendela pemutar dan peramban, mpv, dan Jellyfin; Linux membaca sesi media, mpv, dan Jellyfin, tanpa judul jendela; Android membaca Jellyfin.",
      },
      credentials: {
        q: "Apakah Karasu menyimpan kredensial AniList-ku?",
        a: "Ia tidak pernah melihat kata sandimu. Proses masuk berlangsung di anilist.co di peramban kamu, yang menyerahkan token ke Karasu. Token itu disimpan di penyimpanan kredensial sistem operasimu di desktop, di file terenkripsi di samping aplikasi pada mode portabel, dan di file yang disegel Keystore di Android — dan tidak pernah dikembalikan ke web view aplikasi.",
      },
      offline: {
        q: "Bisakah Karasu bekerja secara offline?",
        a: "Daftarmu di-cache secara lokal, jadi bisa dibuka tanpa jaringan, judul di dalamnya menampilkan halaman yang tersimpan di cache dengan +1 yang berfungsi, dan perubahan diantrekan lalu dikirim saat koneksi kembali. Menjelajahi judul yang tidak ada di daftarmu, pencarian, dan halaman sosial memerlukan jaringan.",
      },
      automatic: {
        q: "Apakah progres AniList-ku diperbarui otomatis?",
        a: "Ya, secara bawaan setelah sebuah episode diputar selama dua pertiga durasinya — atau selama menit yang kamu atur, atau setelah kamu mengonfirmasi toast, jika kamu lebih suka ditanya. Chapter dari situs yang namanya tidak dikenal Karasu selalu bertanya dulu. Progres hanya bergerak maju, dan Karasu membaca ulang daftarmu tepat sebelum menulis.",
      },
      affiliated: {
        q: "Apakah Karasu berafiliasi dengan AniList?",
        a: "Tidak. Ini proyek independen yang memakai API publik AniList, dengan client id terdaftar dan tanpa akses khusus.",
      },
      smartscreen: {
        q: "Mengapa Windows memperingatkan saat saya memasangnya?",
        a: "Installer-nya belum ditandatangani kode, jadi SmartScreen belum pernah melihatnya dan mengatakannya begitu. Setiap rilis menyertakan SHA256SUMS.txt yang bisa kamu pakai untuk memeriksa unduhanmu.",
      },
      network: {
        q: "Dengan apa saja Karasu berkomunikasi?",
        a: "API dan server gambar AniList; GitHub, untuk pengecekan pembaruan dan unduhan; data relasi episode dari komunitas di GitHub, paling sering seminggu sekali; server Jellyfin milikmu sendiri jika kamu menyiapkannya; soket lokal Discord untuk Rich Presence jika kamu mengaktifkannya. Gambar di bio pengguna AniList diambil lewat proxy terbatas milik Karasu sendiri, sehingga host tersebut tahu alamat IP-mu saat kamu membuka profil. Tidak ada yang lain, dan tidak ada analitik.",
      },
    },
  },
  footer: {
    tagline: "Pelacak anime & manga modern — dibuat khusus untuk AniList.",
    badge: "Open source · gratis",
    project: "Proyek",
    github: "GitHub",
    download: "Unduh",
    changelog: "Changelog",
    nightly: "Build Nightly",
    help: "Bantuan",
    docs: "Dokumentasi",
    issue: "Laporkan masalah",
    feature: "Minta fitur",
    discord: "Discord",
    elsewhere: "Di tempat lain",
    anilist: "AniList",
    security: "Kebijakan keamanan",
    contributing: "Berkontribusi",
    license: "Lisensi AGPL-3.0",
    copyright: "Berlisensi AGPL-3.0 · © 2026 Kyusetzu dan kontributor Karasu",
    disclaimer:
      "Karasu adalah proyek independen dan tidak berafiliasi dengan atau didukung oleh AniList. SN Pro digunakan di bawah SIL Open Font License 1.1.",
    language: "Bahasa",
    aiNote: "Setiap bahasa selain Inggris dan Jerman adalah terjemahan AI yang belum ditinjau oleh siapa pun.",
  },
  notFound: {
    title: "Tidak ada burung yang hinggap di sini.",
    body: "Halaman yang kamu cari tidak ada. Seluruh situs ini hanya satu halaman, dan ini bukan halaman itu.",
    back: "Kembali ke Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Daftar anime sebagai grid sampul, dengan kolom status dan daftar kustom di sampingnya serta pencarian, urutan, filter, dan preset di atasnya.",
      caption: "Daftar anime, tampilan grid",
    },
    overview: {
      alt: "Ringkasan: sapaan dengan pencarian dan 48 jam ke depan di atas banner sebuah musim, daftar-daftar sebagai rak, judul yang sedang tayang untuk dikejar, dan kolom berisi statistik serta aktivitasmu sendiri.",
      caption: "Ringkasan — daftarmu, minggu ini, yang perlu dikejar",
    },
    "now-playing": {
      alt: "Jendela Sedang Diputar melayang di atas daftar anime: musim ketiga Mushoku Tensei terdeteksi di mpv, musim 3 episode 9, beserta progres yang akan ditulis.",
      caption: "Sedang Diputar — sebuah episode terdeteksi di mpv",
    },
    seasonal: {
      alt: "Halaman Musiman: judul-judul Musim Gugur 2026 sebagai kartu dengan genre dan hitung mundur, dengan kolom tahun, musim, dan format di sampingnya.",
      caption: "Musiman",
    },
    calendar: {
      alt: "Agenda Kalender: episode yang tayang minggu ini mulai hari ini, masing-masing di sebuah kartu dengan sampul, waktu, dan nomor episode.",
      caption: "Kalender",
    },
    "stats-overview": {
      alt: "Ringkasan halaman Statistik: total daftar, cincin status dan format, negara asal, ke mana waktu menonton dihabiskan, dan panjang serial.",
      caption: "Statistik — ringkasan",
    },
    franchise: {
      alt: "Grafik franchise Mushoku Tensei: musim ketiga terhubung ke musim-musim sebelumnya, novel ringan, dan manga spin-off, dengan kartu judul yang dipilih di sisinya.",
      caption: "Grafik franchise",
    },
    "phone-overview": {
      alt: "Ringkasan di ponsel: sapaan dengan pencarian di atas banner sebuah musim dan daftar-daftar sebagai rak, di atas bilah bawah.",
      caption: "Android — ringkasan",
    },
    "phone-list": {
      alt: "Daftar anime di ponsel sebagai grid sampul tiga kolom, dengan pemilih status dan pencarian daftar di atasnya.",
      caption: "Android — daftar anime",
    },
    "phone-detail": {
      alt: "Halaman detail Mushoku Tensei di ponsel dengan lembar status terbuka: status, progres, dan skor di atas sebaran skor dari komunitas.",
      caption: "Android — sebuah judul, dengan entrinya terbuka",
    },
    "phone-search": {
      alt: "Halaman pencarian di ponsel dengan hasil untuk “season 2” sebagai grid sampul.",
      caption: "Android — pencarian",
    },
  },
} satisfies Messages;
