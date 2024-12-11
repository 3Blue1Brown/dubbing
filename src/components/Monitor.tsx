import { useEffect, useRef, useState } from "react";
import { max } from "lodash";
import { useMeasure } from "@reactuses/core";
import { tension } from "@/util/math";
import classes from "./Monitor.module.css";

type Props = {
  time: number[];
  freq: number[];
};

const Monitor = ({ time, freq }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

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
      .map((value) => tension(Math.abs(value), 0.01));
  }

  useEffect(() => {
    if (!canvasRef.current) return;
    const scale = window.devicePixelRatio * 2;
    canvasRef.current.width = width * scale;
    canvasRef.current.height = height * scale;
    ctxRef.current = canvasRef.current.getContext("2d");
    if (!ctxRef.current) return;
    ctxRef.current.scale(scale, scale);
    ctxRef.current.lineCap = "round";
  }, [width, height]);

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
      onClick={() => setByFreq(!byFreq)}
    />
  );
};

export default Monitor;
