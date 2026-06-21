// Rate functions (Manim calls these "rate_funcs"). Pure number -> number on [0,1].
export type Ease = (t: number) => number;

export const linear: Ease = (t) => t;
export const easeInOut: Ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
export const easeOut: Ease = (t) => 1 - (1 - t) ** 3;
export const easeIn: Ease = (t) => t * t * t;
export const easeOutBack: Ease = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};
export const smooth = easeInOut;

// There-and-back, for "indicate"-style pulses.
export const thereAndBack: Ease = (t) => {
  const s = t < 0.5 ? t * 2 : (1 - t) * 2;
  return easeInOut(s);
};
