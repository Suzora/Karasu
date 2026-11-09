import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — AniList için modern bir anime ve manga takipçisi",
    description:
      "Karasu, yalnızca AniList için geliştirilmiş, ücretsiz ve açık kaynaklı bir anime ve manga takipçisidir. Ne oynattığını — ve Windows'ta ne okuduğunu — fark eder ve AniList ilerlemeni güncel tutar. Windows, Linux ve Android.",
    notFoundTitle: "Sayfa bulunamadı — Karasu",
  },
  skip: "İçeriğe geç",
  nav: {
    label: "Ana gezinme",
    home: "Karasu — başa dön",
    changes: "Neler değişti",
    screenshots: "Ekran görüntüleri",
    join: "Katıl",
    faq: "SSS",
    github: "GitHub",
    download: "İndir",
    downloadKarasu: "Karasu'yu indir",
    openMenu: "Menüyü aç",
    closeMenu: "Menüyü kapat",
  },
  hero: {
    eyebrow: "Ücretsiz · açık kaynak · AniList için",
    title: "Bölümlerini senin yerine yazan AniList istemcisi",
    lede: "Listelerin, sezon, yayın takvimi, istatistikler, akış ve forum tek bir hızlı pencerede; ayrıca bir bölüm bittiğinde listeni güncelleyen bir algılama.",
    windows: "Windows için indir",
    linux: "Linux",
    android: "Android",
    note: "Sürüm {version}. Windows yükleyicisi kod imzalı değildir, bu yüzden SmartScreen ilk çalıştırmada uyarabilir · Linux deneysel bir AppImage'dır · Android elle yüklenen bir APK'dır · macOS yok",
    checksums: "sağlama toplamları",
    everyDownload: "tüm indirmeler",
  },
  changes: {
    title: "Neler değişti",
    nightly: "Nightly'de",
    version: "Sürüm {version}",
    since: "{version} sürümünden beri, henüz bir Stable sürümde değil",
    added: "Eklendi",
    changed: "Değişti",
    fixed: "Düzeltildi",
    whole: "Değişiklik günlüğünün tamamı",
  },
  gallery: {
    eyebrow: "Ekran görüntüleri",
    title: "Uygulama olduğu gibi",
    which: "Hangi ekran görüntüleri",
    desktop: "Masaüstü",
    android: "Android",
    open: "Aç: {caption}",
    dialog: "Ekran görüntüsü {n} / {total}: {caption}",
    previous: "Önceki ekran görüntüsü",
    next: "Sonraki ekran görüntüsü",
    close: "Kapat",
  },
  join: {
    title: "Dene, sonra nasıl geçtiğini anlat",
    body: "Karasu, katılan herkesle birlikte tek bir bakımcı tarafından geliştirilir. Bir hata raporu, bir fikir ya da bir şeyin senin makinende çalıştığını bildiren bir not yardımcı olur; özellikle Linux ve Android'de.",
    discord: "Discord'a katıl",
    bug: "Hata bildir",
    source: "GitHub'da kaynak kod",
  },
  faq: {
    eyebrow: "SSS",
    title: "Koddan yanıtlanan sorular.",
    items: {
      what: {
        q: "Karasu nedir?",
        a: "AniList anime ve manga listeni tutan bir masaüstü ve Android uygulaması. Ne oynattığını ya da okuduğunu fark eder ve ilerlemeni AniList'te kendiliğinden günceller; adını vermediği bir siteden gelen bir bölüm için önce bir kez sorar, ayrıca bu listeye istatistikler, bildirimler ve sosyal sayfalarla hızlı bir yerel arayüz kazandırır.",
      },
      free: {
        q: "Ücretsiz mi?",
        a: "Evet. Karasu ücretsizdir ve GNU AGPL-3.0 ya da daha sonraki herhangi bir sürümü altında yayımlanır. Ücretli bir katman yok ve açılacak bir şey yok.",
      },
      open: {
        q: "Açık kaynak mı?",
        a: "Evet. Kaynağın tamamı GitHub'da ve her sürüm orada etiketli bir commit'ten derlenir.",
      },
      anilist: {
        q: "AniList nedir?",
        a: "anilist.co adresinde ücretsiz bir anime ve manga veritabanı ve takip sitesi. Listen orada durur; Karasu onu AniList'in herkese açık API'si üzerinden okur ve yazar.",
      },
      replace: {
        q: "Karasu AniList'in yerini alıyor mu?",
        a: "Hayır. O, AniList için bir istemcidir. Listen AniList'te kalır ve Karasu'nun yaptığı her değişiklik bir an sonra web sitesinde görünür. Karasu'yu hesap olmadan, yalnızca yerel bir listeyle de kullanabilirsin.",
      },
      platforms: {
        q: "Hangi platformlar destekleniyor?",
        a: "Windows ve Android Stable, Linux deneysel bir AppImage ve macOS derlemesi yok. Windows'ta tüm özellikler var. Android'de liste, istatistikler, bildirimler, widget'lar, sosyal sayfalar ve kendi güncelleyicisi var; ama yerel kitaplık ve sistem tepsisi yok. Algılama farklıdır: Windows medya oturumlarını, oynatıcı ve tarayıcı pencerelerini, mpv'yi ve Jellyfin'i okur; Linux medya oturumlarını, mpv'yi ve Jellyfin'i okur, pencere başlıklarını okumaz; Android Jellyfin'i okur.",
      },
      credentials: {
        q: "Karasu AniList kimlik bilgilerimi saklıyor mu?",
        a: "Parolanı asla görmez. Oturum açma tarayıcında anilist.co üzerinde olur ve tarayıcı Karasu'ya bir token verir. Bu token masaüstünde işletim sisteminin kimlik bilgisi deposunda, taşınabilir modda uygulamanın yanındaki şifreli bir dosyada, Android'de ise Keystore ile mühürlenmiş bir dosyada tutulur — ve uygulamanın web görünümüne asla geri verilmez.",
      },
      offline: {
        q: "Karasu çevrimdışı çalışabilir mi?",
        a: "Listen yerel olarak önbelleğe alınır, bu yüzden ağ olmadan açılır, listendeki bir başlık önbellekteki sayfasını çalışan bir +1 ile gösterir ve düzenlemeler sıraya alınıp bağlantı döndüğünde gönderilir. Listende olmayan başlıklara göz atmak, arama ve sosyal sayfalar ağ gerektirir.",
      },
      automatic: {
        q: "AniList ilerlememi otomatik olarak güncelliyor mu?",
        a: "Evet; varsayılan olarak bir bölüm uzunluğunun üçte ikisi kadar oynatıldığında — ya da belirlediğin dakika kadar sonra, ya da sorulmasını tercih ediyorsan bir bildirimi onayladıktan sonra. Karasu'nun adını vermediği bir siteden gelen bir bölüm her zaman önce sorar. İlerleme yalnızca ileri gider ve Karasu yazmadan hemen önce listeni yeniden okur.",
      },
      affiliated: {
        q: "Karasu AniList ile bağlantılı mı?",
        a: "Hayır. AniList'in herkese açık API'sini kayıtlı bir client id ile ve özel bir erişim olmadan kullanan bağımsız bir projedir.",
      },
      smartscreen: {
        q: "Kurarken Windows neden uyarıyor?",
        a: "Yükleyici kod imzalı değildir, bu yüzden SmartScreen onu daha önce hiç görmemiştir ve bunu söyler. Her sürümle birlikte, indirdiğin dosyayı denetleyebileceğin bir SHA256SUMS.txt gelir.",
      },
      network: {
        q: "Karasu kimlerle konuşuyor?",
        a: "AniList'in API'si ve görsel sunucularıyla; güncelleme denetimi ve indirme için GitHub'la; topluluğun GitHub'daki bölüm ilişkileri verisiyle, en fazla haftada bir; kurduysan kendi Jellyfin sunucunla; etkinleştirirsen Rich Presence için Discord'un yerel soketiyle. AniList kullanıcı biyografilerindeki görseller Karasu'nun kendi sınırlı proxy'si üzerinden alınır, bu yüzden bir profil açtığında o sunucular IP adresini öğrenir. Başka hiçbir şey yok ve analitik yok.",
      },
    },
  },
  footer: {
    tagline: "Modern bir anime ve manga takipçisi — yalnızca AniList için geliştirildi.",
    badge: "Açık kaynak · ücretsiz",
    project: "Proje",
    github: "GitHub",
    download: "İndir",
    changelog: "Değişiklik günlüğü",
    nightly: "Nightly derlemeleri",
    help: "Yardım",
    docs: "Belgeler",
    issue: "Sorun bildir",
    feature: "Özellik iste",
    discord: "Discord",
    elsewhere: "Başka yerlerde",
    anilist: "AniList",
    security: "Güvenlik politikası",
    contributing: "Katkıda bulunma",
    license: "AGPL-3.0 lisansı",
    copyright: "AGPL-3.0 lisanslı · © 2026 Kyu ve Karasu katkıda bulunanları",
    disclaimer:
      "Karasu bağımsız bir projedir; AniList ile bağlantılı değildir ve AniList tarafından onaylanmamıştır. SN Pro, SIL Open Font License 1.1 kapsamında kullanılmaktadır.",
    language: "Dil",
    aiNote: "İngilizce ve Almanca dışındaki her dil, hiçbir insanın gözden geçirmediği bir yapay zekâ çevirisidir.",
  },
  notFound: {
    title: "Burada kimse tünemedi.",
    body: "Aradığın sayfa yok. Sitenin tamamı tek bir sayfa ve bu o değil.",
    back: "Karasu'ya dön",
  },
  shots: {
    "anime-grid": {
      alt: "Kapak ızgarası olarak anime listesi; yanında durumlar ve özel listelerin bulunduğu bir sütun, üstünde arama, sıralama, filtreler ve hazır ayarlar.",
      caption: "Anime listesi, ızgara görünümü",
    },
    overview: {
      alt: "Genel Bakış: bir sezon afişinin üzerinde arama ve sonraki 48 saatle birlikte bir karşılama, raflar olarak listeler, yetişilecek yayındaki başlıklar ve istatistikler ile kendi etkinliğini içeren bir sütun.",
      caption: "Genel Bakış — listelerin, hafta, yetişilecekler",
    },
    "now-playing": {
      alt: "Anime listesinin üzerinde süzülen Şimdi Oynatılıyor penceresi: mpv'de algılanan Mushoku Tensei'nin üçüncü sezonu, sezon 3 bölüm 9, yazacağı ilerlemeyle birlikte.",
      caption: "Şimdi Oynatılıyor — mpv'de algılanan bir bölüm",
    },
    seasonal: {
      alt: "Sezonluk sayfası: 2026 Sonbaharı başlıkları türleri ve geri sayımıyla kartlar olarak, yanlarında yıl, sezon ve biçimlerin bulunduğu bir sütun.",
      caption: "Sezonluk",
    },
    calendar: {
      alt: "Takvimin gündemi: haftanın bugünden itibaren yayınlanan bölümleri, her biri kapağı, saati ve bölüm numarasıyla bir kartta.",
      caption: "Takvim",
    },
    "stats-overview": {
      alt: "İstatistikler sayfasının genel görünümü: listenin toplamları, durumlar ve biçimlerden oluşan bir halka, menşe ülkeler, izleme süresinin nereye gittiği ve dizi uzunlukları.",
      caption: "İstatistikler — genel bakış",
    },
    franchise: {
      alt: "Mushoku Tensei'nin seri grafiği: üçüncü sezon, önceki sezonlara, hafif romana ve yan hikâye mangasına bağlı; yanda seçili başlığın kartı.",
      caption: "Seri grafiği",
    },
    "phone-overview": {
      alt: "Telefonda Genel Bakış: bir sezon afişinin üzerinde arama içeren bir karşılama ve raflar olarak listeler, alt çubuğun üzerinde.",
      caption: "Android — genel bakış",
    },
    "phone-list": {
      alt: "Telefonda üç sütunlu kapak ızgarası olarak anime listesi; üstünde durum seçici ve listenin araması.",
      caption: "Android — anime listesi",
    },
    "phone-detail": {
      alt: "Telefonda Mushoku Tensei'nin ayrıntı sayfası, durum sayfası açık: topluluğun kendi puan dağılımının üzerinde durum, ilerleme ve puan.",
      caption: "Android — bir başlık, girdisi açık",
    },
    "phone-search": {
      alt: "Telefonda arama sayfası; “season 2” sonuçları kapak ızgarası olarak.",
      caption: "Android — arama",
    },
  },
} satisfies Messages;
