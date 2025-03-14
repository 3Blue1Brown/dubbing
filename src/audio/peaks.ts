import { useEffect, useState } from "react";
import { clamp } from "lodash";

export type Props = {
  /** raw samples */
  array: ArrayLike<number>;
  /** start sample index */
  start: number;
  /** end sample index */
  end: number;
  /** divide samples into this many windows */
  divisions: number;
  /** skip every this many samples to increase performance */
  step?: number;
};

/** get min/max values in audio buffer */
export const getPeaks = ({ array, start, end, divisions, step = 1 }: Props) => {
  /** swap if needed */
  if (start > end) [start, end] = [end, start];

  /** number of samples in each division */
  const size = (end - start) / divisions;

  /** return array exact size of number of divisions */
  return new Array(Math.ceil(divisions)).fill(0).map((_, index) => {
    /** start/end samples corresponding to division */
    const startSample = Math.round(start + index * size);
    const endSample = Math.round(start + (index + 1) * size);

    /** find min/max values */
    let min = 0;
    let max = 0;
    if (endSample > 0 && startSample < array.length - 1)
      for (let index = startSample; index <= endSample; index += step) {
        if (!array[index]) continue;
        if (array[index]! < min) min = array[index]!;
        if (array[index]! > max) max = array[index]!;
      }

    return {
      /** min/negative sample amplitude in range */
      min,
      /** max/positive sample amplitude in range */
      max,
      /** start sample # of in range */
      start: startSample,
      /** end sample # of in range */
      end: endSample,
    };
  });
};

/** use peaks with dynamic level of detail */
export const usePeaks = ({
  /** change to trigger update */
  updated,
  /** base peaks func params */
  array,
  start,
  end,
  divisions,
  step = 1,
}: Props & { updated?: unknown }) => {
  /** peaks state */
  const [peaks, setPeaks] = useState<ReturnType<typeof getPeaks>>([]);

  useEffect(() => {
    setPeaks(
      getPeaks({
        array,
        start,
        end,
        divisions,
        /** skip some samples for performance */
        step: clamp(Math.floor(Math.abs(step)), 1, 44100 / 10),
      }),
    );
  }, [updated, array, start, end, divisions, step]);

  return peaks;
};
