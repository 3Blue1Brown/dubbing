import { useEffect, useRef, useState } from "react";
import { CgSpinnerTwoAlt } from "react-icons/cg";
import { LuDownload } from "react-icons/lu";
import { useParams } from "react-router";
import { useAtomValue } from "jotai";
import Button from "@/components/Button";
import type { PlayerRef } from "@/components/Player";
import Player from "@/components/Player";
import Waveform from "@/components/Waveform";
import {
  init,
  lengthAtom,
  playingAtom,
  sampleRateAtom,
  seek,
  timeAtom,
  waveformAtom,
  waveformUpdatedAtom,
} from "@/pages/lesson/audio";
import { setAtom } from "@/util/atoms";
import { saveMp3 } from "@/util/download";
import Controls from "./Controls";
import { getData, type Sentence } from "./data";
import classes from "./Lesson.module.css";
import Sentences from "./Sentences";

/** lesson page root */
const Lesson = () => {
  const playerRef = useRef<PlayerRef>(null);

  /** video url */
  const [video, setVideo] = useState<string>();
  /** sentence text and timings */
  const [sentences, setSentences] = useState<Sentence[]>();
  /** video length, in seconds */
  const [length, setLength] = useState<number>(1);

  /** should auto-scroll */
  const [autoScroll, setAutoScroll] = useState(true);
  /** show original (english) text */
  const [showOriginal, setShowOriginal] = useState(false);

  /** is currently saving output */
  const [saving, setSaving] = useState(false);

  const waveform = useAtomValue(waveformAtom);
  const playing = useAtomValue(playingAtom);
  const time = useAtomValue(timeAtom);
  const sampleRate = useAtomValue(sampleRateAtom);

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
        /** temporary */
        setAtom(lengthAtom, length);
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
        <Player ref={playerRef} video={video} />
        <Sentences
          video={video}
          sentences={sentences}
          showOriginal={showOriginal}
          autoScroll={autoScroll}
        />
        <Controls
          length={length}
          showOriginal={showOriginal}
          setShowOriginal={setShowOriginal}
          autoScroll={autoScroll}
          setAutoScroll={setAutoScroll}
        />
        <Waveform
          waveform={waveform}
          playing={playing}
          time={time}
          sampleRate={sampleRate}
          autoScroll={autoScroll}
          onSeek={seek}
        />
      </div>
      <Button
        accent
        disabled={saving}
        onClick={() => {
          setSaving(true);
          saveMp3(
            waveform,
            {
              channels: 1,
              sampleRate,
              bitrate: 192,
            },
            [year, title, language, "dub"],
          )
            .catch(console.error)
            .finally(() => setSaving(false));
        }}
      >
        <span>{saving ? "Saving" : "Save"}</span>
        {saving ? <CgSpinnerTwoAlt className="spin" /> : <LuDownload />}
      </Button>
    </>
  );
};

export default Lesson;
