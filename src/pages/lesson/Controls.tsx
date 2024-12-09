import { FaCircle, FaPlay, FaStop } from "react-icons/fa6";
import clsx from "clsx";
import { useAtomValue } from "jotai";
import { lengthAtom } from "@/pages/lesson/data";
import { formatTime } from "@/util/string";
import classes from "./Controls.module.css";
import {
  play,
  playingAtom,
  recordingAtom,
  seek,
  startRecording,
  stop,
  stopRecording,
  timeAtom,
} from "./time";

const Controls = () => {
  const recording = useAtomValue(recordingAtom);
  const playing = useAtomValue(playingAtom);
  const time = useAtomValue(timeAtom);
  const length = useAtomValue(lengthAtom);

  return (
    <div className={classes.controls}>
      <button
        className={clsx(recording && "accent")}
        onClick={() => (recording ? stopRecording() : startRecording())}
      >
        {recording ? <FaStop /> : <FaCircle />}
      </button>
      <button
        className={clsx(playing && "accent")}
        onClick={() => (playing ? stop() : play())}
      >
        {playing ? <FaStop /> : <FaPlay />}
      </button>
      {formatTime(time)}
      <input
        type="range"
        value={time}
        min={0}
        max={length}
        step={0.1}
        onChange={(event) => seek(Number(event.target.value))}
      />
      <span className={classes.length}>{formatTime(length)}</span>
    </div>
  );
};

export default Controls;
