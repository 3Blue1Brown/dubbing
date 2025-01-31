import { useEffect, useRef, useState } from "react";
import { clamp } from "lodash";
import { pool } from "workerpool";
import PeaksWorker from "@/audio/peaks.worker?worker&url";
import type { Peaks } from "@/audio/peaks.worker.ts";
import { peaks as peaksSync } from "./peaks.worker";

/** time to wait before returning detailed peaks, in ms */
const debounce = 100;

/** create peaks worker pool */
const peaksPool = pool(PeaksWorker, {
  maxWorkers: 16,
  workerOpts: { type: import.meta.env.PROD ? undefined : "module" },
});

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
}: Parameters<Peaks>["0"] & { updated?: unknown }) => {
  /** peaks state */
  const [peaks, setPeaks] = useState<ReturnType<Peaks>>([]);

  /** immediately set less detailed peaks */
  useEffect(() => {
    setPeaks(
      peaksSync({
        array,
        start,
        end,
        divisions,
        /** skip some samples for performance */
        step: clamp(Math.floor(Math.abs(step)), 1, 20),
      }),
    );
  }, [updated, array, start, end, divisions, step]);

  /** debounce timer */
  const timer = useRef(0);

  /** debounce setting perfect peaks */
  useEffect(() => {
    let latest = true;

    (async () => {
      /** debounce */
      window.clearTimeout(timer.current);
      await new Promise(
        (resolve) => (timer.current = window.setTimeout(resolve, debounce)),
      );

      if (!latest) return;

      /** calc detailed peaks */
      const result = await peaksPool
        .exec<Peaks>("peaks", [{ array, start, end, divisions }])
        .timeout(1000);

      if (!latest) return;

      if (!result) return;
      setPeaks(result);
    })().catch(console.error);

    return () => {
      latest = false;
    };
  }, [updated, array, start, end, divisions, step]);

  return peaks;
};
