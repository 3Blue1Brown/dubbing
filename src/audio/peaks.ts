import { useEffect, useRef, useState } from "react";
import { wrap, type Remote } from "comlink";
import { clamp } from "lodash";
import type { Peaks } from "@/audio/peaks.worker.ts";
import * as peaksWorkerAPI from "@/audio/peaks.worker.ts";
import { peaks as peaksSync } from "./peaks.worker";
import PeaksWorker from "./peaks.worker?worker";

/** time to wait before returning detailed peaks, in ms */
const debounce = 1000;

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
  const worker = useRef<Remote<typeof peaksWorkerAPI>>(null);

  /** create worker */
  if (!worker.current) worker.current = wrap(new PeaksWorker());

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
      const result = await worker.current?.peaks({
        array,
        start,
        end,
        divisions,
      });

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
