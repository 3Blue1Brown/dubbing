import { useEffect, useRef, useState, type ComponentProps } from "react";
import { max } from "lodash";
import { useElementBounding } from "@reactuses/core";
import { peaks } from "@/audio/peaks.worker";
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
  const ctxRef = useRef<CanvasRenderingContext2D>(null);

  /** element size */
  const { width, height } = useElementBounding(canvasRef);
  const halfHeight = height / 2;

  /** when size changes */
  useEffect(() => {
    if (!canvasRef.current) return;
    /** over-size canvas buffer */
    canvasRef.current.width = width * oversample;
    canvasRef.current.height = height * oversample;
    /** get draw context */
    ctxRef.current = canvasRef.current.getContext("2d");
    /** scale so that draw commands are is if canvas is regular size */
    ctxRef.current?.scale(oversample, oversample);
  }, [width, height]);

  /** whether to display frequency or time data */
  const [byFreq, setByFreq] = useState(true);

  /** max absolute value */
  const maxAbs = max(time.map(Math.abs)) ?? 0;

  /** draw data */
  const monitor = peaks({
    array: byFreq ? freq : time,
    start: 0,
    end: byFreq ? freq.length : time.length,
    divisions: width,
  });
  if (byFreq) {
    monitor.forEach((value, index) => {
      value.max = value.max * sigmoid(index / width, 0.1);
      value.min = -value.max;
    });
  } else {
    monitor.forEach((value) => {
      value.min = power(value.min, 0.75);
      value.max = power(value.max, 0.75);
    });
  }

  /** whether there is any signal */
  const hasSignal = monitor.some(({ min, max }) => min !== 0 || max !== 0);

  /** keep track of last time we had signal */
  const lastSignal = useRef(0);
  if (hasSignal) lastSignal.current = window.performance.now();

  /** if we haven't had signal in a while, consider no signal */
  const noSignal = window.performance.now() - lastSignal.current > 1000;

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    /** clear previous canvas contents */
    ctx.clearRect(0, 0, width, height);

    /** set styles */
    ctx.lineWidth = lineWidth;

    /** draw waveform */
    ctx.strokeStyle = maxAbs > 0.9 ? "#ff1493" : "#00bfff";
    ctx.beginPath();
    monitor.forEach(({ min, max }, x) => {
      ctx.moveTo(x, halfHeight + min * halfHeight - ctx.lineWidth / 2);
      ctx.lineTo(x, halfHeight + max * halfHeight + ctx.lineWidth / 2);
    });
    ctx.stroke();

    /** draw no signal */
    if (noSignal) {
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
          ? "Switch to oscilloscope (time) view"
          : "Switch to spectrum (frequency) view"
      }
    />
  );
};

export default Monitor;
