import { useState } from "react";
import { MdTranslate } from "react-icons/md";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { sentencesAtom, videoAtom } from "./data";
import classes from "./Sentences.module.css";
import { playingAtom, seek, timeAtom } from "./time";

const Sentences = () => {
  const video = useAtomValue(videoAtom);
  const sentences = useAtomValue(sentencesAtom);
  const playing = useAtomValue(playingAtom);
  const time = useAtomValue(timeAtom);
  const [showEnglish, setShowEnglish] = useState(false);

  if (!video || !sentences) return <></>;

  return (
    <div className={classes.container}>
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
                      if (!el || state !== "present") return;
                      if (playing && index !== 0) return;
                      el.scrollIntoView({
                        block: "center",
                        behavior: playing ? "smooth" : "instant",
                      });
                    }}
                    key={index}
                    className={clsx(
                      classes.word,
                      state === "past" && classes.past,
                      state === "present" && classes.present,
                      state === "future" && classes.future,
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
              },
            )}
          </div>
        ))}
      </div>

      <button
        className={clsx(showEnglish && "accent", classes.button)}
        role="checkbox"
        aria-label="Show English"
        aria-checked={showEnglish ? "true" : "false"}
        onClick={() => setShowEnglish(!showEnglish)}
      >
        <MdTranslate />
      </button>
    </div>
  );
};

export default Sentences;
