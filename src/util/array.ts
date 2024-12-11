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
