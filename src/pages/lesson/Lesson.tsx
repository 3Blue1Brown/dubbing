import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useAtomValue } from "jotai";
import Waveform from "@/components/Waveform";
import {
  autoScrollAtom,
  init,
  playingAtom,
  sampleRateAtom,
  save,
  seek,
  timeAtom,
  waveformAtom,
  waveformUpdatedAtom,
} from "@/pages/lesson/audio";
import Controls from "./Controls";
import { getData, type Sentence } from "./data";
import classes from "./Lesson.module.css";
import Player from "./Player";
import Sentences from "./Sentences";

/** lesson page root */
const Lesson = () => {
  const [video, setVideo] = useState<string>();
  const [sentences, setSentences] = useState<Sentence[]>();
  const [length, setLength] = useState<number>(1);

  const waveform = useAtomValue(waveformAtom);
  const playing = useAtomValue(playingAtom);
  const time = useAtomValue(timeAtom);
  const sampleRate = useAtomValue(sampleRateAtom);
  const autoScroll = useAtomValue(autoScrollAtom);
  useAtomValue(waveformUpdatedAtom);

  /** get url params */
  const { year = "", title = "", language = "" } = useParams();

  /** update tab title */
  useEffect(() => {
    document.title = [year, title, language].join(" / ");
  }, [year, title, language]);

  /** load main lesson data */
  useEffect(() => {
    let latest = true;

    getData({
      year,
      title,
      language,
    })
      .then(({ video, sentences, length }) => {
        if (!latest) return;
        setVideo(video);
        setSentences(sentences);
        setLength(length);
      })
      .catch(console.error);

    return () => {
      latest = false;
    };
  }, [year, title, language]);

  useEffect(() => {
    void init();
  }, []);

  if (!video || !sentences) return <></>;

  return (
    <>
      <div className={classes.lesson}>
        <Player video={video} />
        <Sentences video={video} sentences={sentences} />
        <Controls length={length} />
        <Waveform
          waveform={waveform}
          playing={playing}
          time={time}
          sampleRate={sampleRate}
          autoScroll={autoScroll}
          onSeek={seek}
        />
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
