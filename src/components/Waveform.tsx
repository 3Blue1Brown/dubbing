import { useEffect, useRef } from "react";
import { useMeasure } from "@reactuses/core";
import { peak, sampleRate } from "@/pages/lesson/audio";
import { range } from "@/util/array";
import { tension } from "@/util/math";
import classes from "./Waveform.module.css";

type Props = {
  waveform: Int16Array;
  time: number;
};

const warning = peak * 0.9;

const Waveform = ({ waveform, time }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

  const [{ width, height }] = useMeasure(canvasRef);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scale = window.devicePixelRatio * 2;
    canvasRef.current.width = width * scale;
    canvasRef.current.height = height * scale;
    ctxRef.current = canvasRef.current.getContext("2d");
    if (!ctxRef.current) return;
    ctxRef.current.scale(scale, scale);
    ctxRef.current.lineWidth = 1;
  }, [width, height]);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const points: { x: number; top: number; bottom: number; color: string }[] =
      [];
    for (let x = 0; x < width; x += 1) {
      const start = Math.floor(waveform.length * (x / width));
      const end = Math.ceil(waveform.length * ((x + 1) / width));
      const { max, min } = range(waveform, start, end - 1);
      const future = start > sampleRate * time;
      const clipping = Math.abs(max) > warning || Math.abs(min) > warning;
      points.push({
        x,
        top: tension(max / peak, 0.1),
        bottom: tension(min / peak, 0.1),
        color: clipping
          ? future
            ? "#404040"
            : "#ff1493"
          : future
            ? "#a0a0a0"
            : "#00bfff",
      });
    }

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(0, height / 2);
    ctx.scale(1, height / 2);
    for (const { x, bottom, top, color } of points) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, bottom || -0.01);
      ctx.lineTo(x, top || 0.01);
      ctx.stroke();
      ctx.fill();
    }
    ctx.restore();
  });

  return <canvas ref={canvasRef} className={classes.waveform} />;
};

export default Waveform;
