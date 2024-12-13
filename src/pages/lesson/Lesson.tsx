import { useEffect } from "react";
import { useParams } from "react-router";
import { useAtom, useAtomValue } from "jotai";
import Waveform from "@/components/Waveform";
import {
  init,
  save,
  timeAtom,
  waveformAtom,
  waveformUpdatedAtom,
} from "@/pages/lesson/audio";
import { playerAtom } from "@/pages/lesson/Player";
import Controls from "./Controls";
import { getData, sentencesAtom, videoAtom } from "./data";
import classes from "./Lesson.module.css";
import Player from "./Player";
import Sentences from "./Sentences";

const Lesson = () => {
  const video = useAtomValue(videoAtom);
  const player = useAtomValue(playerAtom);
  const sentences = useAtomValue(sentencesAtom);
  const waveform = useAtomValue(waveformAtom);
  const [time, setTime] = useAtom(timeAtom);
  useAtomValue(waveformUpdatedAtom);

  const { year = "", title = "", language = "" } = useParams();

  useEffect(() => {
    getData({ year, title, language });
    document.title = [year, title, language].join(" / ");
  }, [year, title, language]);

  useEffect(() => {
    init();
  }, []);

  if (!video || !sentences) return <></>;

  return (
    <>
      <div className={classes.lesson}>
        <Player video={video} />
        {player && (
          <>
            <Sentences />
            <Controls />
            <Waveform waveform={waveform} time={time} onSeek={setTime} />
          </>
        )}
      </div>
      <button
        className="accent"
        onClick={async () => await save([year, title, language, "dub"])}
      >
        Save
      </button>
    </>
  );
};

export default Lesson;
