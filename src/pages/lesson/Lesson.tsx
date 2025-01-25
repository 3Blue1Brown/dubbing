import { useEffect, useRef, type ReactNode } from "react";
import { useParams } from "react-router";
import { intToFloat } from "@/audio";
import Actions from "@/pages/lesson/Actions";
import Graph from "@/pages/lesson/Graph";
import { LessonContext, useLessonAll } from "@/pages/lesson/state";
import test1 from "@/test1.raw?url";
import test2 from "@/test2.raw?url";
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

  /** load main lesson data, if not already loaded */
  if (!dataLoaded.current) {
    dataLoaded.current = true;
    getData({
      year,
      title,
      language,
    })
      .then(({ video, sentences, length }) => {
        lesson.setVideo(video);
        lesson.setSentences(sentences);
        lesson.setLength(length);
      })
      .catch(console.error);

    /** load test waveforms */
    [test1, test2].forEach((file) =>
      fetch(file)
        .then((response) => response.arrayBuffer())
        .then((buffer) => {
          lesson.setTracks((tracks) => [
            ...tracks,
            intToFloat(new Int16Array(buffer)),
          ]);
        })
        .catch(console.error),
    );
  }

  return (
    <LessonContext.Provider value={lesson}>{children}</LessonContext.Provider>
  );
};
