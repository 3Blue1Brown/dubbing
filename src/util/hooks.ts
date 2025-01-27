import { useCallback, useEffect, useRef, useState } from "react";
import { useEventListener } from "@reactuses/core";

/** conveniently add keyboard shortcut to button click event */
export const useShortcutClick = <Ref extends HTMLElement = HTMLElement>(
  key: string,
) => {
  const ref = useRef<Ref>(null);

  useEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === key) {
      ref.current?.click();
      event.preventDefault();
    }
  });

  return ref;
};

/** reactive typed array */
export const useTypedArray = (size = 0) => {
  const array = useRef(new Float32Array(size));
  const [updated, setUpdated] = useState(0);

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
      array.current.set(newArray, offset);
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
