import { useEffect, useRef, type ReactNode } from "react";
import { useParams } from "react-router";
import { intToFloat } from "@/audio";
import Actions from "@/pages/lesson/Actions";
import Graph from "@/pages/lesson/Graph";
import { LessonContext, useLessonAll } from "@/pages/lesson/state";
import test from "@/test.raw?url";
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

  const dataLoaded = useRef(false);

  useEffect(() => {
    if (dataLoaded.current) return;

    (async () => {
      /** load main lesson data, if not already loaded */
      const { video, sentences, length } = await getData({
        year,
        title,
        language,
      });

      lesson.setVideo(video);
      lesson.setSentences(sentences);
      lesson.setLength(length);

      /** load test waveforms */
      const testTracks = (
        await Promise.all([test].map((file) => request(file, "arrayBuffer")))
      ).map((buffer) => intToFloat(new Int16Array(buffer)));
      lesson.setTracks((tracks) => [...tracks, ...testTracks]);
    })().catch(console.error);

    dataLoaded.current = true;
  }, [lesson, year, title, language]);

  return (
    <LessonContext.Provider value={lesson}>{children}</LessonContext.Provider>
  );
};
