import { useEffect, useMemo, useRef } from "react";
import {
  analyser,
  bufferSource,
  gain,
  mediaStreamDestination,
  mediaStreamSource,
} from "virtual-audio-graph";
import type { IVirtualAudioNodeGraph } from "virtual-audio-graph/dist/types";
import { useInterval } from "@reactuses/core";
import { floatToAudio } from "@/audio";
import { useGraph } from "@/audio/graph";
import { updateInterval, useLesson } from "@/pages/lesson/state";
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
  const recording = useLesson("recording");

  /** analyzer buffers */
  const timeAnalBuffer = useRef(new Uint8Array(fftSize));
  const freqAnalBuffer = useRef(new Uint8Array(fftSize / 2));

  const { graph, worklets } = useGraph(
    sampleRate,
    /**
     * make sure mic permissions have been successfully requested before
     * creating audio context
     * https://github.com/benji6/virtual-audio-graph/issues/265
     */
    !!micStream,
  );

  /** https://github.com/benji6/virtual-audio-graph/issues/265 */
  const noOutputNode = useMemo<IVirtualAudioNodeGraph>(
    () => ({ "no-output": mediaStreamDestination() }),
    [],
  );

  /** mic stream */
  const micNode = useMemo<IVirtualAudioNodeGraph>(
    () => ({
      mic: mediaStreamSource(["recorder", "analyzer", "playthrough"], {
        mediaStream: micStream,
      }),
    }),
    [micStream],
  );

  /** mic analyzer/monitor */
  const analyzerNode = useMemo<IVirtualAudioNodeGraph>(
    () => ({ analyzer: analyser("no-output", { fftSize }) }),
    [],
  );

  /** node to capture raw mic audio data */
  const recorderNode = useMemo<IVirtualAudioNodeGraph>(
    () =>
      recording && worklets.recorder
        ? { recorder: worklets.recorder("no-output") }
        : ({} as IVirtualAudioNodeGraph),
    [worklets, recording],
  );

  /** whether to play-through mic audio to speakers */
  const playthroughNode = useMemo<IVirtualAudioNodeGraph>(
    () => ({ playthrough: gain("volume", { gain: playthrough ? 1 : 0 }) }),
    [playthrough],
  );

  /** existing audio tracks */
  const trackNodes = useMemo<IVirtualAudioNodeGraph>(
    () =>
      playing
        ? Object.fromEntries(
            tracks.map((track, index) => [
              /**
               * tie node id to track # and time that playback started, such
               * that subsequent calls to graph.update (e.g. volume change)
               * while playing doesn't mess with already playing audio
               */
              `track-${index}-${mark.timestamp}`,
              /** node contents */
              bufferSource("volume", {
                buffer: floatToAudio(track, sampleRate),
                offsetTime: mark.time,
              }),
            ]),
          )
        : {},
    [playing, tracks, mark, sampleRate],
  );

  /** main volume control */
  const volumeNode = useMemo(
    () => ({ volume: gain("output", { gain: power(volume, 2) }) }),
    [volume],
  );

  useEffect(() => {
    if (!graph) return;
    if (!micStream) return;

    /** update audio graph */
    graph.update({
      ...noOutputNode,
      ...micNode,
      ...analyzerNode,
      ...recorderNode,
      ...trackNodes,
      ...playthroughNode,
      ...volumeNode,
    });
  }, [
    graph,
    micStream,
    noOutputNode,
    micNode,
    analyzerNode,
    recorderNode,
    trackNodes,
    playthroughNode,
    volumeNode,
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
  }, updateInterval);

  return <></>;
};

export default Graph;
