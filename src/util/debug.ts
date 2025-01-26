import { useEffect, type DependencyList } from "react";

/** log when any dependencies changed */
export const useEffectLog = (deps: DependencyList) => {
  useEffect(() => {
    console.debug(deps);
  }, [deps]);
};
