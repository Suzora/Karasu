import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — AniList를 위한 현대적인 애니·만화 트래커",
    description:
      "Karasu는 AniList 전용으로 만든 무료 오픈 소스 애니·만화 트래커입니다. 재생 중인 작품을 감지하고, Windows에서는 읽고 있는 작품까지 감지해 AniList 진행 상황을 항상 최신으로 유지합니다. Windows, Linux, Android를 지원합니다.",
    notFoundTitle: "페이지를 찾을 수 없습니다 — Karasu",
  },
  skip: "본문으로 건너뛰기",
  nav: {
    label: "기본 내비게이션",
    home: "Karasu — 맨 위로",
    changes: "변경 사항",
    screenshots: "스크린샷",
    join: "참여하기",
    faq: "FAQ",
    github: "GitHub",
    download: "다운로드",
    downloadKarasu: "Karasu 다운로드",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
  },
  hero: {
    eyebrow: "무료 · 오픈 소스 · AniList 전용",
    title: "에피소드 기록을 대신 해 주는 AniList 클라이언트",
    lede: "목록, 시즌, 방영 캘린더, 통계, 피드, 포럼을 하나의 빠른 창에 담았고, 에피소드가 끝나면 목록을 최신 상태로 맞춰 주는 감지 기능이 있습니다.",
    windows: "Windows용 다운로드",
    linux: "Linux",
    android: "Android",
    note: "버전 {version}. Windows 설치 프로그램은 코드 서명이 되어 있지 않아 처음 실행할 때 SmartScreen이 경고할 수 있습니다 · Linux는 실험적인 AppImage입니다 · Android는 직접 설치하는 APK입니다 · macOS는 지원하지 않습니다",
    checksums: "체크섬",
    everyDownload: "모든 다운로드",
  },
  changes: {
    title: "변경 사항",
    nightly: "Nightly",
    version: "버전 {version}",
    since: "{version} 이후, 아직 Stable 릴리스에는 포함되지 않음",
    added: "추가됨",
    changed: "변경됨",
    fixed: "수정됨",
    whole: "전체 변경 내역",
  },
  gallery: {
    eyebrow: "스크린샷",
    title: "있는 그대로의 앱",
    which: "스크린샷 선택",
    desktop: "데스크톱",
    android: "Android",
    open: "열기: {caption}",
    dialog: "스크린샷 {n}/{total}: {caption}",
    previous: "이전 스크린샷",
    next: "다음 스크린샷",
    close: "닫기",
  },
  join: {
    title: "써 보시고 어땠는지 알려 주세요",
    body: "Karasu는 한 명의 메인테이너와 함께해 주시는 분들이 만들고 있습니다. 버그 신고, 아이디어, 혹은 내 컴퓨터에서 잘 돌아간다는 한마디가 큰 도움이 됩니다. 특히 Linux와 Android에서요.",
    discord: "Discord 참여하기",
    bug: "버그 신고",
    source: "GitHub의 소스 코드",
  },
  faq: {
    eyebrow: "FAQ",
    title: "코드를 근거로 답합니다.",
    items: {
      what: {
        q: "Karasu는 무엇인가요?",
        a: "AniList의 애니·만화 목록을 관리하는 데스크톱 및 Android 앱입니다. 재생하거나 읽고 있는 작품을 감지해 AniList 진행 상황을 자동으로 업데이트하며, 이름을 알지 못하는 사이트의 챕터는 처음에 한 번 먼저 물어봅니다. 또한 그 목록에 통계, 알림, 소셜 페이지를 갖춘 빠른 로컬 인터페이스를 제공합니다.",
      },
      free: {
        q: "무료인가요?",
        a: "네. Karasu는 무료이며 GNU AGPL-3.0 또는 그 이후 버전으로 공개되어 있습니다. 유료 요금제도, 잠금 해제할 기능도 없습니다.",
      },
      open: {
        q: "오픈 소스인가요?",
        a: "네. 전체 소스가 GitHub에 있으며, 모든 릴리스는 태그가 붙은 커밋에서 GitHub 상에서 빌드됩니다.",
      },
      anilist: {
        q: "AniList가 무엇인가요?",
        a: "anilist.co에 있는 무료 애니·만화 데이터베이스 겸 트래킹 사이트입니다. 내 목록은 그곳에 있고, Karasu는 AniList의 공개 API로 목록을 읽고 씁니다.",
      },
      replace: {
        q: "Karasu가 AniList를 대체하나요?",
        a: "아니요. AniList를 위한 클라이언트입니다. 목록은 AniList에 그대로 있고, Karasu가 한 모든 변경은 잠시 후 웹사이트에서도 보입니다. 계정 없이 로컬 목록만으로 Karasu를 쓸 수도 있습니다.",
      },
      platforms: {
        q: "어떤 플랫폼을 지원하나요?",
        a: "Windows와 Android는 Stable, Linux는 실험적인 AppImage이며 macOS 빌드는 없습니다. 모든 기능을 쓸 수 있는 것은 Windows입니다. Android에는 목록, 통계, 알림, 위젯, 소셜 페이지, 자체 업데이터가 있지만 로컬 라이브러리와 트레이는 없습니다. 감지 방식도 다릅니다. Windows는 미디어 세션, 플레이어 및 브라우저 창, mpv, Jellyfin을 읽고, Linux는 미디어 세션, mpv, Jellyfin을 읽지만 창 제목은 읽지 않으며, Android는 Jellyfin을 읽습니다.",
      },
      credentials: {
        q: "Karasu가 내 AniList 자격 증명을 저장하나요?",
        a: "비밀번호는 절대 보지 않습니다. 로그인은 브라우저의 anilist.co에서 이루어지고, 그곳에서 Karasu에 토큰을 넘겨줍니다. 이 토큰은 데스크톱에서는 운영 체제의 자격 증명 저장소에, 포터블 모드에서는 앱 옆의 암호화된 파일에, Android에서는 Keystore로 봉인된 파일에 보관되며, 앱의 웹 뷰로 다시 전달되는 일은 없습니다.",
      },
      offline: {
        q: "Karasu는 오프라인에서도 쓸 수 있나요?",
        a: "목록이 로컬에 캐시되므로 네트워크 없이도 열립니다. 목록에 있는 작품은 캐시된 페이지가 표시되고 +1도 동작하며, 편집 내용은 대기열에 쌓였다가 연결이 돌아오면 전송됩니다. 목록에 없는 작품 둘러보기, 검색, 소셜 페이지는 네트워크가 필요합니다.",
      },
      automatic: {
        q: "AniList 진행 상황을 자동으로 업데이트하나요?",
        a: "네. 기본값은 에피소드 길이의 3분의 2만큼 재생되었을 때이며, 직접 정한 시간(분)이 지났을 때나, 확인받는 쪽을 선호하신다면 토스트를 승인한 뒤에 업데이트하도록 바꿀 수 있습니다. Karasu가 이름을 알지 못하는 사이트의 챕터는 항상 먼저 물어봅니다. 진행 상황은 앞으로만 나아가며, Karasu는 기록하기 직전에 목록을 다시 읽습니다.",
      },
      affiliated: {
        q: "Karasu는 AniList와 관련이 있나요?",
        a: "아니요. AniList의 공개 API를 사용하는 독립 프로젝트이며, 등록된 클라이언트 ID를 쓸 뿐 특별한 접근 권한은 없습니다.",
      },
      smartscreen: {
        q: "설치할 때 Windows가 경고하는 이유가 무엇인가요?",
        a: "설치 프로그램에 코드 서명이 없어 SmartScreen이 처음 보는 파일이라고 알려 주는 것입니다. 모든 릴리스에는 SHA256SUMS.txt가 들어 있어 다운로드한 파일을 대조해 볼 수 있습니다.",
      },
      network: {
        q: "Karasu는 어디와 통신하나요?",
        a: "AniList의 API 및 이미지 서버, 업데이트 확인과 다운로드를 위한 GitHub, GitHub에 있는 커뮤니티의 에피소드 관계 데이터(최대 주 1회), 직접 설정한 경우 내 Jellyfin 서버, 켜 둔 경우 Rich Presence를 위한 Discord의 로컬 소켓입니다. AniList 사용자 소개글의 이미지는 Karasu 자체의 제한된 프록시를 통해 가져오므로, 프로필을 열면 해당 호스트가 내 IP 주소를 알게 됩니다. 그 밖에는 통신하지 않으며 분석 도구도 없습니다.",
      },
    },
  },
  footer: {
    tagline: "현대적인 애니·만화 트래커 — AniList 전용으로 만들었습니다.",
    badge: "오픈 소스 · 무료",
    project: "프로젝트",
    github: "GitHub",
    download: "다운로드",
    changelog: "변경 내역",
    nightly: "Nightly 빌드",
    help: "도움말",
    docs: "문서",
    issue: "문제 신고",
    feature: "기능 요청",
    discord: "Discord",
    elsewhere: "다른 곳",
    anilist: "AniList",
    security: "보안 정책",
    contributing: "기여하기",
    license: "AGPL-3.0 라이선스",
    copyright: "AGPL-3.0 라이선스 · © 2026 Kyu and Karasu contributors",
    disclaimer:
      "Karasu는 독립 프로젝트이며 AniList와 제휴하거나 AniList의 보증을 받지 않았습니다. SN Pro는 SIL Open Font License 1.1에 따라 사용합니다.",
    language: "언어",
    aiNote: "영어와 독일어를 제외한 모든 언어는 AI 번역이며, 사람이 검토하지 않았습니다.",
  },
  notFound: {
    title: "여기엔 아무도 앉아 있지 않아요.",
    body: "찾으시는 페이지가 존재하지 않습니다. 이 사이트는 한 페이지뿐이고, 여기는 그 페이지가 아닙니다.",
    back: "Karasu로 돌아가기",
  },
  shots: {
    "anime-grid": {
      alt: "표지 그리드로 보는 애니 목록. 옆에는 상태와 사용자 지정 목록의 열이 있고, 위에는 검색, 정렬, 필터, 프리셋이 있습니다.",
      caption: "애니 목록, 그리드 보기",
    },
    overview: {
      alt: "개요 화면: 시즌 배너 위에 검색이 있는 인사말과 앞으로 48시간의 일정, 선반처럼 늘어선 목록, 따라잡을 방영 중인 작품, 통계와 내 활동이 있는 열.",
      caption: "개요 — 내 목록, 이번 주, 따라잡을 작품",
    },
    "now-playing": {
      alt: "애니 목록 위에 떠 있는 '지금 재생 중' 창: mpv에서 Mushoku Tensei 3기를 감지했고, 시즌 3 9화와 기록될 진행 상황이 표시됩니다.",
      caption: "지금 재생 중 — mpv에서 감지한 에피소드",
    },
    seasonal: {
      alt: "시즌 페이지: 2026년 가을 작품이 장르와 카운트다운이 있는 카드로 나열되고, 옆에는 연도, 시즌, 포맷의 열이 있습니다.",
      caption: "시즌",
    },
    calendar: {
      alt: "캘린더의 일정 보기: 오늘부터 이번 주에 방영되는 에피소드가 표지, 시간, 화수가 있는 카드로 나열됩니다.",
      caption: "캘린더",
    },
    "stats-overview": {
      alt: "통계 페이지의 개요: 목록의 합계, 상태와 포맷의 링, 제작 국가, 시청 시간이 쓰인 곳, 시리즈 길이.",
      caption: "통계 — 개요",
    },
    franchise: {
      alt: "Mushoku Tensei의 프랜차이즈 그래프: 3기가 이전 시즌, 라이트 노벨, 스핀오프 만화와 연결되어 있고, 옆에는 선택한 작품의 카드가 있습니다.",
      caption: "프랜차이즈 그래프",
    },
    "phone-overview": {
      alt: "휴대폰의 개요 화면: 시즌 배너 위에 검색이 있는 인사말과 선반처럼 늘어선 목록, 그 아래 하단 바.",
      caption: "Android — 개요",
    },
    "phone-list": {
      alt: "휴대폰의 애니 목록. 3열 표지 그리드이고, 위에는 상태 선택기와 목록 검색이 있습니다.",
      caption: "Android — 애니 목록",
    },
    "phone-detail": {
      alt: "휴대폰의 Mushoku Tensei 상세 페이지에 상태 시트가 열려 있습니다: 상태, 진행 상황, 점수 위로 커뮤니티의 점수 분포가 보입니다.",
      caption: "Android — 항목을 연 작품",
    },
    "phone-search": {
      alt: "휴대폰의 검색 페이지. “season 2” 검색 결과가 표지 그리드로 표시됩니다.",
      caption: "Android — 검색",
    },
  },
} satisfies Messages;
