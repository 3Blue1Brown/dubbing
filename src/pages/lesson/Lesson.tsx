import { useEffect } from "react";
import { useParams } from "react-router";
import { useAtomValue } from "jotai";
import { playerAtom } from "@/pages/lesson/state";
import Controls from "./Controls";
import { getData, sentencesAtom, videoAtom } from "./data";
import classes from "./Lesson.module.css";
import Player from "./Player";
import Sentences from "./Sentences";
import Waveform from "./Waveform";

const Lesson = () => {
  const video = useAtomValue(videoAtom);
  const player = useAtomValue(playerAtom);
  const sentences = useAtomValue(sentencesAtom);

  const { year = "", title = "", language = "" } = useParams();

  useEffect(() => {
    getData({ year, title, language });
    document.title = [year, title, language].join(" / ");
  }, [year, title, language]);

  if (!video || !sentences) return <></>;

  return (
    <div className={classes.lesson}>
      <Player video={video} />
      {player && (
        <>
          <Sentences />
          <Controls />
          <Waveform />
        </>
      )}
    </div>
  );
};

export default Lesson;
