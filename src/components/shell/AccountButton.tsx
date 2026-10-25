import { useTranslation } from "react-i18next";
import { NavLink } from "react-router";
import { Avatar } from "@/components/ui/user-lockup";
import { useAuth } from "@/stores/auth";
import { profilePath } from "@/lib/anilistUrl";

/** The titlebar's way to the viewer's own profile; nothing without an AniList account, since the local profile has no page. */
export default function AccountButton() {
  const { t } = useTranslation();
  const viewer = useAuth((s) => s.viewer);
  const mode = useAuth((s) => s.mode);
  if (mode !== "anilist" || !viewer) return null;

  return (
    <NavLink
      to={profilePath(viewer.name)}
      end
      title={t("nav.myProfile")}
      className="flex h-9 items-center gap-2 px-2.5 text-ink-500 transition-surface hover:bg-surface-850 hover:text-ink-100 aria-[current=page]:text-ink-100 focus-inset"
    >
      <Avatar name={viewer.name} src={viewer.avatar?.large} size="sm" className="size-6" />
      <span className="max-w-32 truncate text-xs font-medium">{viewer.name}</span>
      <span className="sr-only">{t("nav.myProfile")}</span>
    </NavLink>
  );
}
