import {
  FaCircle,
  FaHeadphonesSimple,
  FaMicrophone,
  FaPause,
  FaPlay,
  FaTriangleExclamation,
  FaVolumeHigh,
} from "react-icons/fa6";
import { MdTranslate } from "react-icons/md";
import { PiMouseScrollBold } from "react-icons/pi";
import { useAtom, useAtomValue } from "jotai";
import CheckButton from "@/components/CheckButton";
import Monitor from "@/components/Monitor";
import Select from "@/components/Select";
import {
  autoScrollAtom,
  deviceAtom,
  devicesAtom,
  micFreqAtom,
  micSignalAtom,
  micStreamAtom,
  micTimeAtom,
  playthroughAtom,
  recorderUpdatingAtom,
  sampleRateAtom,
  volumeAtom,
} from "@/pages/lesson/audio";
import type { Length } from "@/pages/lesson/data";
import { showOriginalAtom } from "@/pages/lesson/Sentences";
import { useShortcutClick } from "@/util/hooks";
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

type Props = {
  length: Length;
};

/** play, pause, seek bar, etc. */
const Controls = ({ length }: Props) => {
  const devices = useAtomValue(devicesAtom);
  const [device, setDevice] = useAtom(deviceAtom);
  const micStream = useAtomValue(micStreamAtom);
  const recording = useAtomValue(recordingAtom);
  const playing = useAtomValue(playingAtom);
  const micTime = useAtomValue(micTimeAtom);
  const micFreq = useAtomValue(micFreqAtom);
  const micSignal = useAtomValue(micSignalAtom.atom);
  const recorderUpdating = useAtomValue(recorderUpdatingAtom.atom);
  const time = useAtomValue(timeAtom);
  const sampleRate = useAtomValue(sampleRateAtom);
  const [volume, setVolume] = useAtom(volumeAtom);
  const [playthrough, setPlaythrough] = useAtom(playthroughAtom);
  const [showOriginal, setShowOriginal] = useAtom(showOriginalAtom);
  const [autoScroll, setautoScroll] = useAtom(autoScrollAtom);

  const playButtonRef = useShortcutClick<HTMLButtonElement>(" ");
  const playthroughButtonRef = useShortcutClick<HTMLButtonElement>("p");
  const recordButtonRef = useShortcutClick<HTMLButtonElement>("r");

  return (
    <div className={classes.controls}>
      <div className={classes.row}>
        {devices.length ? (
          <Select
            label={<FaMicrophone className={classes.small} />}
            data-tooltip={`Microphone device, ${sampleRate / 1000} kHz`}
            value={device ?? ""}
            onChange={setDevice}
            options={devices.map(({ deviceId, label }) => ({
              value: deviceId,
              label: label || "Device",
            }))}
          />
        ) : (
          <span className={classes.small}>No devices</span>
        )}
      </div>

      <div className={classes.row}>
        {micStream ? (
          <>
            <CheckButton
              ref={playthroughButtonRef}
              label={
                playthrough
                  ? "Stop playthrough"
                  : "Microphone playthrough (USE HEADPHONES TO AVOID FEEDBACK)"
              }
              checked={playthrough}
              onClick={() => setPlaythrough(!playthrough)}
            >
              <FaHeadphonesSimple />
            </CheckButton>

            <Monitor time={micTime} freq={micFreq} hasSignal={micSignal} />

            {!recorderUpdating && (
              <FaTriangleExclamation
                style={{ color: "var(--warning)" }}
                data-tooltip="Mic recording not working"
              />
            )}
            <CheckButton
              ref={recordButtonRef}
              label={recording ? "Disarm recording (R)" : "Arm recording (R)"}
              checked={recording}
              onClick={() => (recording ? disarmRecording() : armRecording())}
            >
              <FaCircle />
            </CheckButton>
          </>
        ) : (
          <span className={classes.small}>Allow mic access</span>
        )}

        <CheckButton
          ref={playButtonRef}
          label={playing ? "Pause (Space)" : "Play (Space)"}
          checked={playing}
          onClick={() => (playing ? stop() : play())}
        >
          {playing ? <FaPause /> : <FaPlay />}
        </CheckButton>
      </div>

      <div className={classes.row}>
        <FaVolumeHigh className={classes.small} />
        <input
          type="range"
          value={volume}
          min={0}
          max={1}
          step={0.1}
          style={{ width: 50 }}
          onChange={(event) => setVolume(Number(event.target.value))}
          data-tooltip="Playback and mic playthrough volume"
        />
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
          data-tooltip="Timeline"
        />
        <span className={classes.small}>{formatTime(length)}</span>
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
          checked={autoScroll}
          label="Auto-scroll text and waveform"
          onClick={() => setautoScroll(!autoScroll)}
        >
          <PiMouseScrollBold />
        </CheckButton>
      </div>
    </div>
  );
};

export default Controls;
