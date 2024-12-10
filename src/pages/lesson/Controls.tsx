import { useEffect, useRef, useState } from "react";
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
import { max } from "lodash";
import CheckButton from "@/components/CheckButton";
import Select from "@/components/Select";
import { tension } from "@/util/math";
import { formatMs, formatTime } from "@/util/string";
import classes from "./Controls.module.css";
import { lengthAtom } from "./data";
import {
  autoscrollAtom,
  balanceAtom,
  deviceAtom,
  devicesAtom,
  micFreqAtom,
  micStreamAtom,
  micTimeAtom,
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
            <Monitor />
          </>
        ) : (
          <span className={classes.small}>No devices</span>
        )}
      </div>

      <div className={classes.row}>
        {micStream ? (
          <CheckButton
            label="Record"
            checked={recording}
            onClick={() => (recording ? stopRecording() : startRecording())}
          >
            {recording ? <FaStop /> : <FaCircle />}
          </CheckButton>
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

const width = 50;
const height = 25;

const Monitor = () => {
  const [byFreq, setByFreq] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

  const time = useAtomValue(micTimeAtom);
  const peak = max(time) ?? 0;
  const freq = useAtomValue(micFreqAtom);

  let monitor: number[] = [];
  if (byFreq)
    monitor = freq.map(
      (value, index) => value * tension(index / freq.length, 0.1),
    );
  else {
    const skip = Math.floor(time.length / width);
    monitor = time
      .filter((_, index) => index % skip === 0)
      .map((value) => tension(Math.abs(value), 0.1));
  }

  useEffect(() => {
    if (!canvasRef.current) return;
    const scale = 5;
    canvasRef.current.width = width * scale;
    canvasRef.current.height = height * scale;
    ctxRef.current = canvasRef.current.getContext("2d");
    if (ctxRef.current) {
      ctxRef.current.scale(scale, scale);
      ctxRef.current.lineCap = "round";
    }
  }, []);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(0, height / 2);
    ctx.scale(width / monitor.length, height / 2);
    ctx.beginPath();
    monitor.forEach((y, x) => {
      ctx.moveTo(x, -y);
      ctx.lineTo(x, y);
    });
    ctx.restore();
    ctx.lineWidth = 1;
    ctx.strokeStyle = peak > 0.9 ? "#ff1493" : "#00bfff";
    ctx.stroke();
  });

  return (
    <canvas
      ref={canvasRef}
      className={classes.monitor}
      style={{ width }}
      onClick={() => setByFreq(!byFreq)}
    />
  );
};
