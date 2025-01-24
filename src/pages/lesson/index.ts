import { createContext, useRef, useState } from "react";
import { bitDepth } from "@/audio";
import { useMicrophone } from "@/audio/devices";
import type { PlayerRef } from "@/components/Player";
import type { Sentence } from "@/pages/lesson/data";

/** all lesson state */
export const useLesson = () => {
  /** player control */
  const playerRef = useRef<PlayerRef>(null);

  /** video url */
  const [video, setVideo] = useState<string>();
  /** sentence text and timings */
  const [sentences, setSentences] = useState<Sentence[]>();
  /** video length, in seconds */
  const [length, setLength] = useState<number>(300);

  /** audio sample rate */
  const [sampleRate] = useState(
    isFirefox ? new AudioContext().sampleRate : 44100,
  );

  /** mic props */
  const { devices, device, setDevice, micStream, refresh } = useMicrophone({
    sampleRate,
    bitDepth,
  });
  /** mic analyzer data */
  const [micTimeAnal, setMicTimeAnal] = useState<number[]>([]);
  const [micFreqAnal, setMicFreqAnal] = useState<number[]>([]);
  /** mic play-through */
  const [playthrough, setPlaythrough] = useState(false);
  /** mic recording armed */
  const [recording, setRecording] = useState(false);
  /** audio playing */
  const [playing, setPlaying] = useState(false);
  /** main volume, [0,1] */
  const [volume, setVolume] = useState(0);

  /** current time, in seconds */
  const [time, setTime] = useState(0);

  /** raw audio data */
  const [waveform, setWaveform] = useState(new Int16Array(length * sampleRate));

  /** should auto-scroll */
  const [autoScroll, setAutoScroll] = useState(true);
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
    setMicTimeAnal,
    micFreqAnal,
    setMicFreqAnal,
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
    waveform,
    setWaveform,
    autoScroll,
    setAutoScroll,
    showOriginal,
    setShowOriginal,
    saving,
    setSaving,
  };
};

type LessonState = ReturnType<typeof useLesson>;

export const LessonContext = createContext<LessonState>({} as LessonState);

/** crudely detect firefox browser */
const isFirefox = navigator.userAgent.toLowerCase().includes("firefox");
