/** tension curve */
export const tension = (value: number, strength: number) =>
  sign(value) * ((strength ** Math.abs(value) - 1) / (strength - 1)) || value;

/** sign */
export const sign = (value: number) => (value < 0 ? -1 : 1);

/** round to multiple */
export const round = (value: number, multiple: number) =>
  Math.round(value / multiple) * multiple;
