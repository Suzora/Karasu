import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { StaffRoleEdge } from "@/api/social";
import { displayTitle } from "@/api/types";
import type { RoleYear } from "@/lib/roleYears";
import { formatLabel } from "@/lib/format";
import { isBlocked, shouldBlur } from "@/lib/contentFilter";
import { useContentFilter } from "@/stores/contentFilter";
import { Avatar } from "@/components/ui/user-lockup";
import { cn } from "@/lib/utils";
import { characterRoleLabel } from "./roleLabel";

type Role = StaffRoleEdge & { node: NonNullable<StaffRoleEdge["node"]> };

/** A voice actor's roles as cards under their years; the content filter runs here, since no connection takes `isAdult`. */
export function RoleYears({ years }: { years: RoleYear<StaffRoleEdge>[] }) {
  const { t } = useTranslation();
  const level = useContentFilter((s) => s.level);
  const blurAdult = useContentFilter((s) => s.blurAdult);
  const groups = years
    .map((y) => ({ year: y.year, roles: y.roles.filter((r): r is Role => !!r.node && !isBlocked(r.node, level)) }))
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

/** The role's weight and the title's format in one quiet line; a main role takes the accent. */
function meta(role: Role, t: TFunction): { text: string; main: boolean } {
  const weight = characterRoleLabel(role.characterRole, t);
  const format = formatLabel(role.node.format, t);
  return { text: [format, weight].filter(Boolean).join(" · "), main: role.characterRole === "MAIN" };
}

function characterOf(role: Role): { id: number | null; name: string; image: string | null } {
  const c = role.characters?.[0];
  return { id: c?.id ?? null, name: c?.name.full ?? role.characterName ?? "", image: c?.image?.medium ?? null };
}

/** A cover with the character's face over its corner; the cover opens the title, the face and the name the character. */
function RoleCard({ role, veil, t }: { role: Role; veil: boolean; t: TFunction }) {
  const { text, main } = meta(role, t);
  const character = characterOf(role);
  const title = displayTitle(role.node.title);
  const toCharacter = character.id ? `/character/${character.id}` : null;
  const face = character.image ? <Avatar src={character.image} name={character.name} size="lg" className="ring-2 ring-surface-900" /> : null;
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
          (toCharacter ? (
            <Link to={toCharacter} className="absolute bottom-1.5 left-1.5" title={character.name}>
              {face}
            </Link>
          ) : (
            <div className="absolute bottom-1.5 left-1.5">{face}</div>
          ))}
      </div>
      <Link to={`/media/${role.node.id}`} className="mt-1.5 block line-clamp-2 text-xs leading-snug text-ink-500 group-hover:text-ink-300">
        {title}
      </Link>
      {character.name &&
        (toCharacter ? (
          <Link to={toCharacter} className="block truncate text-xs text-ink-300 hover:underline">
            {character.name}
          </Link>
        ) : (
          <p className="truncate text-xs text-ink-300">{character.name}</p>
        ))}
      <p className={cn("truncate text-xs", main ? "text-accent-400" : "text-ink-600")} title={text}>
        {text}
      </p>
    </div>
  );
}
