import {
  FaCircle,
  FaMicrophone,
  FaPlay,
  FaStop,
  FaVideo,
} from "react-icons/fa6";
import { MdTranslate } from "react-icons/md";
import { PiMouseScrollBold } from "react-icons/pi";
import { useAtom, useAtomValue } from "jotai";
import CheckButton from "@/components/CheckButton";
import Monitor from "@/components/Monitor";
import Select from "@/components/Select";
import {
  deviceAtom,
  devicesAtom,
  micFreqAtom,
  micStreamAtom,
  micTimeAtom,
  refreshDevices,
} from "@/pages/lesson/audio";
import { balanceAtom } from "@/pages/lesson/Player";
import { autoscrollAtom, showOriginalAtom } from "@/pages/lesson/Sentences";
import { formatMs, formatTime } from "@/util/string";
import {
  armRecording,
  disarmRecording,
  play,
  playingAtom,
  recordingAtom,
  seek,
  stop,
  timeAtom,
} from "./audio";
import classes from "./Controls.module.css";
import { lengthAtom } from "./data";

const Controls = () => {
  const devices = useAtomValue(devicesAtom);
  const [device, setDevice] = useAtom(deviceAtom);
  const micStream = useAtomValue(micStreamAtom);
  const recording = useAtomValue(recordingAtom);
  const playing = useAtomValue(playingAtom);
  const micTime = useAtomValue(micTimeAtom);
  const micFreq = useAtomValue(micFreqAtom);
  const time = useAtomValue(timeAtom);
  const length = useAtomValue(lengthAtom);
  const [balance, setBalance] = useAtom(balanceAtom);
  const [showOriginal, setShowOriginal] = useAtom(showOriginalAtom);
  const [autoscroll, setAutoscroll] = useAtom(autoscrollAtom);

  return (
    <div className={classes.controls}>
      <div className={classes.row}>
        {devices.length ? (
          <>
            <Select
              label={<FaMicrophone className={classes.small} />}
              data-tooltip="Microphone device"
              value={device}
              onChange={setDevice}
              options={devices.map(({ deviceId, label }) => ({
                value: deviceId,
                label,
              }))}
              onClick={refreshDevices}
            />
            <Monitor time={micTime} freq={micFreq} />
          </>
        ) : (
          <span className={classes.small}>No devices</span>
        )}
      </div>

      <div className={classes.row}>
        {micStream ? (
          <CheckButton
            label={recording ? "Disarm recording" : "Arm recording"}
            checked={recording}
            onClick={() => (recording ? disarmRecording() : armRecording())}
            style={{ color: recording ? "red" : "" }}
          >
            <FaCircle />
          </CheckButton>
        ) : (
          <span className={classes.small}>Allow mic access</span>
        )}

        <CheckButton
          label={playing ? "Pause" : "Play"}
          checked={playing}
          onClick={() => (playing ? stop() : play())}
        >
          {playing ? <FaStop /> : <FaPlay />}
        </CheckButton>
      </div>

      <div className={classes.row} style={{ flexGrow: 1 }}>
        <span>
          {formatTime(time)}
          <span className={classes.small}>.{formatMs(time)}</span>
        </span>
        <input
          style={{ flexGrow: 1 }}
          type="range"
          value={time}
          min={0}
          max={length}
          step={0.001}
          onChange={(event) => seek(Number(event.target.value))}
        />
        <span className={classes.small}>{formatTime(length)}</span>
      </div>

      <div className={classes.row}>
        <FaVideo className={classes.small} />
        <input
          type="range"
          value={balance}
          min={0}
          max={1}
          step={0.1}
          style={{ width: 50 }}
          onChange={(event) => setBalance(Number(event.target.value))}
          data-tooltip="Playback preview volume of original video vs. your recorded dub"
        />
        <FaMicrophone className={classes.small} />
      </div>

      <div className={classes.row}>
        <CheckButton
          role="checkbox"
          checked={showOriginal}
          label="Show original text"
          onClick={() => setShowOriginal(!showOriginal)}
        >
          <MdTranslate />
        </CheckButton>

        <CheckButton
          role="checkbox"
          checked={autoscroll}
          label="Auto-scroll text"
          onClick={() => setAutoscroll(!autoscroll)}
        >
          <PiMouseScrollBold />
        </CheckButton>
      </div>
    </div>
  );
};

export default Controls;
