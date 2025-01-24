import { useCallback, useEffect, useState } from "react";
import createVirtualAudioGraph from "virtual-audio-graph";
import type VirtualAudioGraph from "virtual-audio-graph/dist/VirtualAudioGraph";

/** use audio graph */
export const useGraph = (sampleRate: number, shouldInit: boolean) => {
  const [graph, setGraph] = useState<VirtualAudioGraph>();

  /** create audio context and virtual audio graph */
  const init = useCallback(() => {
    const context = new AudioContext({ sampleRate });
    setGraph(
      createVirtualAudioGraph({
        audioContext: context,
        output: context.destination,
      }),
    );
  }, [sampleRate]);

  /** init when ready */
  useEffect(() => {
    if (shouldInit) init();
  }, [shouldInit, init]);

  /** init on user gesture */
  // useEventListener("click", resume);
  // useEventListener("mousedown", resume);
  // useEventListener("touchstart", resume);
  // useEventListener("keydown", resume);

  return graph;
};
