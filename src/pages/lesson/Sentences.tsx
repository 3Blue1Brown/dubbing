import { Fragment } from "react";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import type { Sentence, Video } from "@/pages/lesson/data";
import { playingAtom, seek, timeAtom } from "./audio";
import classes from "./Sentences.module.css";

type Props = {
  video: Video;
  sentences: Sentence[];
  showOriginal: boolean;
  autoScroll: boolean;
};

/** translation sentences */
const Sentences = ({ video, sentences, showOriginal, autoScroll }: Props) => {
  const playing = useAtomValue(playingAtom);
  const time = useAtomValue(timeAtom);

  if (!video || !sentences) return <></>;

  return (
    <div className={classes.sentences}>
      {sentences.map(({ translation, original }, index) => (
        <div key={index} className={classes.words}>
          {(showOriginal ? original : translation).map(
            ({ text, start, end }, index) => {
              /** get time state of word */
              let state = "";
              if (time < start) state = "future";
              else if (time < end) state = "present";
              else state = "past";

              return (
                <Fragment key={index}>
                  <span
                    ref={(el) => {
                      if (el && state === "present" && autoScroll)
                        el.scrollIntoView({
                          block: "center",
                          behavior: playing ? "smooth" : "instant",
                        });
                    }}
                    className={clsx(
                      classes.word,
                      state === "past" && classes.past,
                      state === "present" && classes.present,
                      state === "future" && classes.future,
                    )}
                    style={{
                      opacity: playing
                        ? 0.25 + 1.25 ** -Math.abs(time - (end + start) / 2)
                        : 1,
                    }}
                    onClick={() => seek(start)}
                  >
                    {text}
                  </span>{" "}
                </Fragment>
              );
            },
          )}
        </div>
      ))}
    </div>
  );
};

export default Sentences;
