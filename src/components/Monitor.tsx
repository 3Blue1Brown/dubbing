import { useEffect, useRef, useState, type ComponentProps } from "react";
import { max } from "lodash";
import { useElementBounding } from "@reactuses/core";
import { tension } from "@/util/math";
import classes from "./Monitor.module.css";

type Props = {
  time: number[];
  freq: number[];
  hasSignal: boolean;
} & ComponentProps<"canvas">;

/** extra draw resolution */
const oversample = window.devicePixelRatio * 2;

/** graph time or frequency data */
const Monitor = ({ time, freq, hasSignal, ...props }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

  /** get draw context */
  useEffect(() => {
    ctxRef.current = canvasRef.current?.getContext("2d");
  }, []);

  /** element size */
  const { width, height } = useElementBounding(canvasRef);

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

  /** max value */
  const peak = max(time) ?? 0;

  /** draw data */
  let monitor: number[] = [];

  /** frequency data */
  if (byFreq)
    monitor = freq.map(
      (value, index) => value * tension(index / freq.length, 0.1),
    );
  else {
    /** time data */
    const skip = Math.floor(time.length / width);
    monitor = time
      .filter((_, index) => index % skip === 0)
      .map((value) => Math.abs(value));
  }

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    /** clear previous canvas contents */
    ctx.clearRect(0, 0, width, height);

    if (hasSignal) {
      /** draw graph */
      ctx.save();
      ctx.translate(0, height / 2);
      ctx.scale(width / monitor.length, height / 2);
      ctx.beginPath();
      monitor.forEach((y, x) => {
        ctx.moveTo(x, -y || -0.5 / (height / 2));
        ctx.lineTo(x, y || 0.5 / (height / 2));
      });
      ctx.restore();
      ctx.lineWidth = 1;
      ctx.strokeStyle = peak > 0.9 ? "#ff1493" : "#00bfff";
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
