import { bitPeak } from "@/audio";

/** 16-bit ints to 32-bit floats  */
export const toFloat = (array: Int16Array) => {
  const result = new Float32Array(array.length);
  for (let i = 0; i < array.length; i++)
    result[i] = array[i]! / (array[i]! < 0 ? bitPeak : bitPeak - 1);
  return result;
};
