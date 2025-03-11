import { useCallback, useEffect, useRef, useState } from "react";
import { useEventListener } from "@reactuses/core";

/** conveniently add keyboard shortcut to button click event */
export const useShortcutClick = <Ref extends HTMLElement = HTMLElement>(
  key: string,
) => {
  const ref = useRef<Ref>(null);

  useEventListener("keydown", (event: KeyboardEvent) => {
    /** don't interfere with e.g. input controls */
    if (document.activeElement !== document.body) return;

    if (event.key === key) {
      ref.current?.click();
      event.preventDefault();
    }
  });

  return ref;
};

/** https://github.com/facebook/react/issues/14490#issuecomment-451924162 */
const empty = new Float32Array(0);

/** reactive typed array */
export const useTypedArray = (size = 0) => {
  const array = useRef(empty);
  const [updated, setUpdated] = useState(0);

  /** init array */
  if (array.current === empty) array.current = new Float32Array(size);

  /** increment updated key */
  const update = useCallback(() => setUpdated((update) => update + 1), []);

  /** resize array */
  useEffect(() => {
    const newArray = new Float32Array(size);
    newArray.set(array.current.slice(0, size));
    array.current = newArray;
    update();
  }, [size, update]);

  /** wrapped setter */
  const set = useCallback(
    (newArray: Float32Array, offset = 0) => {
      if (offset > array.current.length - 1) return;
      array.current.set(
        /**
         * if new array + offset extends beyond current array, trim off excess
         * to avoid range error
         */
        newArray.slice(0, Math.max(0, array.current.length - 1 - offset)),
        offset,
      );
      update();
    },
    [update],
  );

  /** reset array back to 0s */
  const reset = useCallback(() => {
    array.current.fill(0);
    update();
  }, [update]);

  return [array.current, updated, set, reset] as const;
};
