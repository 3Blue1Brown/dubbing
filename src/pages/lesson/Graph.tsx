import { useContext, useEffect, useRef } from "react";
import {
  analyser,
  gain,
  mediaStreamDestination,
  mediaStreamSource,
} from "virtual-audio-graph";
import { useInterval } from "@reactuses/core";
import { useGraph } from "@/audio/graph";
import { LessonContext } from "@/pages/lesson";

const fftSize = 2 ** 10;

/** audio graph */
const Graph = () => {
  /** use lesson state */
  const {
    volume,
    micStream,
    setTimeAnal,
    setFreqAnal,
    playthrough,
    sampleRate,
  } = useContext(LessonContext);

  /** analyzer buffers */
  const timeAnalBuffer = useRef(new Uint8Array(fftSize));
  const freqAnalBuffer = useRef(new Uint8Array(fftSize / 2));

  /** audio nodes */
  const graph = useGraph(
    sampleRate,
    /**
     * make sure mic permissions have been successfully requested before
     * creating audio context
     * https://github.com/benji6/virtual-audio-graph/issues/265
     */
    !!micStream,
  );

  useEffect(() => {
    if (!graph) return;
    if (!micStream) return;

    /** reset audio graph */
    graph.update({});
    /** update audio graph */
    graph.update({
      stream: mediaStreamSource("analyzer", { mediaStream: micStream }),
      analyzer: analyser("playthrough", { fftSize }),
      playthrough: gain("gain", { gain: playthrough ? 1 : 0 }),
      gain: gain("output", { gain: volume }),
    });
  }, [graph, playthrough, micStream, volume]);

  /** periodically get analyzer data */
  useInterval(() => {
    if (!graph) return;
    const analyzer = graph.getAudioNodeById("analyzer");
    if (!(analyzer instanceof AnalyserNode)) return;
    analyzer.getByteTimeDomainData(timeAnalBuffer.current);
    analyzer.getByteFrequencyData(freqAnalBuffer.current);
    setTimeAnal(Array.from(timeAnalBuffer.current).map((v) => 1 - v / 128));
    setFreqAnal(Array.from(freqAnalBuffer.current).map((v) => v / 128));
  }, 1000 / 60);

  return <></>;
};

export default Graph;
