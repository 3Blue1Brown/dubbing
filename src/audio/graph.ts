import { useCallback, useEffect, useState } from "react";
import createVirtualAudioGraph, {
  createWorkletNode,
} from "virtual-audio-graph";
import type VirtualAudioGraph from "virtual-audio-graph/dist/VirtualAudioGraph";
import recorder from "@/audio/recorder.js?url";

/** use audio graph */
export const useGraph = (sampleRate: number, shouldInit: boolean) => {
  const [graph, setGraph] = useState<VirtualAudioGraph>();
  const [worklets, setWorklets] = useState<
    Record<string, ReturnType<typeof createWorkletNode>>
  >({});

  /** create audio context and virtual audio graph */
  const init = useCallback(async () => {
    /** init audio context */
    const context = new AudioContext({ sampleRate });

    /** init virtual audio graph */
    const graph = createVirtualAudioGraph({
      audioContext: context,
      output: context.destination,
    });

    /** set up worklets */
    await context.audioWorklet.addModule(recorder);
    setWorklets({
      recorder: createWorkletNode("recorder"),
    });

    setGraph(graph);
  }, [sampleRate]);

  useEffect(() => {
    /** if ready, and not already init'ed */
    if (shouldInit && !graph) init().catch(console.error);
  }, [shouldInit, graph, init]);

  return { graph, worklets };
};
