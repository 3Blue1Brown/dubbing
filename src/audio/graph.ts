import { useCallback, useState } from "react";
import createVirtualAudioGraph from "virtual-audio-graph";
import type VirtualAudioGraph from "virtual-audio-graph/dist/VirtualAudioGraph";
import { useEventListener } from "@reactuses/core";

/** use audio graph */
export const useGraph = (sampleRate: number) => {
  const [graph, setGraph] = useState<VirtualAudioGraph>();

  /** create */
  const init = useCallback(() => {
    const context = new AudioContext({ sampleRate });
    setGraph(
      createVirtualAudioGraph({
        audioContext: context,
        output: context.destination,
      }),
    );
  }, [sampleRate]);

  /** init on user gesture */
  useEventListener("click", init);
  useEventListener("mousedown", init);
  useEventListener("touchstart", init);
  useEventListener("keydown", init);

  return graph;
};
