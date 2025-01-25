import { useContext, useEffect, useRef } from "react";
import { useTransform } from "@/components/transform";
import WaveformComponent from "@/components/Waveform";
import { LessonContext } from "@/pages/lesson";

/** waveform section */
const Waveform = () => {
  /** use lesson state */
  const { tracks, length, time, sampleRate, autoScroll, setTime } =
    useContext(LessonContext);

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

  return tracks.map((track, index) => (
    <WaveformComponent
      key={index}
      waveform={track}
      transform={transform}
      onWheel={onWheel}
      sampleRate={sampleRate}
      time={time}
      onSeek={(time) => {
        justSeeked.current = true;
        setTime(time);
      }}
    />
  ));
};

export default Waveform;
