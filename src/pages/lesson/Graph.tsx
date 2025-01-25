import { useContext, useEffect, useRef } from "react";
import {
  analyser,
  bufferSource,
  gain,
  mediaStreamSource,
} from "virtual-audio-graph";
import { useInterval } from "@reactuses/core";
import { floatToAudio } from "@/audio";
import { useGraph } from "@/audio/graph";
import { LessonContext } from "@/pages/lesson";

const fftSize = 2 ** 10;

/** audio graph */
const Graph = () => {
  /** use lesson state */
  const {
    tracks,
    volume,
    micStream,
    setTimeAnal,
    setFreqAnal,
    playthrough,
    sampleRate,
    time,
    playing,
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

    const trackNodes = playing
      ? Object.fromEntries(
          tracks.map((track, index) => [
            "track" + index,
            bufferSource("gain", {
              buffer: floatToAudio(track, sampleRate),
              offsetTime: time,
            }),
          ]),
        )
      : {};

    /** reset audio graph */
    graph.update({});
    /** update audio graph */
    graph.update({
      stream: mediaStreamSource("analyzer", { mediaStream: micStream }),
      analyzer: analyser("playthrough", { fftSize }),
      ...trackNodes,
      playthrough: gain("gain", { gain: playthrough ? 1 : 0 }),
      gain: gain("output", { gain: volume }),
    });
  }, [
    graph,
    tracks,
    playthrough,
    micStream,
    volume,
    sampleRate,
    time,
    playing,
  ]);

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
