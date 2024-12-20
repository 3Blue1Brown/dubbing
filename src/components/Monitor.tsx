import { useEffect, useRef, useState, type ComponentProps } from "react";
import { useAtomValue } from "jotai";
import { max } from "lodash";
import { useMeasure } from "@reactuses/core";
import { micSignalAtom } from "@/pages/lesson/audio";
import { tension } from "@/util/math";
import classes from "./Monitor.module.css";

type Props = {
  time: number[];
  freq: number[];
} & ComponentProps<"canvas">;

const oversample = window.devicePixelRatio * 2;

const Monitor = ({ time, freq, ...props }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

  const micSignal = useAtomValue(micSignalAtom.atom);

  const [{ width, height }] = useMeasure(canvasRef);

  const [byFreq, setByFreq] = useState(true);

  const peak = max(time) ?? 0;

  let monitor: number[] = [];
  if (byFreq)
    monitor = freq.map(
      (value, index) => value * tension(index / freq.length, 0.1),
    );
  else {
    const skip = Math.floor(time.length / width);
    monitor = time
      .filter((_, index) => index % skip === 0)
      .map((value) => Math.abs(value));
  }

  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.width = width * oversample;
    canvasRef.current.height = height * oversample;
    ctxRef.current = canvasRef.current.getContext("2d");
    ctxRef.current?.scale(oversample, oversample);
  }, [width, height]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    if (micSignal) {
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
          ? "Switch to oscilliscope view"
          : "Switch to frequency spectrum view"
      }
    />
  );
};

export default Monitor;
