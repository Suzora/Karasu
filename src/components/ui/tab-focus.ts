import type { KeyboardEvent } from "react";

/** Up and Down walk a column of tabs and wrap, Home and End jump to its ends; only a press switches the tab. */
export function moveTabFocus(e: KeyboardEvent<HTMLButtonElement>) {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const tabs = [...(e.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])];
  const i = tabs.indexOf(e.currentTarget);
  if (i < 0) return;
  const last = tabs.length - 1;
  const next =
    e.key === "ArrowDown" ? (i === last ? 0 : i + 1)
    : e.key === "ArrowUp" ? (i === 0 ? last : i - 1)
    : e.key === "Home" ? 0
    : e.key === "End" ? last
    : null;
  if (next === null) return;
  e.preventDefault();
  tabs[next].focus();
}
