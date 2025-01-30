import { useEffect, useMemo, useRef } from "react";
import {
  analyser,
  bufferSource,
  gain,
  mediaStreamSource,
  NO_OUTPUT,
  OUTPUT,
} from "virtual-audio-graph";
import type StandardVirtualAudioNode from "virtual-audio-graph/dist/VirtualAudioNodes/StandardVirtualAudioNode";
import { useInterval } from "@reactuses/core";
import { floatToAudio } from "@/audio";
import { useGraph } from "@/audio/graph";
import { updateInterval, useLesson } from "@/pages/lesson/state";
import { logSpace, power } from "@/util/math";

/** higher -> slower oscilloscope. min/max: 2^5 / 2^15 */
const fftSize = 2 ** 12;

/** https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode */
const timeSamples = fftSize;
const freqSamples = fftSize / 2;

/** node ids */
const micId = "mic";
const recorderId = "recorder";
const analyzerId = "analyzer";
const playthroughId = "playthrough";
const volumeId = "volume";

/** audio graph */
const Graph = () => {
  /** use lesson state */
  const tracks = useLesson("tracks");
  const setRecordTrack = useLesson("setRecordTrack");
  const volume = useLesson("volume");
  const micStream = useLesson("micStream");
  const micAnalByFreq = useLesson("micAnalByFreq");
  const setMicAnal = useLesson("setMicAnal");
  const playthrough = useLesson("playthrough");
  const sampleRate = useLesson("sampleRate");
  const mark = useLesson("mark");
  const playing = useLesson("playing");
  const recording = useLesson("recording");

  /** analyzer buffer */
  const analBuffer = useRef(new Uint8Array(timeSamples));

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

  /** capture raw mic audio data */
  const recorderNode = useMemo(() => {
    if (!playing || !recording) return null;
    const recorder = worklets.recorder?.(NO_OUTPUT);
    return recorder ? { recorder } : null;
  }, [worklets, playing, recording]);

  /** mic stream */
  const micNode = useMemo(
    () =>
      micStream
        ? {
            [micId]: mediaStreamSource(
              [
                ...(recorderNode ? [recorderId] : []),
                analyzerId,
                playthroughId,
              ],
              { mediaStream: micStream },
            ),
          }
        : null,
    [micStream, recorderNode],
  );

  /** mic analyzer/Analyzer */
  const analyzerNode = useMemo(
    () => ({ analyzer: analyser(NO_OUTPUT, { fftSize }) }),
    [],
  );

  /** whether to play-through mic audio to speakers */
  const playthroughNode = useMemo(
    () => ({ playthrough: gain(volumeId, { gain: playthrough ? 1 : 0 }) }),
    [playthrough],
  );

  /** existing audio tracks */
  const trackNodes = useMemo(() => {
    const nodes: Record<string, StandardVirtualAudioNode> = {};
    if (playing)
      tracks.forEach(({ muted, audio }, index) => {
        /**
         * tie node id to track # and time that playback started, such that
         * subsequent calls to graph.update (e.g. volume change) while playing
         * doesn't mess with already playing audio
         */
        const bufferId = `track-${index}-${mark.timestamp}`;
        const muteId = `track-${index}-mute`;

        nodes[bufferId] = bufferSource(muteId, {
          buffer: floatToAudio(audio, sampleRate),
          offsetTime: mark.time,
        });
        nodes[muteId] = gain(volumeId, { gain: muted ? 0 : 1 });
      });

    return nodes;
  }, [playing, tracks, mark, sampleRate]);

  /** main volume control */
  const volumeNode = useMemo(
    () => ({ volume: gain(OUTPUT, { gain: power(volume, 2) }) }),
    [volume],
  );

  useEffect(() => {
    if (!graph) return;
    if (!micStream) return;

    /** update audio graph */
    graph.update({
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
    micNode,
    analyzerNode,
    recorderNode,
    trackNodes,
    playthroughNode,
    volumeNode,
  ]);

  /** keep this after graph.update call so node id is defined */
  useEffect(() => {
    const recorder = graph?.getAudioNodeById(recorderId) as AudioWorkletNode;
    if (!recorder) return;

    /** what sample # in timeline to record to */
    let sampleOffset = mark.time * sampleRate;

    /** listen for audio worklet messages */
    recorder.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
      /** prevent last message coming in after recording stopped */
      if (!graph?.getAudioNodeById(recorderId)) return;
      /** process recorded data */
      setRecordTrack(data, sampleOffset);
      /** increment offset based on length of data returned */
      sampleOffset += data.length;
    };
  }, [graph, recorderNode, setRecordTrack, mark.time, sampleRate]);

  /** periodically get analyzer data */
  useInterval(() => {
    if (!graph) return;

    const analyzer = graph.getAudioNodeById(analyzerId);
    if (!(analyzer instanceof AnalyserNode)) return;

    if (micAnalByFreq) {
      /** fill analyzer buffer with frequency data */
      analyzer.getByteFrequencyData(analBuffer.current);

      /** transform freq analyzer data */
      let freqAnal = Array.from(analBuffer.current.slice(0, freqSamples));

      /** skip some data points for log space performance */
      freqAnal = freqAnal.filter((_, index) => index % 10 === 0);

      freqAnal = freqAnal.map(
        (value, index, array) =>
          /**
           * reduce power of lower frequencies
           * https://en.wikipedia.org/wiki/Equal-loudness_contour
           */
          (index / array.length) ** 0.5 *
          /** int to float, */
          (value / 128),
      );

      const nyquist = analyzer.context.sampleRate / 2;
      /** linearly-spaced values to logarithmically-spaced values */
      freqAnal = logSpace(freqAnal, 0, nyquist, 20, nyquist);

      setMicAnal(freqAnal);
    } else {
      /** fill analyzer buffer with time data */
      analyzer.getByteTimeDomainData(analBuffer.current);

      setMicAnal(
        /** transform time analyzer data */
        Array.from(analBuffer.current)
          /** int to float */
          .map((value) => 1 - value / 128),
      );
    }
  }, updateInterval);

  return <></>;
};

export default Graph;
