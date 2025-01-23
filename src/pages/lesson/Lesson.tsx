import { useEffect, type ReactNode } from "react";
import { useParams } from "react-router";
import { LessonContext, useLesson } from "@/pages/lesson";
import Actions from "@/pages/lesson/Actions";
import Controls from "./Controls";
import { getData } from "./data";
import classes from "./Lesson.module.css";
import Player from "./Player";
import Sentences from "./Sentences";
import Waveform from "./Waveform";

const LessonProvider = ({ children }: { children: ReactNode }) => {
  const lesson = useLesson();

  /** get url params */
  const { year = "", title = "", language = "" } = useParams();

  /** update tab title */
  useEffect(() => {
    document.title = [year, title, language].join(" / ");
  }, [year, title, language]);

  /** load main lesson data */
  useEffect(() => {
    let latest = true;

    if (!lesson.sentences)
      getData({
        year,
        title,
        language,
      })
        .then(({ video, sentences, length }) => {
          if (!latest) return;
          lesson.setVideo(video);
          lesson.setSentences(sentences);
          lesson.setLength(length);
        })
        .catch(console.error);

    return () => {
      latest = false;
    };
  }, [lesson, year, title, language]);

  return (
    <LessonContext.Provider value={lesson}>{children}</LessonContext.Provider>
  );
};

/** lesson page root */
const Lesson = () => {
  return (
    <LessonProvider>
      <div className={classes.top}>
        <Player />
        <Sentences />
      </div>
      <Controls />
      <Waveform />
      <Actions />
    </LessonProvider>
  );
};

export default Lesson;
