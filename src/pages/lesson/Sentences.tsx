import { Fragment, useRef } from "react";
import clsx from "clsx";
import { useLesson } from "@/pages/lesson/state";
import classes from "./Sentences.module.css";

/** sentences section */
const Sentences = () => {
  const ref = useRef<HTMLDivElement>(null);

  /** use lesson state */
  const sentences = useLesson("sentences");
  const playing = useLesson("playing");
  const time = useLesson("time");
  const setTime = useLesson("setTime");
  const showOriginal = useLesson("showOriginal");
  const autoScroll = useLesson("autoScroll");

  if (!sentences) return <div className="placeholder">No sentences loaded</div>;

  if (showOriginal && sentences.every((sentence) => !sentence.original.length))
    return <div className="placeholder">No sentences loaded</div>;

  return (
    <div ref={ref} className={classes.sentences}>
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
                      /** auto-scroll */
                      if (el && state === "present" && autoScroll) {
                        ref.current?.scrollTo({
                          top: el.offsetTop - ref.current.clientHeight / 2,
                          behavior: playing ? "smooth" : "instant",
                        });
                      }
                    }}
                    className={clsx(
                      classes.word,
                      state === "past" && classes.past,
                      state === "present" && classes.present,
                      state === "future" && classes.future,
                    )}
                    onClick={() => setTime(start)}
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
