import { useEffect, useRef, type ReactNode } from "react";
import { useParams } from "react-router";
import Actions from "@/pages/lesson/Actions";
import Graph from "@/pages/lesson/Graph";
import { LessonContext, useLessonAll } from "@/pages/lesson/state";
import test from "@/test.wav?url";
import { request } from "@/util/request";
import Controls from "./Controls";
import { getData } from "./data";
import classes from "./Lesson.module.css";
import Player from "./Player";
import Sentences from "./Sentences";
import Tracks from "./Tracks";

/** lesson page */
const Lesson = () => {
  return (
    <LessonProvider>
      <div className={classes.top}>
        <Player />
        <Sentences />
      </div>
      <Controls />
      <Tracks />
      <Actions />
      <Graph />
    </LessonProvider>
  );
};

export default Lesson;

/**
 * wrap root in provider with children slot to avoid cascade-rendering entire
 * page every time lesson state provider value changes
 */
const LessonProvider = ({ children }: { children: ReactNode }) => {
  /** use all lesson state */
  const lesson = useLessonAll();

  /** get use params */
  const { year = "", title = "", language = "" } = useParams();

  /** update tab title */
  useEffect(() => {
    document.title = [year, title, language].join(" / ");
  }, [year, title, language]);

  const {
    setVideo,
    setSentences,
    setLength,
    sampleRate,
    setTracks,
    micStream,
  } = lesson;

  /** only load data once */
  const dataLoaded = useRef(false);

  useEffect(() => {
    if (dataLoaded.current) return;

    (async () => {
      /** load main lesson data */
      const { video, sentences, length } = await getData({
        year,
        title,
        language,
      });

      setVideo(video);
      setSentences(sentences);
      setLength(length);
    })().catch(console.error);

    dataLoaded.current = true;
  }, [year, title, language, setVideo, setSentences, setLength]);

  /** only load test tracks once */
  const testLoaded = useRef(false);

  useEffect(() => {
    if (testLoaded.current) return;

    /** if not on "final" sample rate, don't load */
    if (!micStream) return;

    /** load test waveforms */
    (async () => {
      const decoder = new AudioContext({ sampleRate });
      const testTracks = await Promise.all(
        [test, test, test].map(async (file, index) => ({
          name: `Test track ${index + 1}`,
          muted: true,
          audio: (
            await decoder.decodeAudioData(await request(file, "arrayBuffer"))
          ).getChannelData(0),
        })),
      );
      setTracks((tracks) => [...tracks, ...testTracks]);
    })().catch(console.error);

    testLoaded.current = true;
  }, [micStream, sampleRate, setTracks]);

  return (
    <LessonContext.Provider value={lesson}>{children}</LessonContext.Provider>
  );
};
