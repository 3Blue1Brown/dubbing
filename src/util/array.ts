import { clamp } from "lodash";

/** peak value, assuming 16 bit data type */
const peak = 2 ** (16 - 1);

/** get min/max values in array buffer */
export const range = (
  array: Int16Array,
  start: number,
  end: number,
  skip = 1,
) => {
  if (start < 0 || end > array.length - 1) return { min: 0, max: 0 };

  /** limit start/end */
  start = clamp(start, 0, array.length - 1) || 0;
  end = clamp(end, 0, array.length - 1) || 0;

  /** track min/max */
  let max = 0;
  let min = 0;

  /** get range */
  for (let index = start; index < end; index += skip) {
    const value = array[index];
    if (!value) continue;
    if (value > max) max = value;
    if (value < min) min = value;
  }

  /** normalize to [-1, 1] */
  return { min: min / peak, max: max / peak };
};

/** 16-bit ints to 32-bit floats  */
export const toFloat = (array: Int16Array) => {
  const result = new Float32Array(array.length);
  for (let i = 0; i < array.length; i++)
    result[i] = array[i]! / (array[i]! < 0 ? peak : peak - 1);
  return result;
};
