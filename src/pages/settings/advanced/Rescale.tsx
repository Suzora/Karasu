import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import * as api from "@/api/anilist";
import { backendErrorText } from "@/lib/backendError";
import { planRescale } from "@/lib/rescale";
import { scoreScale } from "@/lib/scoreFormat";
import { useAuth, useScoreFormat } from "@/stores/auth";
import { showToast } from "@/stores/toast";
import type { ListResult, MediaType } from "@/api/types";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

/** The one-shot score rescale, planned purely in `lib/rescale` and previewed with its request count first. */
export function RescaleSection() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const viewer = useAuth((s) => s.viewer);
  const mode = useAuth((s) => s.mode);
  const format = useScoreFormat();
  const scale = scoreScale(format);
  const [type, setType] = useState<MediaType>("ANIME");
  const [fromMin, setFromMin] = useState(1);
  const [fromMax, setFromMax] = useState(scale.max);
  const [toMin, setToMin] = useState(1);
  const [toMax, setToMax] = useState(scale.max);
  const [applying, setApplying] = useState(false);

  // A `useQuery` on the list screens' key, not `getQueryData`, or the rescale writes from a stale snapshot.
  const { data } = useQuery<ListResult>({
    queryKey: ["mediaList", type, viewer?.id ?? 0],
    queryFn: () => api.fetchMediaList(viewer!.id, type),
    enabled: mode === "anilist" && !!viewer,
  });

  const entries = useMemo(() => {
    const seen = new Set<number>();
    return (data?.lists ?? [])
      .filter((g) => !g.isCustomList)
      .flatMap((g) => g.entries)
      .filter((e) => (seen.has(e.mediaId) ? false : (seen.add(e.mediaId), true)))
      .map((e) => ({ id: e.id, mediaId: e.mediaId, score: e.score }));
  }, [data]);

  if (mode !== "anilist" || !viewer) return null;

  const plan = planRescale(
    entries,
    { min: fromMin, max: fromMax },
    { min: toMin, max: toMax },
    format,
  );
  const listLoaded = entries.length > 0;

  const apply = async () => {
    setApplying(true);
    try {
      for (const group of plan.groups) {
        await api.bulkSaveEntries(group.entries, { score: group.score });
      }
      showToast({
        kind: "success",
        text: t("settings.rescaleDone", { count: plan.affected }),
      });
      await qc.invalidateQueries({ queryKey: ["mediaList", type] });
    } catch (e) {
      // Through the mapper, not `String(e)`, or a German UI shows the backend's stable codes raw.
      showToast({
        kind: "error",
        text: t("settings.rescaleFailed"),
        detail: backendErrorText(e, t),
      });
    } finally {
      setApplying(false);
    }
  };

  const range = (
    value: number,
    set: (n: number) => void,
    label: string,
  ) => (
    <Input
      type="number"
      min={0}
      max={scale.max}
      step={scale.step}
      value={value}
      onChange={(e) => set(Number(e.target.value))}
      aria-label={label}
      className="w-20"
    />
  );

  return (
    <Card>
      <CardTitle>{t("settings.rescale")}</CardTitle>
      <p className="mt-2 text-sm text-ink-500">{t("settings.rescaleHint")}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Select
          value={type}
          onChange={(e) => setType(e.target.value as MediaType)}
          aria-label={t("settings.rescaleList")}
        >
          <option value="ANIME">{t("common.anime")}</option>
          <option value="MANGA">{t("common.manga")}</option>
        </Select>
        {/* Each range holds together, so a narrow card breaks the row at the arrow rather than inside a range. */}
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-3 text-sm text-ink-300">
          <span className="flex items-center gap-1.5">
            {range(fromMin, setFromMin, t("settings.rescaleFromMin"))}–{range(fromMax, setFromMax, t("settings.rescaleFromMax"))}
          </span>
          <span aria-hidden className="mx-1 text-ink-600">→</span>
          <span className="flex items-center gap-1.5">
            {range(toMin, setToMin, t("settings.rescaleToMin"))}–{range(toMax, setToMax, t("settings.rescaleToMax"))}
          </span>
        </span>
      </div>
      <p className="mt-2 text-xs text-ink-600">
        {listLoaded
          ? t("settings.rescalePreview", {
              affected: plan.affected,
              untouched: plan.untouched,
              requests: plan.requests,
            })
          : t("settings.rescaleNoList")}
      </p>
      <Button
        className="mt-3"
        variant="secondary"
        disabled={!listLoaded || plan.affected === 0 || applying}
        onClick={apply}
      >
        {applying ? (
          <Spinner className="size-3.5" />
        ) : null}
        {t("settings.rescaleApply")}
      </Button>
    </Card>
  );
}
