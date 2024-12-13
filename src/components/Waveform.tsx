import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Matrix4, Quaternion, Vector3 } from "three";
import {
  useElementBounding,
  useEventListener,
  useMeasure,
} from "@reactuses/core";
import { sampleRate } from "@/pages/lesson/audio";
import { range } from "@/util/array";
import { round, tension } from "@/util/math";
import { formatMs, formatTime } from "@/util/string";
import classes from "./Waveform.module.css";

type Props = {
  waveform: Int16Array;
  time: number;
  onSeek: (value: number) => void;
};

const lineWidth = 1;
const clippingY = 0.9;
const past = "#00bfff";
const pastClipping = "#ff1493";
const future = "#a0a0a0";
const futureClipping = "#808080";
const tickDist = 50;
const tickIntervals = [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 20, 30, 60, 120, 600];
const oversample = window.devicePixelRatio * 2;

const Waveform = ({ waveform, time, onSeek }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

  const [{ width = 100, height = 100 }] = useMeasure(canvasRef);
  const { left, top } = useElementBounding(canvasRef);

  const matrix = useRef(new Matrix4());
  const [transform, setTransform] = useState(0);

  const [mouseX, setMouseX] = useState(0);

  const canvasToDom = useCallback(
    (x: number, y: number) =>
      new Vector3(x, y, 0).applyMatrix4(matrix.current.clone()),
    [],
  );

  const domToCanvas = useCallback(
    (x: number, y: number) =>
      new Vector3(x, y, 0).applyMatrix4(matrix.current.clone().invert()),
    [],
  );

  const decompose = useCallback(() => {
    const translate = new Vector3();
    const scale = new Vector3();
    matrix.current.decompose(translate, new Quaternion(), scale);
    return { translate, scale };
  }, []);

  const updateTransform = useCallback(() => {
    const length = waveform.length || 1;
    const { translate, scale } = decompose();
    scale.max(new Vector3(width / length, 1 * (height / 2), 1));
    scale.min(new Vector3(10, 10 * (height / 2), 1));
    translate.max(new Vector3(width - scale.x * length, height / 2, 0));
    translate.min(new Vector3(0, height / 2, 0));
    matrix.current.compose(translate, new Quaternion(), scale);
    setTransform((transform) => transform + 1);
  }, [decompose, waveform.length, width, height]);

  useEffect(() => {
    matrix.current.scale(new Vector3(0, 1, 1));
    updateTransform();
  }, [updateTransform]);

  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.width = width * oversample;
    canvasRef.current.height = height * oversample;
    ctxRef.current = canvasRef.current.getContext("2d");
    ctxRef.current?.scale(oversample, oversample);
  }, [width, height]);

  const points = useMemo(
    () =>
      Array(width + 1)
        .fill(0)
        .map((_, x) => {
          const startX = Math.floor(domToCanvas(x, 0).x);
          const endX = Math.ceil(domToCanvas(x + 1, 0).x);
          const { min, max, abs } = range(waveform, startX, endX);
          return { x, startX, endX, minY: min, maxY: max, absY: abs };
        }),
    [transform, width, waveform, domToCanvas],
  );

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const timeX = sampleRate * time;

    ctx.lineWidth = lineWidth;

    for (const { startX, absY, minY, maxY, x } of points) {
      const isFuture = startX > timeX;
      const isClipping = absY > clippingY;
      ctx.beginPath();
      ctx.strokeStyle = isClipping
        ? isFuture
          ? futureClipping
          : pastClipping
        : isFuture
          ? future
          : past;
      const top = tension(minY, 0.1);
      const bottom = tension(maxY, 0.1);
      ctx.moveTo(x, top ? canvasToDom(x, top).y : height / 2 - lineWidth);
      ctx.lineTo(x, bottom ? canvasToDom(x, bottom).y : height / 2 + lineWidth);
      ctx.stroke();
    }

    ctx.textBaseline = "hanging";
    ctx.textAlign = "center";

    const ticks =
      (domToCanvas(tickDist, 0).x - domToCanvas(0, 0).x) / sampleRate;
    const interval =
      tickIntervals.find((interval) => interval > ticks) ||
      tickIntervals.at(-1)!;

    const startX = round(domToCanvas(0, 0).x / sampleRate, interval);
    const endX = round(domToCanvas(width, 0).x / sampleRate, interval);

    for (let time = startX; time <= endX; time += interval) {
      const x = canvasToDom(time * sampleRate, 0).x;
      ctx.beginPath();
      ctx.strokeStyle = future;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, (2 * height) / tickDist);
      ctx.stroke();
      ctx.fillText(
        formatTime(time) + (interval < 1 ? ":" + formatMs(time) : ""),
        x,
        (3 * height) / tickDist,
      );
    }
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.strokeStyle = future;
    const mouseTop = canvasToDom(mouseX, -1);
    const mouseBottom = canvasToDom(mouseX, 1);
    ctx.moveTo(mouseTop.x, mouseTop.y);
    ctx.lineTo(mouseBottom.x, mouseBottom.y);
    ctx.stroke();

    ctx.lineWidth = lineWidth * 2;
    ctx.beginPath();
    ctx.strokeStyle = pastClipping;
    const timeTop = canvasToDom(timeX, -1);
    const timeBottom = canvasToDom(timeX, 1);
    ctx.moveTo(timeTop.x, timeTop.y);
    ctx.lineTo(timeBottom.x, timeBottom.y);
    ctx.stroke();
  }, [
    transform,
    canvasToDom,
    domToCanvas,
    width,
    height,
    mouseX,
    points,
    time,
  ]);

  const wheel = useCallback(
    (event: WheelEvent) => {
      if (!matrix.current) return;
      event.preventDefault();
      const { deltaY, shiftKey, ctrlKey, clientX, clientY } = event;
      const x = clientX - left;
      const y = clientY - top;
      if (shiftKey) {
        const mouse = domToCanvas(x, y);
        matrix.current.scale(new Vector3(1.1 ** deltaY, 1, 1));
        const newMouse = domToCanvas(x, y);
        const { translate, scale } = decompose();
        translate.add(new Vector3((newMouse.x - mouse.x) * scale.x, 0, 0));
        matrix.current.setPosition(translate);
      } else if (ctrlKey) {
        matrix.current.scale(new Vector3(1, 1.1 ** deltaY, 1));
      } else {
        const { translate } = decompose();
        translate.add(new Vector3(deltaY, 0, 0));
        matrix.current.setPosition(translate);
      }
      updateTransform();
    },
    [left, top, domToCanvas, decompose, updateTransform],
  );
  useEventListener("wheel", wheel, canvasRef);

  return (
    <canvas
      ref={canvasRef}
      className={classes.waveform}
      onClick={({ clientX }) =>
        onSeek(domToCanvas(clientX - left, 0).x / sampleRate)
      }
      onMouseMove={({ clientX }) => setMouseX(domToCanvas(clientX - left, 0).x)}
    />
  );
};

export default Waveform;
