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

const lineWidth = 1;
const clippingThreshold = peak * 0.9;
const past = "#00bfff";
const pastClipping = "#ff1493";
const future = "#a0a0a0";
const futureClipping = "#808080";

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
    ctxRef.current.lineWidth = lineWidth;
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
      const isFuture = start > sampleRate * time;
      const isClipping =
        Math.abs(max) > clippingThreshold || Math.abs(min) > clippingThreshold;
      points.push({
        x,
        top: tension(max / peak, 0.1),
        bottom: tension(min / peak, 0.1),
        color: isClipping
          ? isFuture
            ? futureClipping
            : pastClipping
          : isFuture
            ? future
            : past,
      });
    }

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(0, height / 2);
    ctx.scale(1, height / 2);
    for (const { x, bottom, top, color } of points) {
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, bottom || -(lineWidth / height));
      ctx.lineTo(x, top || lineWidth / height);
      ctx.stroke();
    }
    ctx.beginPath();
    const x = (time * sampleRate * width) / waveform.length;
    ctx.strokeStyle = pastClipping;
    ctx.lineWidth = lineWidth * 2;
    ctx.moveTo(x, -1);
    ctx.lineTo(x, 1);
    ctx.stroke();
    ctx.restore();
  });

  return <canvas ref={canvasRef} className={classes.waveform} />;
};

export default Waveform;
