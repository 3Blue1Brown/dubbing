import { useCallback, useState } from "react";
import { clamp } from "lodash";

export const useClamped = (
  defaultValue: number,
  min = -Infinity,
  max = Infinity
) => {
  const [value, setValue] = useState(defaultValue);
  const set = useCallback(
    (value: number, options?: { min?: number; max?: number }) => {
      const newValue = clamp(value, options?.min ?? min, options?.max ?? max);
      setValue(newValue);
      return newValue;
    },
    [min, max]
  );
  return [value, set] as const;
};
