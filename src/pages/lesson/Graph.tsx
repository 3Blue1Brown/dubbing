import { useEffect, useMemo, useRef } from "react";
import {
  analyser,
  bufferSource,
  gain,
  mediaStreamDestination,
  mediaStreamSource,
} from "virtual-audio-graph";
import { useInterval } from "@reactuses/core";
import { floatToAudio } from "@/audio";
import { useGraph } from "@/audio/graph";
import { updateInterval, useLesson } from "@/pages/lesson/state";
import { power } from "@/util/math";

/** higher -> slower oscilloscope */
const fftSize = 2 ** 12;
/** min/max: 2^5 / 2^15 */

/** audio graph */
const Graph = () => {
  /** use lesson state */
  const tracks = useLesson("tracks");
  const setRecordTrack = useLesson("setRecordTrack");
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

  /** virtual audio graph */
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
  const noOutputNode = useMemo(
    () => ({ "no-output": mediaStreamDestination() }),
    [],
  );

  /** capture raw mic audio data */
  const recorderNode = useMemo(() => {
    if (!playing || !recording) return null;
    const recorder = worklets.recorder?.("no-output");
    return recorder ? { recorder } : null;
  }, [worklets, playing, recording]);

  /** mic stream */
  const micNode = useMemo(
    () =>
      micStream
        ? {
            mic: mediaStreamSource(
              [
                ...(recorderNode ? ["recorder"] : []),
                "analyzer",
                "playthrough",
              ],
              { mediaStream: micStream },
            ),
          }
        : null,
    [micStream, recorderNode],
  );

  /** mic analyzer/monitor */
  const analyzerNode = useMemo(
    () => ({ analyzer: analyser("no-output", { fftSize }) }),
    [],
  );

  /** whether to play-through mic audio to speakers */
  const playthroughNode = useMemo(
    () => ({ playthrough: gain("volume", { gain: playthrough ? 1 : 0 }) }),
    [playthrough],
  );

  /** existing audio tracks */
  const trackNodes = useMemo(
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

  /** keep this after graph.update call so node id is defined */
  useEffect(() => {
    const recorder = graph?.getAudioNodeById("recorder") as AudioWorkletNode;
    if (!recorder) return;

    /** what sample # in timeline to record to */
    let sampleOffset = mark.time * sampleRate;

    /** listen for audio worklet messages */
    recorder.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
      /** prevent last message coming in after recording stopped */
      if (!graph?.getAudioNodeById("recorder")) return;
      /** process recorded data */
      setRecordTrack(data, sampleOffset);
      /** increment offset based on length of data returned */
      sampleOffset += data.length;
    };
  }, [graph, recorderNode, setRecordTrack, mark.time, sampleRate]);

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
