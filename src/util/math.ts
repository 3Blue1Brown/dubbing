import { clamp } from "lodash";

/** power curve */
export const power = (value: number, strength: number) =>
  sign(value) * Math.abs(value) ** strength || value;

/** sign */
export const sign = (value: number) => (value < 0 ? -1 : 1);

/** round to multiple */
export const round = (value: number, multiple: number) =>
  Math.round(value / multiple) * multiple;

/** convert linearly spaced array values to log spaced with interpolation */
/** https://stackoverflow.com/questions/35799286/get-logarithmic-bytefrequencydata-from-audio/79394526#79394526 */
export const logSpace = (
  array: number[],
  linMin: number,
  linMax: number,
  logMin: number,
  logMax: number,
) => {
  /** generate evenly spaced linear steps */
  const linRange = linMax - linMin;
  const linSteps = Array(array.length)
    .fill(0)
    .map((_, index) => linMin + linRange * (index / (array.length - 1)));

  /** generate evenly spaced log steps */
  logMin = Math.log(logMin);
  logMax = Math.log(logMax);
  const logRange = logMax - logMin;
  const logSteps = Array(array.length)
    .fill(0)
    .map((_, index) =>
      Math.exp(logMin + logRange * (index / (array.length - 1))),
    );

  let lower = 0;
  /** for each log step */
  return logSteps.map((logStep) => {
    /** find pair of linear steps that log step falls between */
    while (linSteps[lower]! < logStep && lower < linSteps.length - 2) lower++;
    const upper = lower + 1;
    const lowerLin = linSteps[lower]!;
    const upperLin = linSteps[upper]!;
    /** how far along between lin pair log step is */
    const percent = clamp((logStep - lowerLin) / (upperLin - lowerLin), 0, 1);
    /** interpolate array values */
    return array[lower]! + percent * (array[upper]! - array[lower]!);
  });
};

const array = Array(10)
  .fill(0)
  .map((_, index) => index);

console.log(logSpace(array, 22050 / 2, 22050, 20, 22050));
