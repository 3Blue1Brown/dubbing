/** peak value, assuming 16 bit data type */
const peak = 2 ** (16 - 1);

/** divide array evenly, find min/max in each division */
export function peaks(
  /** array of numbers */
  array: Int16Array,
  /** start index */
  start: i32,
  /** end index */
  end: i32,
  /** number of divisions */
  divisions: i32,
): Int16Array {
  const peaks: Int16Array = new Int16Array(divisions * 2);

  const windowSize = Math.ceil((end - start) / divisions);

  let windowIndex = 0;
  let peakIndex = 0;
  let min = 0;
  let max = 0;
  for (let index = start; index < end; index++) {
    if (index > array.length - 1) break;
    if (peakIndex > peaks.length - 1) break;
    if (array[index] > max) max = array[index];
    if (array[index] < min) min = array[index];
    windowIndex++;
    if (windowIndex >= windowSize) {
      peaks[peakIndex] = min;
      peaks[peakIndex + 1] = max;
      min = 0;
      max = 0;
      peakIndex += 2;
      windowIndex = 0;
    }
  }

  return peaks;
}
