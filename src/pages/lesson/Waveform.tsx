import { useContext } from "react";
import WaveformComponent from "@/components/Waveform";
import { LessonContext } from "@/pages/lesson";

/** waveform section */
const Waveform = () => {
  const { waveform, playing, time, sampleRate, autoScroll, setTime } =
    useContext(LessonContext);

  return (
    <WaveformComponent
      waveform={waveform}
      sampleRate={sampleRate}
      autoScroll={autoScroll}
      playing={playing}
      time={time}
      onSeek={setTime}
    />
  );
};

export default Waveform;
