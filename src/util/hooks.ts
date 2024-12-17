import { useRef } from "react";
import { useEventListener } from "@reactuses/core";

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
