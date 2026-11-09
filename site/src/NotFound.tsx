import KarasuMark from "@/components/KarasuMark";
import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/Section";
import { useI18n } from "@/i18n/context";

/** The page GitHub Pages serves for any path that is not the site. */
export function NotFound() {
  const { t } = useI18n();
  return (
    <main
      id="main"
      className="grid min-h-svh place-items-center px-6 py-16 text-center"
    >
      <div className="flex max-w-md flex-col items-center gap-5">
        <KarasuMark className="size-20" title="Karasu" />
        <Eyebrow>404</Eyebrow>
        <h1 className="font-brand text-h3 font-bold text-ink-100">
          {t.notFound.title}
        </h1>
        <p className="text-sm leading-relaxed text-ink-500">
          {t.notFound.body}
        </p>
        <ButtonLink href={import.meta.env.BASE_URL}>{t.notFound.back}</ButtonLink>
      </div>
    </main>
  );
}
