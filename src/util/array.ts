import { clamp } from "lodash";
import { peak } from "@/pages/lesson/audio";

export const range = (array: Int16Array, start = 0, end: number) => {
  end ??= array.length;
  start = clamp(start, 0, array.length - 1) || 0;
  end = clamp(end, 0, array.length - 1) || 0;
  let max = 0;
  let min = 0;
  const skip = clamp(Math.round((end - start) / 500), 1, 100);
  for (let index = start; index < end; index += skip) {
    const value = array[index];
    if (!value) continue;
    if (value > max) max = value;
    if (value < min) min = value;
  }
  return { min: min / peak, max: max / peak };
};

export const toFloat = (array: Int16Array) => {
  const result = new Float32Array(array.length);
  for (let i = 0; i < array.length; i++)
    result[i] = array[i]! / (array[i]! < 0 ? peak : peak - 1);
  return result;
};
