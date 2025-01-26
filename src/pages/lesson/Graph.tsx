import { useEffect, useRef } from "react";
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
import { power } from "@/util/math";

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
  const mark = useLesson("mark");
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

    /** audio track nodes */
    const trackNodes = playing
      ? Object.fromEntries(
          tracks.map((track, index) => [
            /**
             * tie node id to track # and time that playback started, such that
             * subsequent calls to graph.update (e.g. volume change) while
             * playing doesn't mess with already playing audio
             */
            `track-${index}-${mark.timestamp}`,
            /** node contents */
            bufferSource("gain", {
              buffer: floatToAudio(track, sampleRate),
              offsetTime: mark.time,
            }),
          ]),
        )
      : {};

    /** update audio graph */
    graph.update({
      /** mic node */
      mic: mediaStreamSource("analyzer", { mediaStream: micStream }),
      /** analyzer node */
      analyzer: analyser("playthrough", { fftSize }),
      ...trackNodes,
      /** playthrough toggle node */
      playthrough: gain("gain", { gain: playthrough ? 1 : 0 }),
      /** gain node */
      gain: gain("output", { gain: power(volume, 2) }),
    });
  }, [
    graph,
    tracks,
    playthrough,
    micStream,
    volume,
    sampleRate,
    mark,
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
