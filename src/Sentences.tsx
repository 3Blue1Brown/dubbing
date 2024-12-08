import { Fragment } from "react";
import { useAtomValue } from "jotai";
import { sentencesAtom, videoAtom, type Sentence } from "./data";
import { seek, timeAtom } from "./Player";
import classes from "./Sentences.module.css";
import clsx from "clsx";

const Sentences = () => {
  const video = useAtomValue(videoAtom);
  const sentences = useAtomValue(sentencesAtom);

  if (!video || !sentences) return <></>;

  return (
    <div className={classes.sentences}>
      {sentences.map(({ translation }, index) => (
        <Fragment key={index}>
          <Words words={translation} />
          {/* <Words words={original} /> */}
        </Fragment>
      ))}
    </div>
  );
};

export default Sentences;

const Words = ({ words }: { words: Sentence["original"] }) => {
  const time = useAtomValue(timeAtom);

  return (
    <div className={classes.words}>
      {words.map(({ text, start, end }, index) => {
        let state = "";
        if (time < start) state = "future";
        else if (time < end) state = "present";
        else state = "past";
        return (
          <span
            ref={(el) => {
              if (index === 0 && state === "present")
                el?.parentElement?.scrollIntoView({
                  block: "center",
                  behavior: "smooth",
                });
            }}
            key={index}
            className={clsx(
              classes.word,
              state === "past" && classes.past,
              state === "present" && classes.present,
              state === "future" && classes.future
            )}
            onClick={() => seek(start)}
          >
            {text}&nbsp;
          </span>
        );
      })}
    </div>
  );
};
