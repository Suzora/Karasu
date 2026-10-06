/** How far a press must travel before it is a drag rather than a tap on a button inside. */
export const FLICK_SLOP = 4;
/** How much of the finger's travel the dragged element follows, so it feels held back. */
export const FLICK_ELASTIC = 0.6;
/** How far down, or how fast, a flick must go before letting go dismisses. */
export const FLICK_PX = 40;
export const FLICK_SPEED = 400;
/** The stretch of samples the release velocity is read over, so an early pause does not count. */
const WINDOW_MS = 100;

export interface FlickSample {
  y: number;
  t: number;
}

/** Downward speed at release in px/s, from the samples of the last moments before it. */
export function releaseVelocity(samples: readonly FlickSample[]): number {
  const last = samples[samples.length - 1];
  if (!last) return 0;
  const first = samples.find((s) => last.t - s.t <= WINDOW_MS) ?? last;
  const dt = last.t - first.t;
  return dt > 0 ? ((last.y - first.y) / dt) * 1000 : 0;
}

/** Whether a release dismisses: far enough down, or fast enough downwards. */
export function isFlick(offset: number, velocity: number): boolean {
  return offset > FLICK_PX || velocity > FLICK_SPEED;
}
