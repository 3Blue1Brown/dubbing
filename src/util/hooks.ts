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
  /** mutable non-reactive array */
  const array = useRef(new Float32Array(size));
  /** force reactivity */
  const [, setUpdate] = useState(0);

  /** resize array */
  useEffect(() => {
    const newArray = new Float32Array(size);
    newArray.set(array.current.slice(0, size));
    array.current = newArray;
  }, [size]);

  /** wrapped setter */
  const set = useCallback((newArray: Float32Array, offset = 0) => {
    /** update actual array */
    array.current.set(newArray, offset);
    /** trigger reactivity */
    setUpdate((update) => update + 1);
  }, []);

  /** reset array back to 0s */
  const reset = useCallback(() => {
    /** update actual array */
    array.current.fill(0);
    /** trigger reactivity */
    setUpdate((update) => update + 1);
  }, []);

  return [array.current, set, reset] as const;
};
