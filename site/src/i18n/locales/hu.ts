import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Modern anime- és mangakövető az AniListhez",
    description:
      "A Karasu egy ingyenes, nyílt forráskódú anime- és mangakövető, amelyet kizárólag az AniListhez készítettek. Észreveszi, mit játszol le — Windowson azt is, mit olvasol —, és naprakészen tartja az AniList-haladásodat. Windows, Linux és Android.",
    notFoundTitle: "Az oldal nem található — Karasu",
  },
  skip: "Ugrás a tartalomra",
  nav: {
    label: "Főmenü",
    home: "Karasu — vissza a tetejére",
    changes: "Újdonságok",
    screenshots: "Képernyőképek",
    join: "Csatlakozz",
    faq: "GYIK",
    github: "GitHub",
    download: "Letöltés",
    downloadKarasu: "Karasu letöltése",
    openMenu: "Menü megnyitása",
    closeMenu: "Menü bezárása",
  },
  hero: {
    eyebrow: "Ingyenes · nyílt forráskódú · az AniListhez",
    title: "Az AniList-kliens, amely helyetted vezeti be az epizódokat",
    lede: "A listáid, az évad, a sugárzási naptár, a statisztikák, a hírfolyam és a fórum egyetlen gyors ablakban — és egy felismerés, amely frissíti a listádat, amikor véget ér egy epizód.",
    windows: "Letöltés Windowsra",
    linux: "Linux",
    android: "Android",
    note: "{version} verzió. A Windows-telepítő nincs kódaláírva, ezért a SmartScreen figyelmeztethet az első indításkor · a Linux egy kísérleti AppImage · az Android egy kézzel telepíthető APK · macOS nincs",
    checksums: "ellenőrző összegek",
    everyDownload: "minden letöltés",
  },
  changes: {
    title: "Újdonságok",
    nightly: "A Nightlyban",
    version: "{version} verzió",
    since: "{version} óta, még egyetlen Stable kiadásban sincs benne",
    added: "Hozzáadva",
    changed: "Módosítva",
    fixed: "Javítva",
    whole: "A teljes változásnapló",
  },
  gallery: {
    eyebrow: "Képernyőképek",
    title: "Az alkalmazás, ahogy van",
    which: "Melyik képernyőképek",
    desktop: "Asztali",
    android: "Android",
    open: "Megnyitás: {caption}",
    dialog: "{n}. képernyőkép, összesen {total}: {caption}",
    previous: "Előző képernyőkép",
    next: "Következő képernyőkép",
    close: "Bezárás",
  },
  join: {
    title: "Próbáld ki, és mondd el, hogyan ment",
    body: "A Karasut egyetlen karbantartó építi mindazokkal együtt, akik csatlakoznak. Egy hibajelentés, egy ötlet vagy egy üzenet arról, hogy valami működik a gépeden, sokat segít — főleg Linuxon és Androidon.",
    discord: "Csatlakozás a Discordhoz",
    bug: "Hiba jelentése",
    source: "Forráskód a GitHubon",
  },
  faq: {
    eyebrow: "GYIK",
    title: "Kérdések, a kódból megválaszolva.",
    items: {
      what: {
        q: "Mi a Karasu?",
        a: "Egy asztali és Android-alkalmazás, amely az AniList-es anime- és mangalistádat vezeti. Észreveszi, mit játszol le vagy olvasol, és magától frissíti a haladásodat az AniListen — egy általa név szerint nem ismert oldalról származó fejezetnél előbb egyszer rákérdez —, és gyors helyi felületet ad ennek a listának statisztikákkal, értesítésekkel és a közösségi oldalakkal.",
      },
      free: {
        q: "Ingyenes?",
        a: "Igen. A Karasu ingyenes, és a GNU AGPL-3.0 vagy bármely későbbi verziója alatt jelenik meg. Nincs fizetős szint, és nincs mit feloldani.",
      },
      open: {
        q: "Nyílt forráskódú?",
        a: "Igen. A teljes forráskód a GitHubon van, és minden kiadás ott készül egy megcímkézett commitból.",
      },
      anilist: {
        q: "Mi az az AniList?",
        a: "Egy ingyenes anime- és mangaadatbázis és követőoldal az anilist.co címen. A listád ott van; a Karasu az AniList nyilvános API-ján át olvassa és írja.",
      },
      replace: {
        q: "A Karasu leváltja az AniListet?",
        a: "Nem. Egy kliens hozzá. A listád az AniListen marad, és minden változtatás, amit a Karasu végez, egy pillanattal később látható a weboldalon. A Karasut fiók nélkül, csak helyi listával is használhatod.",
      },
      platforms: {
        q: "Mely platformok támogatottak?",
        a: "A Windows és az Android Stable, a Linux egy kísérleti AppImage, macOS-buildje pedig nincs. A Windowson minden funkció megvan. Az Androidon megvan a lista, a statisztikák, az értesítések, a widgetek, a közösségi oldalak és a saját frissítője, de nincs helyi könyvtár és nincs tálcaikon. A felismerés eltér: a Windows médiamunkameneteket, lejátszó- és böngészőablakokat, mpv-t és Jellyfint olvas; a Linux médiamunkameneteket, mpv-t és Jellyfint olvas, ablakcímek nélkül; az Android Jellyfint olvas.",
      },
      credentials: {
        q: "Tárolja a Karasu az AniList-hitelesítő adataimat?",
        a: "A jelszavadat soha nem látja. A bejelentkezés az anilist.co oldalon történik a böngésződben, amely egy tokent ad át a Karasunak. Ezt a tokent asztali gépen az operációs rendszer hitelesítőadat-tárolója őrzi, hordozható módban egy titkosított fájl az alkalmazás mellett, Androidon pedig egy Keystore-ral lezárt fájl — és soha nem adják vissza az alkalmazás webes nézetének.",
      },
      offline: {
        q: "Működik a Karasu offline?",
        a: "A listád helyben gyorsítótárazott, így hálózat nélkül is megnyílik, egy rajta lévő cím a mentett oldalát mutatja működő +1-gyel, a módosítások pedig sorba kerülnek, és a kapcsolat visszatértekor elküldődnek. A listádon nem szereplő címek böngészése, a keresés és a közösségi oldalak hálózatot igényelnek.",
      },
      automatic: {
        q: "Automatikusan frissíti az AniList-haladásomat?",
        a: "Igen, alapértelmezés szerint akkor, ha egy epizód a hosszának két harmadáig lejátszódott — vagy az általad beállított percig, vagy egy értesítés megerősítése után, ha inkább kérdezzen rá. Egy olyan oldalról származó fejezetnél, amelyet a Karasu név szerint nem ismer, mindig előbb rákérdez. A haladás csak előre mozog, és a Karasu közvetlenül írás előtt újraolvassa a listádat.",
      },
      affiliated: {
        q: "Kapcsolatban áll a Karasu az AniListtel?",
        a: "Nem. Független projekt, amely az AniList nyilvános API-ját használja, regisztrált kliensazonosítóval és különleges hozzáférés nélkül.",
      },
      smartscreen: {
        q: "Miért figyelmeztet a Windows a telepítéskor?",
        a: "A telepítő nincs kódaláírva, ezért a SmartScreen még sosem látta, és ezt közli. Minden kiadás tartalmaz egy SHA256SUMS.txt fájlt, amellyel ellenőrizheted a letöltést.",
      },
      network: {
        q: "Kivel kommunikál a Karasu?",
        a: "Az AniList API-jával és képszervereivel; a GitHubbal a frissítés-ellenőrzéshez és a letöltéshez; a közösség epizódkapcsolati adataival a GitHubon, legfeljebb hetente egyszer; a saját Jellyfin-szerveroddal, ha beállítasz egyet; a Discord helyi socketjével a Rich Presence-hez, ha bekapcsolod. Az AniList-felhasználók bemutatkozásaiban lévő képeket a Karasu saját, korlátozott proxyján át tölti le, így ezek a kiszolgálók megtudják az IP-címedet, amikor megnyitsz egy profilt. Semmi mást, és nincs analitika.",
      },
    },
  },
  footer: {
    tagline: "Modern anime- és mangakövető — kizárólag az AniListhez építve.",
    badge: "Nyílt forráskódú · ingyenes",
    project: "Projekt",
    github: "GitHub",
    download: "Letöltés",
    changelog: "Változásnapló",
    nightly: "Nightly buildek",
    help: "Súgó",
    docs: "Dokumentáció",
    issue: "Hiba bejelentése",
    feature: "Funkció javaslata",
    discord: "Discord",
    elsewhere: "Máshol",
    anilist: "AniList",
    security: "Biztonsági irányelv",
    contributing: "Közreműködés",
    license: "AGPL-3.0 licenc",
    copyright: "AGPL-3.0 licenc alatt · © 2026 Kyu és a Karasu közreműködői",
    disclaimer:
      "A Karasu független projekt, nem áll kapcsolatban az AniListtel, és az AniList sem támogatja. Az SN Pro betűtípust a SIL Open Font License 1.1 alapján használjuk.",
    language: "Nyelv",
    aiNote: "Az angolon és a németen kívül minden nyelv MI-fordítás, amelyet nem ellenőrzött ember.",
  },
  notFound: {
    title: "Itt senki sem ücsörög.",
    body: "A keresett oldal nem létezik. Az egész weboldal egyetlen oldal, és ez nem az.",
    back: "Vissza a Karasuhoz",
  },
  shots: {
    "anime-grid": {
      alt: "Az animelista borítórácsként, mellette az állapotok és az egyéni listák oszlopa, fölötte a keresés, a rendezés, a szűrők és az előbeállítások.",
      caption: "Animelista, rácsnézet",
    },
    overview: {
      alt: "Az Áttekintés: egy üdvözlés keresővel és a következő 48 órával egy évad bannere fölött, a listák polcokként, a pótolható, éppen futó címek, valamint egy oszlop a statisztikákkal és a saját tevékenységeddel.",
      caption: "Áttekintés — a listáid, a hét, mit pótolhatsz",
    },
    "now-playing": {
      alt: "A Most játszik ablak az animelista fölött lebeg: a Mushoku Tensei harmadik évada felismerve az mpv-ben, 3. évad 9. rész, azzal a haladással, amelyet rögzíteni fog.",
      caption: "Most játszik — egy epizód felismerve az mpv-ben",
    },
    seasonal: {
      alt: "Az évad oldala: a 2026 őszi címek kártyákon műfajaikkal és visszaszámlálással, mellettük egy oszlop az évvel, az évaddal és a formátumokkal.",
      caption: "Évad",
    },
    calendar: {
      alt: "A naptár napirendje: a hét sugárzott epizódjai mától, mindegyik egy kártyán borítóval, idővel és epizódszámmal.",
      caption: "Naptár",
    },
    "stats-overview": {
      alt: "A statisztikaoldal áttekintése: a lista összesítései, az állapotok és formátumok gyűrűje, a származási országok, hová ment a nézési idő, és a sorozatok hossza.",
      caption: "Statisztikák — áttekintés",
    },
    franchise: {
      alt: "A Mushoku Tensei franchise-gráfja: a harmadik évad összekötve a korábbi évadokkal, a light novellel és egy spin-off mangával, oldalt a kiválasztott cím kártyájával.",
      caption: "Franchise-gráf",
    },
    "phone-overview": {
      alt: "Az Áttekintés telefonon: egy üdvözlés keresővel egy évad bannere fölött, és a listák polcokként, az alsó sáv fölött.",
      caption: "Android — áttekintés",
    },
    "phone-list": {
      alt: "Az animelista telefonon háromoszlopos borítórácsként, fölötte az állapotválasztó és a lista keresője.",
      caption: "Android — animelista",
    },
    "phone-detail": {
      alt: "A Mushoku Tensei részletoldala telefonon nyitott állapotlappal: az állapot, a haladás és a pontszám a közösség saját pontszám-eloszlása fölött.",
      caption: "Android — egy cím, megnyitott bejegyzéssel",
    },
    "phone-search": {
      alt: "A keresőoldal telefonon a „season 2” találataival borítórácsként.",
      caption: "Android — keresés",
    },
  },
} satisfies Messages;
