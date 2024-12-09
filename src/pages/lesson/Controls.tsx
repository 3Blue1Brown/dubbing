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
import Select from "@/components/Select";
import { formatMs, formatTime } from "@/util/string";
import classes from "./Controls.module.css";
import { lengthAtom } from "./data";
import {
  autoscrollAtom,
  balanceAtom,
  deviceAtom,
  devicesAtom,
  micStreamAtom,
  monitorAtom,
  play,
  playingAtom,
  recordingAtom,
  refreshDevices,
  seek,
  showOriginalAtom,
  startRecording,
  stop,
  stopRecording,
  timeAtom,
} from "./state";

const Controls = () => {
  const devices = useAtomValue(devicesAtom);
  const [device, setDevice] = useAtom(deviceAtom);
  const micStream = useAtomValue(micStreamAtom);
  const recording = useAtomValue(recordingAtom);
  const playing = useAtomValue(playingAtom);
  const time = useAtomValue(timeAtom);
  const length = useAtomValue(lengthAtom);
  const [balance, setBalance] = useAtom(balanceAtom);
  const [showOriginal, setShowOriginal] = useAtom(showOriginalAtom);
  const [autoscroll, setAutoscroll] = useAtom(autoscrollAtom);

  return (
    <div className={classes.controls}>
      <div className={classes.row}>
        {devices.length ? (
          <Select
            label="Mic"
            value={device}
            onChange={setDevice}
            options={devices.map(({ deviceId, label }) => ({
              value: deviceId,
              label,
            }))}
            onClick={refreshDevices}
          />
        ) : (
          <span className={classes.small}>No devices</span>
        )}

        {micStream ? (
          <>
            <Monitor />
            <CheckButton
              label="Record"
              checked={recording}
              onClick={() => (recording ? stopRecording() : startRecording())}
            >
              {recording ? <FaStop /> : <FaCircle />}
            </CheckButton>
          </>
        ) : (
          <span className={classes.small}>Allow mic access</span>
        )}

        <CheckButton
          label="Play"
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
          data-tooltip="Playback preview volume of original dub vs. your recorded dub"
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

const Monitor = () => {
  const monitor = useAtomValue(monitorAtom);

  const width = monitor.length;
  const height = monitor.length / 5;

  return (
    <svg viewBox={[0, -height, width, height * 2].join(" ")} width="100">
      <path
        fill="none"
        stroke="var(--primary)"
        strokeWidth={width / 100}
        d={monitor
          .map((y, x) => [x ? "L" : "M", x, y * height].join(" "))
          .join(" ")}
      />
    </svg>
  );
};
