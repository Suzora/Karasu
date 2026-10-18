import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Bird, CheckCheck, Globe, Heart, Inbox, Info, Layers, MessageCircle, MessagesSquare, Tv, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { IconButton } from "@/components/ui/icon-button";
import { ColumnLabel, ColumnPage, PageTitle, columnRow } from "@/components/shell/PageColumn";
import { usePhoneShell } from "@/hooks/usePhoneShell";
import { NotifFeed } from "@/components/shell/NotifFeed";
import { useNotifications, type Leave } from "@/hooks/useNotifications";
import { NOTIF_KINDS, type NotifKind, type NotifSource } from "@/lib/notifGroups";

/** A page is not an overlay, so a row's destination is simply the next page. */
const stay: Leave = (go) => go();

const KIND_ICON: Record<NotifKind, typeof CheckCheck> = {
  all: Inbox,
  episodes: Tv,
  likes: Heart,
  replies: MessageCircle,
  follows: UserPlus,
  forum: MessagesSquare,
  notices: Info,
};
const kindKey = {
  all: "notif.kindAll",
  episodes: "notif.kindEpisodes",
  likes: "notif.kindLikes",
  replies: "notif.kindReplies",
  follows: "notif.kindFollows",
  forum: "notif.kindForum",
  notices: "notif.kindNotices",
} as const;

const rowClass = (on: boolean) => columnRow(on);

/** Every notification, Karasu's and AniList's, narrowed by source and kind from the column. */
export default function Notifications() {
  const { t } = useTranslation();
  const phone = usePhoneShell();
  const [source, setSource] = useState<NotifSource>("all");
  const [kind, setKind] = useState<NotifKind>("all");
  const n = useNotifications({ active: true, source, kind });

  const sources: [NotifSource, string, typeof CheckCheck][] = [
    ["all", t("notif.sourceAll"), Layers],
    ["karasu", "Karasu", Bird],
    ["anilist", "AniList", Globe],
  ];
  // An action, not a filter, so it sits beside the title as the page's one button rather than among the rows.
  const markAll = (
    <IconButton variant="ghost" size="sm" round onClick={() => void n.readAll()} aria-label={t("notif.markAll")} title={t("notif.markAll")}>
      <CheckCheck className="size-4" />
    </IconButton>
  );
  const column = (
    <div className="space-y-0.5">
      {/* Without an AniList account there is one source, and a filter over one source filters nothing. */}
      {n.anilist && (
        <div role="radiogroup" aria-label={t("notif.source")} className="space-y-0.5">
          <ColumnLabel first>{t("notif.sourceHeading")}</ColumnLabel>
          {sources.map(([value, label, Icon]) => (
            <button key={value} type="button" role="radio" aria-checked={source === value} onClick={() => setSource(value)} className={rowClass(source === value)}>
              <Icon aria-hidden className="size-4 shrink-0 opacity-70" />
              <span className="min-w-0 flex-1 truncate">{label}</span>
            </button>
          ))}
        </div>
      )}
      <ColumnLabel first={!n.anilist}>{t("notif.kindHeading")}</ColumnLabel>
      {NOTIF_KINDS.map((k) => {
        const Icon = KIND_ICON[k];
        return (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={rowClass(kind === k)}>
            <Icon aria-hidden className="size-4 shrink-0 opacity-70" />
            <span className="min-w-0 flex-1 truncate">{t(kindKey[k])}</span>
          </button>
        );
      })}
    </div>
  );
  const feed = (
    <Card className="overflow-hidden p-0">
      <NotifFeed
        n={n}
        leave={stay}
        byDay
        more
        emptyTitle={kind !== "all" ? t("notif.emptyKind") : source === "all" ? undefined : t("notif.emptySource")}
      />
    </Card>
  );

  if (phone) {
    return (
      <div data-notifications-page className="space-y-4 px-4 pb-12 pt-4">
        <PageTitle title={t("notif.title")} jp="通知" action={markAll} />
        {column}
        {feed}
      </div>
    );
  }

  return (
    <div data-notifications-page>
      <ColumnPage
        scroll="page"
        contentClassName="max-w-3xl"
        column={
          <>
            <PageTitle title={t("notif.title")} jp="通知" action={markAll} className="mb-3" />
            {column}
          </>
        }
      >
        {feed}
      </ColumnPage>
    </div>
  );
}
