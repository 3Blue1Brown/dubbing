import { clamp } from "lodash";

/** power curve */
export const power = (value: number, strength: number) =>
  sign(value) * Math.abs(value) ** strength || value;

/** sign */
export const sign = (value: number) => (value < 0 ? -1 : 1);

/** round to multiple */
export const round = (value: number, multiple: number) =>
  Math.round(value / multiple) * multiple;

/** convert linearly spaced array values to log spaced */
export const logSpace = (
  array: number[],
  linMin: number,
  linMax: number,
  logMin: number,
  logMax: number,
) => {
  /** pre-compute as much as possible */
  const steps = array.length - 1;
  const linRange = linMax - linMin;
  const linMultiple = linRange / (array.length - 1);
  logMin = Math.log(logMin);
  logMax = Math.log(logMax);
  const logRange = logMax - logMin;

  return array.map((_, index) => {
    /** evenly spaced log step */
    const log = Math.exp(logMin + logRange * (index / steps));

    /** find pair of linear steps log step falls between */
    const lower = clamp(
      Math.floor((log - linMin) / linMultiple),
      0,
      array.length - 2,
    );
    const upper = lower + 1;
    const lowerLin = linMin + linRange * (lower / steps);
    const upperLin = linMin + linRange * (upper / steps);

    /** how far along between lin pair log step is */
    const percent = clamp((log - lowerLin) / (upperLin - lowerLin), 0, 1);

    /** interpolate values */
    return array[lower]! + percent * (array[upper]! - array[lower]!);
  });
};
