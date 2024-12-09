import { useEffect } from "react";
import { useParams } from "react-router";
import { useAtomValue } from "jotai";
import Controls from "./Controls";
import { getData, sentencesAtom, videoAtom } from "./data";
import classes from "./Lesson.module.css";
import Player from "./Player";
import Sentences from "./Sentences";
import Waveform from "./Waveform";

const Lesson = () => {
  const video = useAtomValue(videoAtom);
  const sentences = useAtomValue(sentencesAtom);

  const { year = "", title = "", language = "" } = useParams();

  useEffect(() => {
    getData({ year, title, language });
  }, [year, title, language]);

  if (!video || !sentences) return <></>;

  return (
    <div className={classes.lesson}>
      <Player video={video} />
      <Sentences />
      <Controls />
      <Waveform />
    </div>
  );
};

export default Lesson;
