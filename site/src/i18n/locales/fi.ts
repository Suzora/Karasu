import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Moderni anime- ja mangaseuranta AniListille",
    description:
      "Karasu on ilmainen avoimen lähdekoodin anime- ja mangaseuranta, joka on tehty pelkästään AniListille. Se huomaa, mitä toistat — ja Windowsissa myös mitä luet — ja pitää AniList-edistymisesi ajan tasalla. Windows, Linux ja Android.",
    notFoundTitle: "Sivua ei löytynyt — Karasu",
  },
  skip: "Siirry sisältöön",
  nav: {
    label: "Päävalikko",
    home: "Karasu — takaisin ylös",
    changes: "Mikä on uutta",
    screenshots: "Kuvakaappaukset",
    join: "Osallistu",
    faq: "UKK",
    github: "GitHub",
    download: "Lataa",
    downloadKarasu: "Lataa Karasu",
    openMenu: "Avaa valikko",
    closeMenu: "Sulje valikko",
  },
  hero: {
    eyebrow: "Ilmainen · avoin lähdekoodi · AniListille",
    title: "AniList-asiakas, joka kirjaa jaksosi puolestasi",
    lede: "Listasi, kausi, esityskalenteri, tilastot, syöte ja foorumi yhdessä nopeassa ikkunassa — sekä tunnistus, joka päivittää listasi, kun jakso päättyy.",
    windows: "Lataa Windowsille",
    linux: "Linux",
    android: "Android",
    note: "Versio {version}. Windowsin asennusohjelmaa ei ole allekirjoitettu, joten SmartScreen saattaa varoittaa ensimmäisellä käynnistyskerralla · Linux on kokeellinen AppImage · Android on sivulatattava APK · ei macOS:ää",
    checksums: "tarkistussummat",
    everyDownload: "kaikki lataukset",
  },
  changes: {
    title: "Mikä on uutta",
    nightly: "Nightlyssa",
    version: "Versio {version}",
    since: "Versiosta {version} lähtien, ei vielä missään Stable-julkaisussa",
    added: "Lisätty",
    changed: "Muutettu",
    fixed: "Korjattu",
    whole: "Koko muutoshistoria",
  },
  gallery: {
    eyebrow: "Kuvakaappaukset",
    title: "Sovellus sellaisenaan",
    which: "Mitkä kuvakaappaukset",
    desktop: "Työpöytä",
    android: "Android",
    open: "Avaa: {caption}",
    dialog: "Kuvakaappaus {n} / {total}: {caption}",
    previous: "Edellinen kuvakaappaus",
    next: "Seuraava kuvakaappaus",
    close: "Sulje",
  },
  join: {
    title: "Kokeile sitä ja kerro, miten meni",
    body: "Karasua rakentaa yksi ylläpitäjä yhdessä kaikkien mukaan tulevien kanssa. Virheilmoitus, idea tai viesti siitä, että jokin toimii koneellasi, auttaa — erityisesti Linuxilla ja Androidilla.",
    discord: "Liity Discordiin",
    bug: "Ilmoita virheestä",
    source: "Lähdekoodi GitHubissa",
  },
  faq: {
    eyebrow: "UKK",
    title: "Kysymyksiä, joihin vastataan koodista.",
    items: {
      what: {
        q: "Mikä Karasu on?",
        a: "Työpöytä- ja Android-sovellus, joka hoitaa AniList-anime- ja mangalistaasi. Se huomaa, mitä toistat tai luet, ja päivittää edistymisesi AniListiin itse — kysyen ensin kerran, jos kyse on luvusta sivustolta, jota se ei tunne nimeltä — ja antaa listalle nopean paikallisen käyttöliittymän, jossa on tilastot, ilmoitukset ja sosiaaliset sivut.",
      },
      free: {
        q: "Onko se ilmainen?",
        a: "Kyllä. Karasu on maksuton ja julkaistu GNU AGPL-3.0 -lisenssillä tai sen myöhemmällä versiolla. Maksullista tasoa ei ole, eikä mitään tarvitse avata.",
      },
      open: {
        q: "Onko se avointa lähdekoodia?",
        a: "Kyllä. Koko lähdekoodi on GitHubissa, ja jokainen julkaisu rakennetaan siellä merkitystä commitista.",
      },
      anilist: {
        q: "Mikä AniList on?",
        a: "Ilmainen anime- ja mangatietokanta ja seurantasivusto osoitteessa anilist.co. Listasi on siellä; Karasu lukee sen ja kirjoittaa siihen AniListin julkisen rajapinnan kautta.",
      },
      replace: {
        q: "Korvaako Karasu AniListin?",
        a: "Ei. Se on asiakasohjelma AniListille. Listasi pysyy AniListissä, ja jokainen Karasun tekemä muutos näkyy verkkosivustolla hetkeä myöhemmin. Voit käyttää Karasua myös ilman tiliä, pelkällä paikallisella listalla.",
      },
      platforms: {
        q: "Mitä alustoja tuetaan?",
        a: "Windows ja Android ovat Stable, Linux on kokeellinen AppImage, eikä macOS:lle ole versiota. Windowsissa on kaikki ominaisuudet. Androidissa on lista, tilastot, ilmoitukset, widgetit, sosiaaliset sivut ja oma päivittäjä, mutta ei paikallista kirjastoa eikä ilmoitusalueen kuvaketta. Tunnistus vaihtelee: Windows lukee mediaistunnot, soitin- ja selainikkunat, mpv:n ja Jellyfinin; Linux lukee mediaistunnot, mpv:n ja Jellyfinin, mutta ei ikkunoiden otsikoita; Android lukee Jellyfinin.",
      },
      credentials: {
        q: "Tallentaako Karasu AniList-tunnukseni?",
        a: "Se ei koskaan näe salasanaasi. Kirjautuminen tapahtuu anilist.co:ssa selaimessasi, joka antaa Karasulle tunnuksen. Tämä tunnus säilytetään työpöydällä käyttöjärjestelmän tunnistetietovarastossa, kannettavassa tilassa salattuna tiedostona sovelluksen vieressä ja Androidilla Keystorella sinetöidyssä tiedostossa — eikä sitä koskaan anneta takaisin sovelluksen verkkonäkymälle.",
      },
      offline: {
        q: "Toimiiko Karasu ilman verkkoyhteyttä?",
        a: "Listasi tallennetaan välimuistiin paikallisesti, joten se aukeaa ilman verkkoa, sillä oleva nimike näyttää välimuistissa olevan sivunsa toimivalla +1:llä, ja muutokset jonotetaan ja lähetetään, kun yhteys palaa. Listallasi olemattomien nimikkeiden selaaminen, haku ja sosiaaliset sivut tarvitsevat verkon.",
      },
      automatic: {
        q: "Päivittääkö se AniList-edistymiseni automaattisesti?",
        a: "Kyllä, oletuksena kun jaksoa on toistettu kaksi kolmasosaa sen pituudesta — tai asettamasi minuuttimäärän ajan, tai kun olet vahvistanut ilmoituksen, jos haluat mieluummin tulla kysytyksi. Luku sivustolta, jota Karasu ei tunne nimeltä, kysyy aina ensin. Edistyminen etenee vain eteenpäin, ja Karasu lukee listasi uudelleen juuri ennen kirjoittamista.",
      },
      affiliated: {
        q: "Onko Karasu sidoksissa AniListiin?",
        a: "Ei. Se on riippumaton projekti, joka käyttää AniListin julkista rajapintaa rekisteröidyllä asiakastunnisteella ja ilman erityistä pääsyä.",
      },
      smartscreen: {
        q: "Miksi Windows varoittaa asennuksessa?",
        a: "Asennusohjelmaa ei ole allekirjoitettu, joten SmartScreen ei ole nähnyt sitä aiemmin ja kertoo siitä. Jokaisen julkaisun mukana tulee SHA256SUMS.txt, jota vasten voit tarkistaa latauksen.",
      },
      network: {
        q: "Kenen kanssa Karasu puhuu?",
        a: "AniListin rajapinnan ja kuvapalvelinten kanssa; GitHubin kanssa päivitystarkistusta ja latausta varten; yhteisön jaksosuhdetietojen kanssa GitHubissa, enintään kerran viikossa; oman Jellyfin-palvelimesi kanssa, jos otat sellaisen käyttöön; Discordin paikallisen socketin kanssa Rich Presencea varten, jos otat sen käyttöön. AniList-käyttäjien esittelyjen kuvat haetaan Karasun oman rajatun välityspalvelimen kautta, joten ne isännät saavat tietää IP-osoitteesi, kun avaat profiilin. Ei mitään muuta, eikä analytiikkaa.",
      },
    },
  },
  footer: {
    tagline: "Moderni anime- ja mangaseuranta — tehty pelkästään AniListille.",
    badge: "Avoin lähdekoodi · ilmainen",
    project: "Projekti",
    github: "GitHub",
    download: "Lataa",
    changelog: "Muutoshistoria",
    nightly: "Nightly-versiot",
    help: "Apua",
    docs: "Dokumentaatio",
    issue: "Ilmoita ongelmasta",
    feature: "Ehdota ominaisuutta",
    discord: "Discord",
    elsewhere: "Muualla",
    anilist: "AniList",
    security: "Tietoturvakäytäntö",
    contributing: "Osallistuminen",
    license: "AGPL-3.0-lisenssi",
    copyright: "AGPL-3.0-lisensoitu · © 2026 Kyu ja Karasun avustajat",
    disclaimer:
      "Karasu on riippumaton projekti, eikä se ole sidoksissa AniListiin tai AniListin hyväksymä. SN Pro on käytössä SIL Open Font License 1.1 -lisenssillä.",
    language: "Kieli",
    aiNote: "Kaikki muut kielet kuin englanti ja saksa ovat tekoälyn tekemiä käännöksiä, joita kukaan ihminen ei ole tarkistanut.",
  },
  notFound: {
    title: "Täällä ei istu ketään.",
    body: "Etsimääsi sivua ei ole olemassa. Koko sivusto on yksi sivu, eikä tämä ole se.",
    back: "Takaisin Karasuun",
  },
  shots: {
    "anime-grid": {
      alt: "Animelista kansiruudukkona, vieressä sarake tiloista ja omista listoista sekä yläpuolella haku, lajittelu, suodattimet ja esiasetukset.",
      caption: "Animelista, ruudukkonäkymä",
    },
    overview: {
      alt: "Yleisnäkymä: tervehdys, haku ja seuraavat 48 tuntia kauden bannerin päällä, listat hyllyinä, esitettävät nimikkeet joita voi ottaa kiinni sekä sarake tilastoineen ja omine aktiviteetteineen.",
      caption: "Yleisnäkymä — listasi, viikko, mitä voit ottaa kiinni",
    },
    "now-playing": {
      alt: "Nyt toistetaan -ikkuna leijuu animelistan päällä: Mushoku Tensein kolmas kausi tunnistettuna mpv:stä, kausi 3 jakso 9, sekä edistyminen, jonka se kirjaa.",
      caption: "Nyt toistetaan — jakso tunnistettu mpv:stä",
    },
    seasonal: {
      alt: "Kausisivu: syksyn 2026 nimikkeet korteilla genreineen ja lähtölaskentoineen, vieressä sarake vuodesta, kaudesta ja formaateista.",
      caption: "Kausi",
    },
    calendar: {
      alt: "Kalenterin esityslista: viikon esitettävät jaksot tästä päivästä alkaen, jokainen kortilla kansineen, kellonaikoineen ja jaksonumeroineen.",
      caption: "Kalenteri",
    },
    "stats-overview": {
      alt: "Tilastosivun yleisnäkymä: listan summat, tilojen ja formaattien rengas, alkuperämaat, mihin katseluaika meni ja sarjojen pituudet.",
      caption: "Tilastot — yleisnäkymä",
    },
    franchise: {
      alt: "Mushoku Tensein franchise-kaavio: kolmas kausi linkitettynä aiempiin kausiin, light noveliin ja sivutarinamangaan, vieressä valitun nimikkeen kortti.",
      caption: "Franchise-kaavio",
    },
    "phone-overview": {
      alt: "Yleisnäkymä puhelimella: tervehdys ja haku kauden bannerin päällä sekä listat hyllyinä alapalkin yläpuolella.",
      caption: "Android — yleisnäkymä",
    },
    "phone-list": {
      alt: "Animelista puhelimella kolmisarakkeisena kansiruudukkona, yläpuolella tilanvalitsin ja listan haku.",
      caption: "Android — animelista",
    },
    "phone-detail": {
      alt: "Mushoku Tensein tietosivu puhelimella tilalehti avoinna: tila, edistyminen ja arvosana yhteisön oman arvosanajakauman yläpuolella.",
      caption: "Android — nimike, merkintä avattuna",
    },
    "phone-search": {
      alt: "Hakusivu puhelimella, tuloksina haku ”season 2” kansiruudukkona.",
      caption: "Android — haku",
    },
  },
} satisfies Messages;
