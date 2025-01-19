import { useRef } from "react";
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
