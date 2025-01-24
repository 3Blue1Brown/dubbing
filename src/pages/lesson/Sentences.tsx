import { Fragment, useContext } from "react";
import clsx from "clsx";
import { LessonContext } from "@/pages/lesson";
import classes from "./Sentences.module.css";

/** sentences section */
const Sentences = () => {
  /** use lesson state */
  const { video, sentences, playing, time, setTime, showOriginal, autoScroll } =
    useContext(LessonContext);

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
