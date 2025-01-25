import { useEffect, useRef, useState, type ComponentProps } from "react";
import { max } from "lodash";
import { useElementBounding } from "@reactuses/core";
import { peaks } from "@/audio/peaks";
import { power, sigmoid } from "@/util/math";
import classes from "./Monitor.module.css";

type Props = {
  time: number[];
  freq: number[];
} & ComponentProps<"canvas">;

/** waveform line stroke width, in px */
const lineWidth = 1;

/** extra draw resolution */
const oversample = window.devicePixelRatio * 2;

/** graph time or frequency data */
const Monitor = ({ time, freq, ...props }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

  /** get draw context */
  useEffect(() => {
    ctxRef.current = canvasRef.current?.getContext("2d");
  }, []);

  /** element size */
  const { width, height } = useElementBounding(canvasRef);
  const halfHeight = height / 2;

  /** when size changes */
  useEffect(() => {
    if (!canvasRef.current) return;
    /** over-size canvas buffer */
    canvasRef.current.width = width * oversample;
    canvasRef.current.height = height * oversample;
    /** scale so that draw commands are is if canvas is regular size */
    ctxRef.current?.scale(oversample, oversample);
  }, [width, height]);

  /** whether to display frequency or time data */
  const [byFreq, setByFreq] = useState(true);

  /** max absolute value */
  const maxAbs = max(time.map(Math.abs)) ?? 0;

  /** draw data */
  let monitor: ReturnType<typeof peaks> = [];

  /** frequency data */
  if (byFreq) {
    monitor = peaks(
      freq,
      0,
      freq.length,
      width,
      1,
      (value, index) => value * sigmoid(index / width, 0.1),
    );
    monitor.forEach((d) => (d.min = -d.max));
  } else
    /** time data */
    monitor = peaks(time, 0, time.length, width, 1, (value) =>
      power(value, 0.5),
    );

  /** whether there is any signal */
  const hasSignal = monitor.some(({ min, max }) => min !== 0 || max !== 0);

  /** keep track of last time we had signal */
  const lastSignal = useRef(0);
  if (hasSignal) lastSignal.current = window.performance.now();

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    /** clear previous canvas contents */
    ctx.clearRect(0, 0, width, height);

    /** set styles */
    ctx.lineWidth = lineWidth;

    if (hasSignal && window.performance.now() - lastSignal.current < 1000) {
      /** draw waveform */
      ctx.strokeStyle = maxAbs > 0.9 ? "#ff1493" : "#00bfff";
      ctx.beginPath();
      monitor.forEach(({ min, max }, x) => {
        ctx.moveTo(x, halfHeight + min * halfHeight);
        ctx.lineTo(x, halfHeight + max * halfHeight);
      });
      ctx.stroke();
    } else {
      /** draw no signal */
      ctx.fillStyle = "gray";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "10px Open Sans";
      ctx.fillText("No signal", width / 2, height / 2);
    }
  });

  return (
    <canvas
      {...props}
      ref={canvasRef}
      className={classes.monitor}
      onClick={() => setByFreq(!byFreq)}
      data-tooltip={
        byFreq
          ? "Switch to oscilloscope view"
          : "Switch to frequency spectrum view"
      }
    />
  );
};

export default Monitor;
