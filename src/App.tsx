import { Fragment } from "react";
import { useAtomValue } from "jotai";
import { sentencesAtom, videoAtom, type Sentence } from "./data";
import Player, { playingAtom, timeAtom } from "./Player";
import classes from "./App.module.css";
import clsx from "clsx";

function App() {
  const video = useAtomValue(videoAtom);
  const sentences = useAtomValue(sentencesAtom);

  if (!video || !sentences) return <></>;

  return (
    <>
      <Player video={video} />
      <div className={classes.sentences}>
        {sentences.map(({ original, translation }, index) => (
          <Fragment key={index}>
            <Words words={translation} />
            <Words words={original} />
          </Fragment>
        ))}
      </div>
    </>
  );
}

export default App;

const Words = ({ words }: { words: Sentence["original"] }) => {
  const time = useAtomValue(timeAtom);
  const playing = useAtomValue(playingAtom);

  return (
    <div className={classes.words}>
      {words.map(({ text, start, end }, index) => {
        let state = "";
        if (!playing) state = "";
        else if (time < start) state = "future";
        else if (time <= end) state = "present";
        else state = "past";
        return (
          <span
            ref={(el) => {
              if (state === "present")
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
          >
            {text}&nbsp;
          </span>
        );
      })}
    </div>
  );
};
