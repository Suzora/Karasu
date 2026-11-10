import type { Messages } from "../en";

export default {
  meta: {
    title: "Karasu — Ứng dụng theo dõi anime và manga hiện đại cho AniList",
    description:
      "Karasu là ứng dụng theo dõi anime và manga miễn phí, mã nguồn mở, được xây dựng riêng cho AniList. Ứng dụng nhận biết bạn đang xem gì — và trên Windows, cả bạn đang đọc gì — rồi giữ tiến độ AniList của bạn luôn đồng bộ. Hỗ trợ Windows, Linux và Android.",
    notFoundTitle: "Không tìm thấy trang — Karasu",
  },
  skip: "Chuyển đến nội dung",
  nav: {
    label: "Điều hướng chính",
    home: "Karasu — về đầu trang",
    changes: "Có gì mới",
    screenshots: "Ảnh chụp màn hình",
    join: "Tham gia",
    faq: "Câu hỏi thường gặp",
    github: "GitHub",
    download: "Tải xuống",
    downloadKarasu: "Tải Karasu",
    openMenu: "Mở menu",
    closeMenu: "Đóng menu",
  },
  hero: {
    eyebrow: "Miễn phí · mã nguồn mở · dành cho AniList",
    title: "Ứng dụng khách AniList tự ghi các tập phim giúp bạn",
    lede: "Danh sách của bạn, mùa phim, lịch phát sóng, thống kê, bảng tin và diễn đàn trong một cửa sổ nhanh gọn, cùng tính năng nhận diện tự cập nhật danh sách khi một tập kết thúc.",
    windows: "Tải cho Windows",
    linux: "Linux",
    android: "Android",
    note: "Phiên bản {version}. Trình cài đặt Windows chưa được ký mã nên SmartScreen có thể cảnh báo ở lần chạy đầu · Linux là AppImage thử nghiệm · Android là APK cài thủ công · không có macOS",
    checksums: "mã kiểm tra",
    everyDownload: "mọi bản tải",
  },
  changes: {
    title: "Có gì mới",
    nightly: "Trong bản Nightly",
    version: "Phiên bản {version}",
    since: "Kể từ {version}, chưa có trong bản Stable nào",
    added: "Thêm mới",
    changed: "Thay đổi",
    fixed: "Đã sửa",
    whole: "Toàn bộ nhật ký thay đổi",
  },
  gallery: {
    eyebrow: "Ảnh chụp màn hình",
    title: "Ứng dụng, đúng như thực tế",
    which: "Chọn ảnh chụp màn hình",
    desktop: "Máy tính",
    android: "Android",
    open: "Mở: {caption}",
    dialog: "Ảnh chụp màn hình {n}/{total}: {caption}",
    previous: "Ảnh chụp màn hình trước",
    next: "Ảnh chụp màn hình tiếp theo",
    close: "Đóng",
  },
  join: {
    title: "Dùng thử rồi cho chúng tôi biết cảm nhận của bạn",
    body: "Karasu do một người bảo trì xây dựng cùng bất kỳ ai muốn tham gia. Một báo cáo lỗi, một ý tưởng, hay chỉ một lời cho biết ứng dụng chạy tốt trên máy bạn đều rất hữu ích, nhất là trên Linux và Android.",
    discord: "Tham gia Discord",
    bug: "Báo lỗi",
    source: "Mã nguồn trên GitHub",
  },
  faq: {
    eyebrow: "Câu hỏi thường gặp",
    title: "Câu hỏi, trả lời dựa trên mã nguồn.",
    items: {
      what: {
        q: "Karasu là gì?",
        a: "Một ứng dụng máy tính và Android quản lý danh sách anime và manga trên AniList của bạn. Ứng dụng nhận biết bạn đang xem hoặc đọc gì và tự cập nhật tiến độ trên AniList, và sẽ hỏi bạn một lần trước với chương truyện từ trang web mà nó không biết tên. Ứng dụng cũng mang đến cho danh sách đó một giao diện cục bộ nhanh với thống kê, thông báo và các trang xã hội.",
      },
      free: {
        q: "Có miễn phí không?",
        a: "Có. Karasu miễn phí và được phát hành theo GNU AGPL-3.0, hoặc bất kỳ phiên bản nào sau đó. Không có gói trả phí và không có gì cần mở khóa.",
      },
      open: {
        q: "Có phải mã nguồn mở không?",
        a: "Có. Toàn bộ mã nguồn nằm trên GitHub, và mọi bản phát hành đều được dựng ở đó từ một commit đã gắn thẻ.",
      },
      anilist: {
        q: "AniList là gì?",
        a: "Một cơ sở dữ liệu anime và manga kiêm trang theo dõi miễn phí tại anilist.co. Danh sách của bạn nằm ở đó; Karasu đọc và ghi vào danh sách thông qua API công khai của AniList.",
      },
      replace: {
        q: "Karasu có thay thế AniList không?",
        a: "Không. Đây là một ứng dụng khách cho AniList. Danh sách của bạn vẫn ở trên AniList và mọi thay đổi Karasu thực hiện sẽ hiện trên trang web ngay sau đó. Bạn cũng có thể dùng Karasu mà không cần tài khoản, chỉ với một danh sách cục bộ.",
      },
      platforms: {
        q: "Hỗ trợ những nền tảng nào?",
        a: "Windows và Android là bản Stable, Linux là AppImage thử nghiệm, và không có bản dựng cho macOS. Windows có đầy đủ mọi tính năng. Android có danh sách, thống kê, thông báo, widget, các trang xã hội và trình cập nhật riêng, nhưng không có thư viện cục bộ và không có khay hệ thống. Cách nhận diện khác nhau: Windows đọc phiên phát đa phương tiện, cửa sổ trình phát và trình duyệt, mpv và Jellyfin; Linux đọc phiên phát đa phương tiện, mpv và Jellyfin, không đọc tiêu đề cửa sổ; Android đọc Jellyfin.",
      },
      credentials: {
        q: "Karasu có lưu thông tin đăng nhập AniList của tôi không?",
        a: "Ứng dụng không bao giờ thấy mật khẩu của bạn. Việc đăng nhập diễn ra trên anilist.co trong trình duyệt của bạn, và trang đó trao cho Karasu một token. Token này được lưu trong kho thông tin xác thực của hệ điều hành trên máy tính, trong một tệp được mã hóa cạnh ứng dụng ở chế độ portable, và trong một tệp được Keystore niêm phong trên Android — và không bao giờ được trả lại cho web view của ứng dụng.",
      },
      offline: {
        q: "Karasu có dùng được khi ngoại tuyến không?",
        a: "Danh sách của bạn được lưu đệm cục bộ nên mở được mà không cần mạng, một tựa phim trong đó hiện trang đã lưu đệm với nút +1 vẫn hoạt động, và các chỉnh sửa được xếp hàng đợi rồi gửi đi khi có kết nối trở lại. Duyệt các tựa không có trong danh sách, tìm kiếm và các trang xã hội cần có mạng.",
      },
      automatic: {
        q: "Ứng dụng có tự cập nhật tiến độ AniList của tôi không?",
        a: "Có, mặc định là khi một tập đã phát được hai phần ba thời lượng — hoặc sau số phút bạn đặt, hoặc sau khi bạn xác nhận một thông báo nếu bạn muốn được hỏi. Chương truyện từ trang web Karasu không biết tên luôn được hỏi trước. Tiến độ chỉ đi tới, và Karasu đọc lại danh sách của bạn ngay trước khi ghi.",
      },
      affiliated: {
        q: "Karasu có liên kết với AniList không?",
        a: "Không. Đây là một dự án độc lập dùng API công khai của AniList, với một client id đã đăng ký và không có quyền truy cập đặc biệt nào.",
      },
      smartscreen: {
        q: "Vì sao Windows cảnh báo khi tôi cài đặt?",
        a: "Trình cài đặt chưa được ký mã, nên SmartScreen chưa từng thấy nó trước đây và báo như vậy. Mỗi bản phát hành đều kèm một tệp SHA256SUMS.txt để bạn đối chiếu bản tải về.",
      },
      network: {
        q: "Karasu kết nối với những đâu?",
        a: "API và máy chủ hình ảnh của AniList; GitHub, để kiểm tra bản cập nhật và tải về; dữ liệu quan hệ giữa các tập do cộng đồng duy trì trên GitHub, nhiều nhất mỗi tuần một lần; máy chủ Jellyfin của riêng bạn nếu bạn thiết lập; socket cục bộ của Discord cho Rich Presence nếu bạn bật. Hình ảnh trong phần giới thiệu của người dùng AniList được tải qua proxy giới hạn riêng của Karasu, nên các máy chủ đó biết địa chỉ IP của bạn khi bạn mở một hồ sơ. Không có gì khác, và không có phân tích dữ liệu.",
      },
    },
  },
  footer: {
    tagline: "Ứng dụng theo dõi anime và manga hiện đại — xây dựng riêng cho AniList.",
    badge: "Mã nguồn mở · miễn phí",
    project: "Dự án",
    github: "GitHub",
    download: "Tải xuống",
    changelog: "Nhật ký thay đổi",
    nightly: "Bản dựng Nightly",
    help: "Trợ giúp",
    docs: "Tài liệu",
    issue: "Báo vấn đề",
    feature: "Đề xuất tính năng",
    discord: "Discord",
    elsewhere: "Nơi khác",
    anilist: "AniList",
    security: "Chính sách bảo mật",
    contributing: "Đóng góp",
    license: "Giấy phép AGPL-3.0",
    copyright: "Cấp phép theo AGPL-3.0 · © 2026 Kyusetzu và những người đóng góp cho Karasu",
    disclaimer:
      "Karasu là một dự án độc lập, không liên kết với AniList và không được AniList chứng thực. SN Pro được dùng theo SIL Open Font License 1.1.",
    language: "Ngôn ngữ",
    aiNote: "Mọi ngôn ngữ ngoài tiếng Anh và tiếng Đức đều là bản dịch AI chưa được ai kiểm duyệt.",
  },
  notFound: {
    title: "Ở đây chẳng có con chim nào đậu.",
    body: "Trang bạn đang tìm không tồn tại. Cả trang web chỉ là một trang, và đây không phải trang đó.",
    back: "Về Karasu",
  },
  shots: {
    "anime-grid": {
      alt: "Danh sách anime dạng lưới ảnh bìa, bên cạnh là một cột các trạng thái và danh sách tùy chỉnh, phía trên là tìm kiếm, sắp xếp, bộ lọc và các thiết lập sẵn.",
      caption: "Danh sách anime, dạng lưới",
    },
    overview: {
      alt: "Trang Tổng quan: lời chào có ô tìm kiếm và 48 giờ tới nằm trên biểu ngữ của một mùa phim, các danh sách dạng kệ, những tựa đang phát sóng cần xem bù, và một cột thống kê cùng hoạt động của chính bạn.",
      caption: "Tổng quan — danh sách của bạn, tuần này, những gì cần xem bù",
    },
    "now-playing": {
      alt: "Cửa sổ Đang phát nổi trên danh sách anime: mùa thứ ba của Mushoku Tensei được nhận diện trong mpv, mùa 3 tập 9, cùng tiến độ sẽ được ghi.",
      caption: "Đang phát — một tập được nhận diện trong mpv",
    },
    seasonal: {
      alt: "Trang Mùa phim: các tựa của mùa Thu 2026 dạng thẻ kèm thể loại và đồng hồ đếm ngược, bên cạnh là một cột gồm năm, mùa và định dạng.",
      caption: "Mùa phim",
    },
    calendar: {
      alt: "Lịch chương trình của Lịch: các tập phát sóng trong tuần kể từ hôm nay, mỗi tập trên một thẻ có ảnh bìa, giờ và số tập.",
      caption: "Lịch",
    },
    "stats-overview": {
      alt: "Tổng quan của trang Thống kê: tổng số của danh sách, vòng tròn trạng thái và định dạng, các quốc gia sản xuất, thời gian xem được dùng vào đâu và độ dài các series.",
      caption: "Thống kê — tổng quan",
    },
    franchise: {
      alt: "Biểu đồ thương hiệu của Mushoku Tensei: mùa thứ ba liên kết với các mùa trước, light novel và một manga ngoại truyện, cùng thẻ của tựa được chọn ở bên cạnh.",
      caption: "Biểu đồ thương hiệu",
    },
    "phone-overview": {
      alt: "Trang Tổng quan trên điện thoại: lời chào có ô tìm kiếm nằm trên biểu ngữ của một mùa phim và các danh sách dạng kệ, phía trên thanh dưới cùng.",
      caption: "Android — tổng quan",
    },
    "phone-list": {
      alt: "Danh sách anime trên điện thoại dạng lưới ảnh bìa ba cột, phía trên là bộ chọn trạng thái và ô tìm kiếm của danh sách.",
      caption: "Android — danh sách anime",
    },
    "phone-detail": {
      alt: "Trang chi tiết của Mushoku Tensei trên điện thoại với bảng trạng thái đang mở: trạng thái, tiến độ và điểm số nằm trên phân bố điểm số của cộng đồng.",
      caption: "Android — một tựa phim, với mục nhập đang mở",
    },
    "phone-search": {
      alt: "Trang tìm kiếm trên điện thoại với kết quả cho “season 2” dạng lưới ảnh bìa.",
      caption: "Android — tìm kiếm",
    },
  },
} satisfies Messages;
