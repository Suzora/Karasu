import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { MediaYearEdge, StaffRoleEdge } from "@/api/social";
import { displayTitle } from "@/api/types";
import type { RoleYear } from "@/lib/roleYears";
import { formatLabel } from "@/lib/format";
import { isBlocked, shouldBlur } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";
import { Avatar } from "@/components/ui/user-lockup";
import { cn } from "@/lib/utils";
import { characterRoleLabel } from "./roleLabel";

/** What the three person pages list by year: a voice actor's roles, a character's appearances, a studio's titles. */
export type YearEdge = StaffRoleEdge | MediaYearEdge;

type Dated = YearEdge & { node: NonNullable<YearEdge["node"]> };

/** Year-grouped cards for a person page; the content filter runs here, since no connection takes `isAdult`. */
export function RoleYears({ years }: { years: RoleYear<YearEdge>[] }) {
  const { t } = useTranslation();
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const groups = years
    .map((y) => ({ year: y.year, roles: y.roles.filter((r): r is Dated => !!r.node && !isBlocked(r.node, level)) }))
    .filter((y) => y.roles.length > 0);
  if (!groups.length) return null;
  const label = (year: number | null) => (year === null ? t("person.rolesUpcoming") : String(year));

  return (
    <div className="space-y-6">
      {groups.map((y) => (
        <section key={y.year ?? "tba"} className="space-y-2" aria-label={label(y.year)}>
          <h3 className="text-sm font-medium tabular-nums text-ink-300">{label(y.year)}</h3>
          <div className="media-grid gap-3">
            {y.roles.map((r) => (
              <RoleCard key={r.id} role={r} veil={shouldBlur(r.node, level, blurAdult)} t={t} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/** The weight and the format in one quiet line; a main role, or the main studio, takes the accent. */
function meta(role: Dated, t: TFunction): { text: string; main: boolean } {
  const mainStudio = "isMainStudio" in role && role.isMainStudio === true;
  const weight = characterRoleLabel(role.characterRole, t) || (mainStudio ? t("person.mainStudio") : "");
  const format = formatLabel(role.node.format, t);
  return { text: [format, weight].filter(Boolean).join(" · "), main: role.characterRole === "MAIN" || mainStudio };
}

/** Who stands beside the title: the character on a voice actor's page, the Japanese voice on a character's. */
function companionOf(role: Dated): { to: string | null; name: string; image: string | null } | null {
  if ("characters" in role) {
    const c = role.characters?.[0];
    const name = c?.name.full ?? role.characterName ?? "";
    if (!c && !name) return null;
    return { to: c ? `/character/${c.id}` : null, name, image: c?.image?.medium ?? null };
  }
  const va = role.voiceActors?.[0];
  return va ? { to: `/staff/${va.id}`, name: va.name.full ?? "", image: va.image?.medium ?? null } : null;
}

/** A cover with a face over its corner; the cover and the title open the title, the face and the name its person. */
function RoleCard({ role, veil, t }: { role: Dated; veil: boolean; t: TFunction }) {
  const { text, main } = meta(role, t);
  const who = companionOf(role);
  const title = displayTitle(role.node.title);
  const face = who?.image ? <Avatar src={who.image} name={who.name} size="lg" className="ring-2 ring-surface-900" /> : null;
  return (
    <div className="group min-w-0">
      <div className="relative">
        <Link to={`/media/${role.node.id}`} title={title} className="block aspect-2/3 overflow-hidden rounded-control bg-surface-850">
          {role.node.coverImage?.large && (
            <img
              src={role.node.coverImage.large}
              alt=""
              loading="lazy"
              decoding="async"
              className={cn("size-full object-cover transition-transform", veil ? "veil" : "group-hover:scale-[1.03]")}
            />
          )}
        </Link>
        {face &&
          (who?.to ? (
            <Link to={who.to} className="absolute bottom-1.5 left-1.5" title={who.name}>
              {face}
            </Link>
          ) : (
            <div className="absolute bottom-1.5 left-1.5">{face}</div>
          ))}
      </div>
      <Link to={`/media/${role.node.id}`} className="mt-1.5 block line-clamp-2 text-xs leading-snug text-ink-500 group-hover:text-ink-300">
        {title}
      </Link>
      {who?.name &&
        (who.to ? (
          <Link to={who.to} className="block truncate text-xs text-ink-300 hover:underline">
            {who.name}
          </Link>
        ) : (
          <p className="truncate text-xs text-ink-300">{who.name}</p>
        ))}
      {text && (
        <p className={cn("truncate text-xs", main ? "text-accent-400" : "text-ink-600")} title={text}>
          {text}
        </p>
      )}
    </div>
  );
}
