import { peak } from "@/pages/lesson/audio";

export const range = (array: Int16Array, start = 0, end?: number) => {
  end ??= array.length;
  let max = -Infinity;
  let min = Infinity;
  for (let index = start; index < end; index++) {
    const value = array[index]!;
    if (value > max) max = value;
    if (value < min) min = value;
  }
  return { min, max };
};

export const toFloat = (array: Int16Array) => {
  const result = new Float32Array(array.length);
  for (let i = 0; i < array.length; i++)
    result[i] = array[i]! / (array[i]! < 0 ? peak : peak - 1);
  return result;
};

export const concat = (arrayA: Uint8Array, arrayB: Uint8Array) => {
  const result = new Int8Array(arrayA.length + arrayB.length);
  result.set(arrayA);
  result.set(arrayB, arrayA.length);
  return result;
};
