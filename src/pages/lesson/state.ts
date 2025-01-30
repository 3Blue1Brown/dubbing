import { useCallback, useRef, useState } from "react";
import { useInterval } from "@reactuses/core";
import { useMicrophone } from "@/audio/devices";
import type { PlayerRef } from "@/components/Player";
import type { Sentence } from "@/pages/lesson/data";
import { useTypedArray } from "@/util/hooks";
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

  /** is mic play-through enabled */
  const [playthrough, setPlaythrough] = useState(false);
  /** mic analyzer data */
  const [micAnal, setMicAnal] = useState<number[]>([]);
  /** whether to show frequency or time data for analyzer */
  const [micAnalByFreq, setMicAnalByFreq] = useState(true);
  /** is mic recording armed */
  const [recording, _setRecording] = useState(false);
  /** is timeline playing */
  const [playing, _setPlaying] = useState(false);
  /** main volume, [0,1] */
  const [volume, setVolume] = useState(0.5);

  /** current time, in seconds */
  const [time, _setTime] = useState(0);

  /** show original (english) text */
  const [showOriginal, setShowOriginal] = useState(false);

  /** should auto-scroll */
  const [autoScroll, setAutoScroll] = useState(true);

  /** audio tracks */
  const [tracks, setTracks] = useState<
    { name: string; muted: boolean; audio: Float32Array }[]
  >([]);

  /** track specifically to hold recording */
  const [recordTrack, recordTrackUpdated, setRecordTrack, resetRecordTrack] =
    useTypedArray(length * sampleRate);

  /** update props of a track or all tracks */
  const updateTrack = useCallback(
    (index: number, props: Partial<(typeof tracks)[number]>) => {
      setTracks((tracks) => {
        /** set all tracks */
        if (index < 0) return tracks.map((track) => ({ ...track, ...props }));
        else {
          /** set one track */
          if (tracks[index]) tracks[index] = { ...tracks[index], ...props };
          return [...tracks];
        }
      });
    },
    [],
  );

  /** delete track */
  const deleteTrack = useCallback((index: number) => {
    setTracks((tracks) => {
      tracks.splice(index, 1);
      return [...tracks];
    });
  }, []);

  /** is currently saving output */
  const [saving, setSaving] = useState(false);

  /** mark when playing started or time jumped */
  const [mark, _setMark] = useState({ time: 0, timestamp: now() });

  /** mark set wrapper */
  const setMark = useCallback((time: number) => {
    _setMark({ time, timestamp: now() });
  }, []);

  /** "commit" recorded audio to new track */
  const commitRecording = useCallback(() => {
    /** find index of last sample that is non-0 to trim off tail silence */
    const lastSignal = recordTrack.findLastIndex(Boolean);
    /** trim off */
    const clone = new Float32Array(recordTrack.slice(0, lastSignal));
    /** add new track */
    setTracks((tracks) =>
      tracks.concat([
        {
          name: `Track ${tracks.length + 1}`,
          muted: false,
          audio: clone,
        },
      ]),
    );
    /** reset recording buffer */
    resetRecordTrack();
  }, [recordTrack, resetRecordTrack]);

  /** recording set wrapper */
  const setRecording = useCallback(
    (recording: boolean) => {
      _setRecording(recording);
      setMark(time);
      if (!recording && playing) commitRecording();
    },
    [setMark, time, playing, commitRecording],
  );

  /** playing set wrapper */
  const setPlaying = useCallback(
    (playing: boolean) => {
      _setPlaying(playing);
      setMark(time);
      if (recording && !playing) commitRecording();
      if (playing) playerRef.current?.play().catch(console.error);
      else playerRef.current?.pause().catch(console.error);
    },
    [setMark, time, recording, commitRecording],
  );

  /** time set wrapper */
  const setTime = useCallback(
    (time: number) => {
      setMark(time);
      _setTime(time);
      playerRef.current?.seek(time).catch(console.error);
    },
    [setMark],
  );

  /** tick time */
  useInterval(
    () => {
      const newTime = mark.time + (now() - mark.timestamp) / 1000;
      if (newTime > length) setPlaying(false);
      else _setTime(newTime);
    },
    playing ? updateInterval : null,
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
    micAnal,
    setMicAnal,
    micAnalByFreq,
    setMicAnalByFreq,
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
    updateTrack,
    deleteTrack,
    recordTrack,
    setRecordTrack,
    recordTrackUpdated,
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

/** timestamp shorthand */
const now = () => window.performance.now();

/** update frequency of UI in ms, i.e. for current time, freq analyzer, etc. */
export const updateInterval =
  1000 /
  /** fps */
  30;
