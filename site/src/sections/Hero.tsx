import { ButtonLink } from "@/components/ui/button";
import { Eyebrow } from "@/components/Section";
import release from "@/generated/release.json";
import { LINKS } from "@/site.config";

/** The pitch and the three downloads, with every caveat a first install meets said beside the button. */
export function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="hero relative">
      <div className="container-site flex flex-col items-start px-5 pb-14 pt-14 md:items-center md:pt-20 md:text-center lg:pb-16 lg:pt-24">
        <Eyebrow>Free · open source · for AniList</Eyebrow>
        <h1 id="hero-title" className="mt-4 max-w-4xl font-brand text-display font-bold text-ink-100">
          The AniList client that writes your episodes for you
        </h1>
        <p className="mt-5 max-w-2xl text-lede text-ink-300">
          Your lists, the season, the airing calendar, statistics, the feed and the forum in one quick
          window, and detection that brings your list up to date when an episode ends.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 md:justify-center">
          <ButtonLink href={release.assets.windows} size="lg">
            Download for Windows
          </ButtonLink>
          <ButtonLink href={release.assets.linux} variant="outline" size="lg">
            Linux
          </ButtonLink>
          <ButtonLink href={release.assets.androidArm64} variant="outline" size="lg">
            Android
          </ButtonLink>
        </div>
        <p className="mt-4 max-w-2xl text-xs leading-relaxed text-ink-500">
          Version {release.version}. The Windows installer is not code-signed, so SmartScreen may warn on first
          run · Linux is an experimental AppImage · Android is a sideloaded APK · no macOS ·{" "}
          <a href={release.assets.sums} className="text-accent-400 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent-500">
            checksums
          </a>{" "}
          ·{" "}
          <a href={LINKS.releases} className="text-accent-400 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent-500">
            every download
          </a>
        </p>
      </div>
    </section>
  );
}
