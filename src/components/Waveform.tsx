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

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(0, height / 2);
    ctx.scale(1, height / 2);
    for (let x = 0; x < width; x += 1) {
      const start = Math.floor(waveform.length * (x / width));
      const end = Math.ceil(waveform.length * ((x + 1) / width));
      const { max, min } = range(waveform, start, end - 1);
      ctx.strokeStyle =
        Math.abs(max) > warning || Math.abs(min) > warning
          ? "#ff1493"
          : "#00bfff";
      ctx.globalAlpha = start > sampleRate * time ? 0.5 : 1;
      ctx.beginPath();
      ctx.moveTo(x, tension(min / peak, 0.1));
      ctx.lineTo(x, tension(max / peak, 0.1));
      ctx.stroke();
    }
    ctx.restore();
    console.log(range(waveform));
  });

  return <canvas ref={canvasRef} className={classes.waveform} />;
};

export default Waveform;
