import { useCallback, useRef, useState } from "react";
import { useInterval } from "@reactuses/core";
import { useMicrophone } from "@/audio/devices";
import type { PlayerRef } from "@/components/Player";
import type { Sentence } from "@/pages/lesson/data";
import { createContextWithSelectors, useContextSelector } from "@/util/state";

/** all lesson state */
export const useLessonAll = () => {
  /** player control */
  const playerRef = useRef<PlayerRef>(null);

  /** video url */
  const [video, setVideo] = useState<string>();
  /** sentence text and timings */
  const [sentences, setSentences] = useState<Sentence[]>();
  /** video length, in seconds */
  const [length, setLength] = useState<number>(60 * 60);

  /** audio sample rate */
  const [sampleRate] = useState(
    isFirefox ? new AudioContext().sampleRate : 44100,
  );

  /** mic props */
  const { devices, device, setDevice, micStream, refresh } = useMicrophone({
    sampleRate,
  });
  /** mic analyzer data */
  const [micTimeAnal, setTimeAnal] = useState<number[]>([]);
  const [micFreqAnal, setFreqAnal] = useState<number[]>([]);
  /** is mic play-through enabled */
  const [playthrough, setPlaythrough] = useState(false);
  /** is mic recording armed */
  const [recording, setRecording] = useState(false);
  /** is timeline playing */
  const [playing, _setPlaying] = useState(false);
  /** main volume, [0,1] */
  const [volume, setVolume] = useState(0.5);

  /** current time, in seconds */
  const [time, _setTime] = useState(0);

  /** show original (english) text */
  const [showOriginal, setShowOriginal] = useState(false);

  /** should auto-scroll */
  const [autoScroll, setAutoScroll] = useState(false);

  /** raw audio data */
  const [tracks, setTracks] = useState<Float32Array[]>([]);

  /** is currently saving output */
  const [saving, setSaving] = useState(false);

  /** mark when playing started or time jumped */
  const [mark, _setMark] = useState({ time: 0, timestamp: now() });

  /** mark set wrapper */
  const setMark = useCallback((time: number) => {
    _setMark({ time, timestamp: now() });
  }, []);

  /** time set wrapper */
  const setTime = useCallback(
    (time: number) => {
      setMark(time);
      _setTime(time);
    },
    [setMark],
  );

  /** playing set wrapper */
  const setPlaying = useCallback(
    (playing: boolean) => {
      _setPlaying(playing);
      setMark(time);
    },
    [setMark, time],
  );

  /** tick time */
  useInterval(
    () => {
      _setTime(mark.time + (now() - mark.timestamp) / 1000);
    },
    playing ? 20 : null,
  );

  return {
    playerRef,
    video,
    setVideo,
    sentences,
    setSentences,
    length,
    setLength,
    sampleRate,
    devices,
    device,
    setDevice,
    micStream,
    micTimeAnal,
    setTimeAnal,
    micFreqAnal,
    setFreqAnal,
    refresh,
    playthrough,
    setPlaythrough,
    recording,
    setRecording,
    playing,
    setPlaying,
    volume,
    setVolume,
    time,
    setTime,
    mark,
    tracks,
    setTracks,
    autoScroll,
    setAutoScroll,
    showOriginal,
    setShowOriginal,
    saving,
    setSaving,
  };
};

type Lesson = ReturnType<typeof useLessonAll>;

export const LessonContext = createContextWithSelectors<Lesson>({} as Lesson);

/** crudely detect firefox browser */
const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");

/** use piece of lesson data */
export const useLesson = <Key extends keyof Lesson>(key: Key) =>
  useContextSelector(LessonContext, (state) => state[key]);

/** shorthand */
const now = () => window.performance.now();
