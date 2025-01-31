import { useEffect, useRef, type ReactNode } from "react";
import { useLocation, useParams } from "react-router";
import Actions from "@/pages/lesson/Actions";
import Debug from "@/pages/lesson/Debug";
import Graph from "@/pages/lesson/Graph";
import { LessonContext, useLessonAll } from "@/pages/lesson/state";
import Controls from "./Controls";
import { fetchData, parseData } from "./data";
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
      <Debug />
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
  const { state } = useLocation();

  /** update tab title */
  useEffect(() => {
    document.title = [year, title, language].join(" / ");
  }, [year, title, language]);

  const { setVideo, setSentences, setLength } = lesson;

  /** only load data once */
  const dataLoaded = useRef(false);

  useEffect(() => {
    if (dataLoaded.current) return;

    /** load main lesson data */
    (async () => {
      /** load raw data from state object, or fetch based on url params */
      const data = state ?? (await fetchData({ year, title, language }));
      const { video, sentences, length } = await parseData(data);
      console.log(data);
      setVideo(video);
      setSentences(sentences);
      setLength(length);
    })().catch(console.error);

    dataLoaded.current = true;
  }, [state, year, title, language, setVideo, setSentences, setLength]);

  return (
    <LessonContext.Provider value={lesson}>{children}</LessonContext.Provider>
  );
};
