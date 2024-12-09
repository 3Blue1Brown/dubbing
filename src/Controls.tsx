import { atom, useAtomValue } from "jotai";
import {
  play,
  playingAtom,
  recordingAtom,
  startRecording,
  stop,
  stopRecording,
  timeAtom,
} from "./time";
import classes from "./Controls.module.css";
import { FaCircle, FaPlay, FaStop } from "react-icons/fa6";
import { formatTime } from "./string";
import { setAtom } from "./atoms";

export const showEnglishAtom = atom(false);

const Controls = () => {
  const recording = useAtomValue(recordingAtom);
  const playing = useAtomValue(playingAtom);
  const time = useAtomValue(timeAtom);
  const showEnglish = useAtomValue(showEnglishAtom);

  return (
    <div className={classes.controls}>
      <button onClick={() => (recording ? stopRecording() : startRecording())}>
        {recording ? <FaStop /> : <FaCircle />}
      </button>
      <button onClick={() => (playing ? stop() : play())}>
        {playing ? <FaStop /> : <FaPlay />}
      </button>
      {formatTime(time)}
      <label>
        <input
          type="checkbox"
          checked={showEnglish}
          onChange={(event) => setAtom(showEnglishAtom, event.target.checked)}
        />
        Show English
      </label>
    </div>
  );
};

export default Controls;
