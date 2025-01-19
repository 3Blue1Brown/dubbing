import { chunk, clamp } from "lodash";
import { peaks as wasmPeaks } from "../../build/release";

/** peak value, assuming 16 bit data type */
const peak = 2 ** (16 - 1);

/** get min/max values in array buffer */
export const peaks = (
  array: Int16Array,
  start: number,
  end: number,
  divisions: number,
) => {
  /** limit start/end */
  start = Math.round(clamp(start, 0, array.length - 1)) || 0;
  end = Math.round(clamp(end, 0, array.length - 1)) || 0;
  if (start > end) [start, end] = [end, start];

  /** run web assembly */
  const peaks = chunk(wasmPeaks(array, start, end, divisions), 2).map(
    ([min, max]) => ({
      /** normalize to -1 to 1 */
      min: (min || 0) / peak,
      max: (max || 0) / peak,
    }),
  );

  return peaks;
};

/** 16-bit ints to 32-bit floats  */
export const toFloat = (array: Int16Array) => {
  const result = new Float32Array(array.length);
  for (let i = 0; i < array.length; i++)
    result[i] = array[i]! / (array[i]! < 0 ? peak : peak - 1);
  return result;
};
