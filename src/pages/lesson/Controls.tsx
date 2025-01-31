import { type CSSProperties } from "react";
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
import Analyzer from "@/components/Analyzer";
import CheckButton from "@/components/CheckButton";
import Select from "@/components/Select";
import Slider from "@/components/Slider";
import { useLesson } from "@/pages/lesson/state";
import { useShortcutClick } from "@/util/hooks";
import { formatTime } from "@/util/string";
import classes from "./Controls.module.css";

/** controls section */
const Controls = () => {
  const playButtonRef = useShortcutClick<HTMLButtonElement>(" ");
  const playthroughButtonRef = useShortcutClick<HTMLButtonElement>("p");
  const recordButtonRef = useShortcutClick<HTMLButtonElement>("r");

  const sampleRate = useLesson("sampleRate");
  const devices = useLesson("devices");
  const device = useLesson("device");
  const micStream = useLesson("micStream");
  const setDevice = useLesson("setDevice");
  const playthrough = useLesson("playthrough");
  const setPlaythrough = useLesson("setPlaythrough");
  const micAnal = useLesson("micAnal");
  const micAnalByFreq = useLesson("micAnalByFreq");
  const setMicAnalByFreq = useLesson("setMicAnalByFreq");
  const recording = useLesson("recording");
  const setRecording = useLesson("setRecording");
  const playing = useLesson("playing");
  const setPlaying = useLesson("setPlaying");
  const volume = useLesson("volume");
  const setVolume = useLesson("setVolume");
  const time = useLesson("time");
  const setTime = useLesson("setTime");
  const length = useLesson("length");
  const showOriginal = useLesson("showOriginal");
  const setShowOriginal = useLesson("setShowOriginal");
  const autoScroll = useLesson("autoScroll");
  const setAutoScroll = useLesson("setAutoScroll");

  return (
    <div className={classes.controls}>
      <div className={classes.row}>
        {devices.length ? (
          <Select
            data-tooltip={`Microphone device, ${sampleRate / 1000} kHz`}
            value={device ?? ""}
            onChange={setDevice}
            options={devices.map(({ deviceId, label }) => ({
              value: deviceId,
              label: label || "Device",
            }))}
          >
            <FaMicrophone
              className={classes.small}
              aria-label="Microphone device"
            />
          </Select>
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
                  : "Enable microphone playthrough<br/>(USE HEADPHONES)"
              }
              checked={playthrough}
              onChange={setPlaythrough}
            >
              <FaHeadphonesSimple />
            </CheckButton>

            <Analyzer
              data={micAnal}
              mirror={micAnalByFreq}
              onClick={() => setMicAnalByFreq(!micAnalByFreq)}
              data-tooltip={
                micAnalByFreq
                  ? "Switch to oscilloscope (time) view"
                  : "Switch to spectrum (frequency) view"
              }
            />

            <CheckButton
              ref={recordButtonRef}
              style={{ "--accent": "var(--secondary)" } as CSSProperties}
              label={recording ? "Disarm recording (R)" : "Arm recording (R)"}
              checked={recording}
              onChange={() => setRecording(!recording)}
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
          onChange={() => setPlaying(!playing)}
        >
          {playing ? <FaPause /> : <FaPlay />}
        </CheckButton>
      </div>

      <div className={classes.row}>
        <FaVolumeHigh className={classes.small} />
        <Slider
          value={volume}
          onChange={setVolume}
          min={0}
          max={2}
          step={0.1}
          style={{ width: 50 }}
          data-tooltip="Playback and mic playthrough volume"
        />
      </div>

      <div className={classes.row} style={{ flexGrow: 1 }}>
        <span>{formatTime(time)}</span>
        <Slider
          value={time}
          onChange={setTime}
          min={0}
          max={length}
          step={0.001}
          style={{ flexGrow: 1 }}
          data-tooltip="Timeline"
        />
        <span className={classes.small}>{formatTime(length)}</span>
      </div>

      <div className={classes.row}>
        <CheckButton
          role="checkbox"
          checked={showOriginal}
          onChange={setShowOriginal}
          label="Show original text"
        >
          <MdTranslate />
        </CheckButton>

        <CheckButton
          role="checkbox"
          label="Auto-scroll text and waveform"
          checked={autoScroll}
          onChange={setAutoScroll}
        >
          <PiMouseScrollBold />
        </CheckButton>
      </div>
    </div>
  );
};

export default Controls;
