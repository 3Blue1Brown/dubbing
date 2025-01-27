import { useEffect, useRef } from "react";
import { useTransform } from "@/components/transform";
import WaveformComponent from "@/components/Waveform";
import { useLesson } from "@/pages/lesson/state";
import classes from "./Tracks.module.css";

/** tracks section */
const Tracks = () => {
  /** use lesson state */
  const tracks = useLesson("tracks");
  const length = useLesson("length");
  const time = useLesson("time");
  const sampleRate = useLesson("sampleRate");
  const autoScroll = useLesson("autoScroll");
  const setTime = useLesson("setTime");
  const recordTrack = useLesson("recordTrack");
  const recordTrackUpdated = useLesson("recordTrackUpdated");

  /** sync transform across waveforms */
  const { transform, onWheel, center } = useTransform({
    length,
    time,
    sampleRate,
    autoScroll,
  });

  /** flag that time changed due to user seek */
  const justSeeked = useRef(false);

  /** when current time changes */
  useEffect(() => {
    /** if auto-scroll on, and if didn't change because of seek */
    if (autoScroll && !justSeeked.current)
      /** center view on current time */
      center(time);
    justSeeked.current = false;
  }, [center, time, autoScroll]);

  /** on waveform seek */
  const onSeek = (time: number) => {
    justSeeked.current = true;
    setTime(time);
  };

  return (
    <div className={classes.tracks}>
      {tracks.map((track, index) => (
        <div
          key={index}
          className={classes.track}
          onDoubleClick={(event) => (event.currentTarget.style.height = "")}
        >
          <WaveformComponent
            waveform={track}
            transform={transform}
            onWheel={onWheel}
            sampleRate={sampleRate}
            time={time}
            onSeek={onSeek}
          />
        </div>
      ))}

      <div className={classes.track} style={{ opacity: 0.5 }}>
        <WaveformComponent
          waveform={recordTrack}
          waveformUpdated={recordTrackUpdated}
          transform={transform}
          onWheel={onWheel}
          sampleRate={sampleRate}
          time={time}
          onSeek={onSeek}
        />
      </div>
    </div>
  );
};

export default Tracks;
