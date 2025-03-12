import { useEffect, useRef, type ComponentProps } from "react";
import { max } from "lodash";
import { useElementBounding } from "@reactuses/core";
import { getPeaks } from "@/audio/peaks";
import { power } from "@/util/math";
import classes from "./Analyzer.module.css";

type Props = {
  data: number[];
  mirror: boolean;
} & ComponentProps<"canvas">;

/** waveform line stroke width, in px */
const lineWidth = 1;

/** extra draw resolution */
const oversample = window.devicePixelRatio * 1;

/** visualizer for audio analyzer data */
const Analyzer = ({ data, mirror = false, ...props }: Props) => {
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

  /** max absolute value */
  const maxAbs = max(data.map(Math.abs)) ?? 0;

  /** draw data */
  const Analyzer = getPeaks({
    array: data,
    start: 0,
    end: data.length,
    divisions: width,
  });

  /** boost visibility of lower values */
  Analyzer.forEach((value) => {
    value.max = power(value.max, 0.75);
    value.min = mirror ? -value.max : power(value.min, 0.75);
  });

  /** whether there is any signal */
  const hasSignal = Analyzer.some(({ min, max }) => min !== 0 || max !== 0);

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
    Analyzer.forEach(({ min, max }, x) => {
      ctx.moveTo(x, halfHeight + min * halfHeight - ctx.lineWidth / 2);
      ctx.lineTo(x, halfHeight + max * halfHeight + ctx.lineWidth / 2);
    });
    ctx.stroke();

    /** draw no signal */
    if (noSignal) {
      ctx.fillStyle = "gray";
      ctx.textAlign = "center";
      ctx.textBaseline = "hanging";
      ctx.font = "10px Open Sans";
      ctx.fillText("No signal", width / 2, 10);
    }
  });

  return <canvas {...props} ref={canvasRef} className={classes.analyzer} />;
};

export default Analyzer;
