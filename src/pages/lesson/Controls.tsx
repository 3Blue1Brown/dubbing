import { useContext, type CSSProperties } from "react";
import {
  FaCircle,
  FaHeadphonesSimple,
  FaMicrophone,
  FaPause,
  FaPlay,
  FaVolumeHigh,
} from "react-icons/fa6";
import { MdTranslate } from "react-icons/md";
import { PiMouseScrollBold } from "react-icons/pi";
import CheckButton from "@/components/CheckButton";
import Monitor from "@/components/Monitor";
import Select from "@/components/Select";
import { LessonContext } from "@/pages/lesson";
import { useShortcutClick } from "@/util/hooks";
import { formatMs, formatTime } from "@/util/string";
import classes from "./Controls.module.css";

/** play, pause, seek bar, etc. */
const Controls = () => {
  const playButtonRef = useShortcutClick<HTMLButtonElement>(" ");
  const playthroughButtonRef = useShortcutClick<HTMLButtonElement>("p");
  const recordButtonRef = useShortcutClick<HTMLButtonElement>("r");

  const {
    sampleRate,
    devices,
    device,
    micStream,
    setDevice,
    playthrough,
    setPlaythrough,
    micTimeAnal,
    micFreqAnal,
    recording,
    setRecording,
    playing,
    setPlaying,
    volume,
    setVolume,
    time,
    setTime,
    length,
    showOriginal,
    setShowOriginal,
    autoScroll,
    setAutoScroll,
  } = useContext(LessonContext);

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

            <Monitor time={micTimeAnal} freq={micFreqAnal} />

            <CheckButton
              ref={recordButtonRef}
              style={{ "--accent": "var(--secondary)" } as CSSProperties}
              label={recording ? "Disarm recording (R)" : "Arm recording (R)"}
              checked={recording}
              onClick={() => setRecording(!recording)}
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
          onClick={() => setPlaying(!playing)}
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
          onChange={(event) => setTime(Number(event.target.value))}
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
          onClick={() => setAutoScroll(!autoScroll)}
        >
          <PiMouseScrollBold />
        </CheckButton>
      </div>
    </div>
  );
};

export default Controls;
