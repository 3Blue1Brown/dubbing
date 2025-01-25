import { useRef, useState } from "react";
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
  /** mic play-through */
  const [playthrough, setPlaythrough] = useState(false);
  /** mic recording armed */
  const [recording, setRecording] = useState(false);
  /** audio playing */
  const [playing, setPlaying] = useState(false);
  /** main volume, [0,1] */
  const [volume, setVolume] = useState(0.5);

  /** current time, in seconds */
  const [time, setTime] = useState(0);

  /** raw audio data */
  const [tracks, setTracks] = useState<Float32Array[]>([]);

  /** should auto-scroll */
  const [autoScroll, setAutoScroll] = useState(false);
  /** show original (english) text */
  const [showOriginal, setShowOriginal] = useState(false);

  /** is currently saving output */
  const [saving, setSaving] = useState(false);

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
