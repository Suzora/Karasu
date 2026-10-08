import { useState } from "react";
import { useTranslation } from "react-i18next";
import { threads } from "@/api/social";
import { Segmented } from "@/components/ui/segmented";
import { ThreadList } from "./ThreadList";
import { UserComments } from "./UserComments";

/** A profile's Forum tab; no `threads(replyUserId:)` lens, since that only lists threads the user replied to last. */
type Lens = "created" | "comments";

export function UserThreads({ userId, name, self }: { userId: number; name: string; self: boolean }) {
  const { t } = useTranslation();
  // Comments first: almost everyone has said something, almost nobody has started a thread.
  const [lens, setLens] = useState<Lens>("comments");

  return (
    <div className="space-y-3">
      {/* Two views of one person's forum posts, so the lens control rather than value pills. */}
      <Segmented
        aria-label={t("social.forumLens")}
        segments={[
          { value: "created", label: t("social.threadsCreated") },
          { value: "comments", label: t("social.threadsComments") },
        ]}
        value={lens}
        onChange={setLens}
      />

      {/* Keyed so the other lens unmounts rather than sitting behind this one with a live query observer. */}
      <div key={lens}>
        {lens === "created" ? (
          <ThreadList
            queryKey={["social", "threads", userId, lens]}
            fetchPage={(page) => threads({ userId }, page)}
            emptyTitle={self ? t("social.noThreadsCreatedSelf") : t("social.noThreadsCreated", { name })}
          />
        ) : (
          <UserComments
            userId={userId}
            emptyTitle={self ? t("social.noUserCommentsSelf") : t("social.noUserComments", { name })}
          />
        )}
      </div>
    </div>
  );
}
