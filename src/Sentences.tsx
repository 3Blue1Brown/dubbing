import { useAtomValue } from "jotai";
import { sentencesAtom, videoAtom } from "./data";
import { playingAtom, seek, timeAtom } from "./time";
import classes from "./Sentences.module.css";
import clsx from "clsx";
import { showEnglishAtom } from "./Controls";

const Sentences = () => {
  const video = useAtomValue(videoAtom);
  const sentences = useAtomValue(sentencesAtom);
  const playing = useAtomValue(playingAtom);
  const time = useAtomValue(timeAtom);
  const showEnglish = useAtomValue(showEnglishAtom);

  if (!video || !sentences) return <></>;

  return (
    <div className={classes.sentences}>
      {sentences.map(({ translation, original }, index) => (
        <div key={index} className={classes.words}>
          {(showEnglish ? original : translation).map(
            ({ text, start, end }, index) => {
              let state = "";
              if (time < start) state = "future";
              else if (time < end) state = "present";
              else state = "past";
              return (
                <span
                  ref={(el) => {
                    if (!el || !playing || index !== 0 || state !== "present")
                      return;
                    el.scrollIntoView({ block: "center", behavior: "smooth" });
                  }}
                  key={index}
                  className={clsx(
                    classes.word,
                    state === "past" && classes.past,
                    state === "present" && classes.present,
                    state === "future" && classes.future
                  )}
                  style={{
                    opacity: playing
                      ? 0.1 + 1.25 ** -Math.abs(time - (end + start) / 2)
                      : 1,
                  }}
                  onClick={() => seek(start)}
                >
                  {text}{" "}
                </span>
              );
            }
          )}
        </div>
      ))}
    </div>
  );
};

export default Sentences;
