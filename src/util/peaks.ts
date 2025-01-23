/** get min/max values in audio buffer */
export const peaks = (
  /** raw samples */
  array: Int16Array,
  /** start sample index */
  start: number,
  /** end sample index */
  end: number,
  /** divide samples into this many windows */
  divisions: number,
  /** skip every this many samples to increase performance */
  step = 1,
) => {
  /** max 16 bit value */
  const peak = 2 ** (16 - 1);

  /** number of samples in each division */
  const size = (end - start) / divisions;

  /** swap if needed */
  if (start > end) [start, end] = [end, start];

  /** return array exact size of number of divisions */
  return new Array(Math.ceil(divisions)).fill(0).map((_, index) => {
    /** start/end samples corresponding to division */
    const startSample = Math.round(start + index * size);
    const endSample = Math.round(start + (index + 1) * size);

    let min = 0;
    let max = 0;

    /** find min/max values */
    if (endSample > 0 && startSample < array.length - 1)
      for (let index = startSample; index <= endSample; index += step) {
        if (!array[index]) continue;
        if (array[index]! < min) min = array[index]!;
        if (array[index]! > max) max = array[index]!;
      }

    /** normalize to -1 to-1 */
    return { min: min / peak, max: max / peak };
  });
};
