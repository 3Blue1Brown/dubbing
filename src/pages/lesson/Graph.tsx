import { useEffect, useRef } from "react";
import { uniqueId } from "lodash";
import {
  analyser,
  bufferSource,
  gain,
  mediaStreamSource,
} from "virtual-audio-graph";
import { useInterval } from "@reactuses/core";
import { floatToAudio } from "@/audio";
import { useGraph } from "@/audio/graph";
import { useLesson } from "@/pages/lesson/state";

const fftSize = 2 ** 10;

/** audio graph */
const Graph = () => {
  /** use lesson state */
  const tracks = useLesson("tracks");
  const volume = useLesson("volume");
  const micStream = useLesson("micStream");
  const setTimeAnal = useLesson("setTimeAnal");
  const setFreqAnal = useLesson("setFreqAnal");
  const playthrough = useLesson("playthrough");
  const sampleRate = useLesson("sampleRate");
  const time = useLesson("time");
  const playing = useLesson("playing");

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

    /** track buffer sources */
    const trackNodes = playing
      ? Object.fromEntries(
          tracks.map((track) => [
            uniqueId(),
            bufferSource("gain", {
              buffer: floatToAudio(track, sampleRate),
              offsetTime: time,
            }),
          ]),
        )
      : {};

    /** update audio graph */
    graph.update({
      [uniqueId()]: mediaStreamSource("analyzer", { mediaStream: micStream }),
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
