import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { hexToHsv, hsvToHex, type Hsv } from "@/lib/contrast";
import { Switch } from "@/components/ui/switch";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

/** The controls every settings pane shares; none is a `components/ui` primitive, since each knows the pane. */

/** What a `?setting=` deep link lands on: room for the outline `useSettingLanding` sets until the first interaction. */
export const landingClass =
  "-mx-3 rounded-control px-3 transition-surface data-landed:bg-accent-500/5 data-landed:ring-1 data-landed:ring-accent-500/40";

/** A label-and-hint beside its control; below the phone breakpoint the control drops beneath it at the card's width. */
export function Row({
  label,
  hint,
  note,
  setting,
  action = false,
  children,
}: {
  label: string;
  hint?: string;
  /** Below the hint — an `ExternalNote`, usually. */
  note?: ReactNode;
  /** The id a `?setting=` deep link names to land here. */
  setting?: string;
  /** The control is a button: the row is a named group, not a label, so a click on its hint presses nothing. */
  action?: boolean;
  /** A function receives the hint's id, for the button an action row describes with it. */
  children: ReactNode | ((hintId: string | undefined) => ReactNode);
}) {
  const labelId = useId();
  const hintId = useId();
  const className = cn(
    "flex items-center justify-between gap-4 py-1 text-sm max-md:flex-col max-md:items-stretch max-md:gap-2 max-md:*:w-full",
    setting && landingClass,
  );
  const text = (
    // A basis of zero, so the hint's length never decides how wide the control beside it may be.
    <span className="md:min-w-40 md:flex-1">
      <span id={labelId} className="block text-ink-100">
        {label}
      </span>
      {hint && (
        <span id={hintId} className="block text-xs text-ink-600">
          {hint}
        </span>
      )}
      {note}
    </span>
  );
  const control = typeof children === "function" ? children(hint ? hintId : undefined) : children;
  if (action)
    return (
      <div role="group" aria-labelledby={labelId} data-setting={setting} className={className}>
        {text}
        {control}
      </div>
    );
  return (
    <label data-setting={setting} className={className}>
      {text}
      {control}
    </label>
  );
}

/** Heads a run of a pane's cards by where they are kept, pulled close to the first card it heads. */
export function GroupLabel({ children }: { children: ReactNode }) {
  return <h2 className="-mb-3 px-1 pt-3 text-2xs uppercase tracking-eyebrow text-ink-600">{children}</h2>;
}

/** Marks a row that changes the AniList account rather than Karasu; gold is the app's caveat colour. */
export function ExternalNote({ children }: { children: ReactNode }) {
  return (
    <span className="mt-1 flex items-start gap-1.5 text-xs text-gold">
      <Globe className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </span>
  );
}

/** Says why a section needs an account instead of letting it vanish; muted, because it explains rather than warns. */
export function NeedsAccount({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-panel border border-dashed border-surface-700 p-5">
      <p className="text-sm font-medium text-ink-300">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{children}</p>
    </div>
  );
}

/** Heads a pane whose controls can break something; filled so it cannot be mistaken for one more section. */
export function DangerNote({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-panel border border-danger/35 bg-danger/8 p-4">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
      <div className="min-w-0">
        <p className="text-sm font-medium text-danger">{title}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-300">{children}</p>
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
  setting,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  /** For a setting this desktop cannot honour — the hint says why. */
  disabled?: boolean;
  /** The id a `?setting=` deep link names to land here. */
  setting?: string;
}) {
  return (
    <label
      data-setting={setting}
      className={cn(
        "flex items-start justify-between gap-4 py-1",
        disabled ? "cursor-not-allowed" : "cursor-pointer",
        setting && landingClass,
      )}
    >
      {/* May shrink and break a path mid-word, so a long hint can never push the switch out of the card. */}
      <span className="min-w-0 break-words">
        <span className={cn("block text-sm", disabled ? "text-ink-500" : "text-ink-100")}>{label}</span>
        {/* Never faded: on a disabled switch the hint is the reason, and a reason has to stay readable. */}
        {hint && <span className="block text-xs text-ink-600">{hint}</span>}
      </span>
      <Switch checked={checked} disabled={disabled} onChange={onChange} className={disabled ? "opacity-55" : undefined} />
    </label>
  );
}

/** Inline HSV picker replacing the native colour input, whose OS dialog misbehaves inside the Tauri window. */
export function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (hex: string) => void;
}) {
  const { t } = useTranslation();
  const validValue = /^#[0-9a-f]{6}$/i.test(value) ? value : "#6c7fff";
  const [hsv, setHsvState] = useState<Hsv>(() => hexToHsv(validValue));
  const hsvRef = useRef(hsv);
  const [hexInput, setHexInput] = useState(validValue);
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);

  // Stay in sync if the accent changes from outside (e.g. a preset click).
  useEffect(() => {
    const next = hexToHsv(validValue);
    hsvRef.current = next;
    setHsvState(next);
    setHexInput(validValue);
  }, [validValue]);

  const commit = (next: Hsv) => {
    hsvRef.current = next;
    setHsvState(next);
    const hex = hsvToHex(next);
    setHexInput(hex);
    onChange(hex);
  };

  const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

  const beginDrag = (
    el: HTMLDivElement,
    e: React.PointerEvent,
    compute: (x: number, y: number, rect: DOMRect) => Hsv,
  ) => {
    el.setPointerCapture(e.pointerId);
    const apply = (x: number, y: number) =>
      commit(compute(x, y, el.getBoundingClientRect()));
    apply(e.clientX, e.clientY);
    const onMove = (ev: PointerEvent) => apply(ev.clientX, ev.clientY);
    const onUp = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
  };

  return (
    <div className="space-y-2 rounded-control border border-surface-700 bg-surface-900 p-3">
      <div
        ref={svRef}
        onPointerDown={(e) =>
          svRef.current &&
          beginDrag(svRef.current, e, (x, y, rect) => ({
            h: hsvRef.current.h,
            s: clamp01((x - rect.left) / rect.width) * 100,
            v: 100 - clamp01((y - rect.top) / rect.height) * 100,
          }))
        }
        className="relative h-28 w-full touch-none rounded-inner"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h}, 100%, 50%))`,
        }}
      >
        <div
          className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-on-cover-edge ring-1 ring-on-cover/40"
          style={{ left: `${hsv.s}%`, top: `${100 - hsv.v}%` }}
        />
      </div>

      <div
        ref={hueRef}
        onPointerDown={(e) =>
          hueRef.current &&
          beginDrag(hueRef.current, e, (x, _y, rect) => ({
            h: clamp01((x - rect.left) / rect.width) * 360,
            s: hsvRef.current.s,
            v: hsvRef.current.v,
          }))
        }
        className="relative h-3 w-full touch-none rounded-full"
        style={{
          background:
            "linear-gradient(to right, red, yellow, lime, cyan, blue, magenta, red)",
        }}
      >
        <div
          className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-on-cover-edge ring-1 ring-on-cover/40"
          style={{ left: `${(hsv.h / 360) * 100}%` }}
        />
      </div>

      <Input
        type="text"
        aria-label={t("settings.colorHex")}
        value={hexInput}
        onChange={(e) => setHexInput(e.target.value)}
        onBlur={() => {
          if (/^#[0-9a-f]{6}$/i.test(hexInput)) commit(hexToHsv(hexInput));
          else setHexInput(hsvToHex(hsv));
        }}
        spellCheck={false}
        maxLength={7}
        className="h-8 px-2 font-mono text-xs uppercase"
      />
    </div>
  );
}
