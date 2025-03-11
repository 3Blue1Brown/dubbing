import { useCallback, useState } from "react";
import { clamp } from "lodash";
import { useDebounceFn } from "@reactuses/core";

/** speed/strength of waveform scrolling */
const scrollXPower = 0.005;
const scrollYPower = 1.01;

type Props = {
  /** total length of timeline, in seconds */
  length: number;
  /** current time in seconds */
  time: number;
  /** sample rate in hz */
  sampleRate: number;
  /** follow current time cursor while playing */
  autoScroll: boolean;
};

type Vec2 = { x: number; y: number };

/** how coords are transformed from sample to percent */
export type Transform = {
  translate: Vec2;
  scale: Vec2;
};

/** "client" = coords relative to canvas element, in pixels */

/**
 * "percent" = coord in terms of % canvas element dimensions, where x = [0, 1]
 * from left to right side of canvas, and y = [-1, 1] from top to bottom side of
 * canvas
 */

/**
 * "sample" = coord in terms of audio samples, where x = sample # and y = sample
 * amp [-1, 1]
 */

/** convert sample to percent coords */
export const sampleToPercent = (
  { translate, scale }: Transform,
  { x = 0, y = 0 }: Partial<Vec2>,
) => ({
  x: x * scale.x + translate.x,
  y: y * scale.y + translate.y,
});

/** convert percent coords to sample coords */
export const percentToSample = (
  { translate, scale }: Transform,
  { x = 0, y = 0 }: Partial<Vec2>,
) => ({
  x: (x - translate.x) / scale.x,
  y: (y - translate.y) / scale.y,
});

/** convert client coords to canvas coords */
export const clientToPercent = (
  {
    left = 0,
    top = 0,
    width = 1,
    height = 1,
  }: Partial<Pick<DOMRect, "left" | "top" | "width" | "height">>,
  { x = 0, y = 0 }: Partial<Vec2>,
) => ({
  x: clamp((x - left) / (width || 1), 0, 1),
  y: clamp(((y - top) / (height || 1) - 0.5) * 2, -1, 1),
});

/** waveform transform */
export const useTransform = ({ length, sampleRate }: Props) => {
  /** limit transform */
  const limit = useCallback(
    ({ translate, scale }: Transform) => {
      /** limit zoom */
      scale.x = clamp(scale.x, 1 / (length * sampleRate || 10e20), 0.01);
      scale.y = clamp(scale.y, 1, 10);
      /** limit pan */
      translate.x = clamp(translate.x, 1 - length * sampleRate * scale.x, 0);
      translate.y = clamp(translate.y, 0, 0);
      return { translate, scale };
    },
    [length, sampleRate],
  );

  /** transform state */
  const [transform, setTransform] = useState<Transform>(() =>
    limit({
      translate: { x: 0, y: 0 },
      scale: { x: 0, y: 1 },
    }),
  );

  /** center transform around time, in seconds */
  const center = useCallback(
    async (time: number) => {
      await setTransform((transform) => {
        /** current time sample # */
        const currentSample = time * sampleRate;
        /** center horizontally */
        transform.translate.x = 0.5 - currentSample * transform.scale.x;
        return limit(transform);
      });
    },
    [limit, sampleRate],
  );

  /** handle zoom/pan */
  const onWheel = useCallback(
    (event: WheelEvent) => {
      /** prevent page scroll */
      event.preventDefault();

      /** get scroll details */
      let { deltaX, deltaY, shiftKey, ctrlKey, altKey, clientX, clientY } =
        event;
      const target = event.currentTarget as HTMLElement;

      /** make wheel effect more precise */
      if (altKey) {
        deltaX /= 5;
        deltaY /= 5;
      }

      /** whether user is trying to scroll mostly vertically */
      const vertical = Math.abs(deltaY) / Math.abs(deltaX) > 1.5;
      /**
       * whether user is trying to scroll mostly horizontally (usually means
       * trackpad)
       */
      const horizontal = Math.abs(deltaX) / Math.abs(deltaY) > 1.5;

      /** copy transform */
      let newTransform = { ...transform };

      if (vertical) {
        if (ctrlKey) {
          /** zoom amplitude */
          newTransform.scale.y *= scrollYPower ** -deltaY;
        } else if (shiftKey) {
          /** pan left/right */
          newTransform.translate.x += deltaY * scrollXPower;
        } else {
          const mousePercent = clientToPercent(target.getBoundingClientRect(), {
            x: clientX,
            y: clientY,
          });
          /** zoom in/out */
          const mouseSample = percentToSample(newTransform, mousePercent);
          newTransform.scale.x *= scrollYPower ** -deltaY;
          newTransform = limit(newTransform);
          /** offset left/right pan so mouse stays over same spot in waveform */
          const newMouse = percentToSample(newTransform, mousePercent);
          newTransform.translate.x +=
            (newMouse.x - mouseSample.x) * newTransform.scale.x;
        }
      } else if (horizontal) {
        /** pan left/right */
        newTransform.translate.x += deltaX * scrollXPower;
      }

      /** update transform */
      newTransform = limit(newTransform);
      setTransform(newTransform);
    },
    [transform, limit],
  );

  /**
   * debounce (or otherwise make async) to avoid "maximum update depth
   * exceeded". not caused by infinite recursion. caused by center being called
   * inside useEffect rapidly (e.g. dragging current time rapidly), changing
   * transform, causing many (but not infinite) re-renders dependent on
   * transform.
   */
  const { run: _center } = useDebounceFn(center, 10, { maxWait: 10 });

  return { transform, onWheel, center: _center };
};
