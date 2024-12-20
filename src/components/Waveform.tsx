import { useCallback, useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { Matrix4, Quaternion, Vector3 } from "three";
import { useDeepCompareMemo } from "use-deep-compare";
import {
  useElementBounding,
  useEventListener,
  useMeasure,
} from "@reactuses/core";
import { autoScrollAtom, sampleRateAtom } from "@/pages/lesson/audio";
import { range } from "@/util/array";
import { round } from "@/util/math";
import { formatMs, formatTime } from "@/util/string";
import classes from "./Waveform.module.css";

type Props = {
  waveform: Int16Array;
  playing: boolean;
  time: number;
  onSeek: (value: number) => void;
};

const lineWidth = 1;
const pastColor = "#00bfff";
const timeColor = "#ff1493";
const futureColor = "#c0c0c0";
const tickDist = 50;
const tickIntervals = [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 20, 30, 60, 120, 600];
const oversample = window.devicePixelRatio * 2;

const Waveform = ({ waveform, playing, time, onSeek }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

  const sampleRate = useAtomValue(sampleRateAtom);
  const autoScroll = useAtomValue(autoScrollAtom);

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
    const length = waveform.length || sampleRate;
    const { translate, scale } = decompose();
    scale.max(new Vector3(width / length, 1 * (height / 2), 1));
    scale.min(new Vector3(length / (100 * sampleRate), 100 * (height / 2), 1));
    translate.max(new Vector3(width - scale.x * length, height / 2, 0));
    translate.min(new Vector3(0, height / 2, 0));
    matrix.current.compose(translate, new Quaternion(), scale);
    setTransform((transform) => transform + 1);
  }, [decompose, waveform, width, height, sampleRate]);

  useEffect(() => {
    matrix.current.scale(new Vector3(0, 1, 1));
    updateTransform();
  }, [updateTransform]);

  const scroll = useCallback(
    (time: number) => {
      const timeX = time * sampleRate;
      const { scale } = decompose();
      matrix.current.setPosition(
        new Vector3(width / 2 - timeX * scale.x, 0, 0),
      );
      updateTransform();
    },
    [width, decompose, updateTransform, sampleRate],
  );

  useEffect(() => {
    if (playing && autoScroll) scroll(time);
  }, [scroll, playing, autoScroll, time]);

  useEffect(() => {
    if (!canvasRef.current) return;
    canvasRef.current.width = width * oversample;
    canvasRef.current.height = height * oversample;
    ctxRef.current = canvasRef.current.getContext("2d");
    ctxRef.current?.scale(oversample, oversample);
  }, [width, height]);

  const points = useDeepCompareMemo(
    () =>
      Array(Math.floor(width) + 1)
        .fill(0)
        .map((_, x) => {
          const startX = Math.floor(domToCanvas(x, 0).x);
          const endX = Math.floor(domToCanvas(x + 1, 0).x);
          const { min, max } = range(waveform, startX, endX);
          return { x, startX, endX, minY: min, maxY: max };
        }),
    [playing, transform, width, waveform, domToCanvas],
  );

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const timeX = sampleRate * time;

    ctx.lineWidth = lineWidth;
    ctx.textBaseline = "hanging";
    ctx.textAlign = "center";
    ctx.font = "14px Open Sans";
    ctx.strokeStyle = futureColor;
    ctx.fillStyle = futureColor;

    for (const { startX, minY, maxY, x } of points) {
      ctx.beginPath();
      ctx.strokeStyle = startX > timeX ? futureColor : pastColor;
      ctx.moveTo(x, canvasToDom(x, minY).y - lineWidth / 2);
      ctx.lineTo(x, canvasToDom(x, maxY).y + lineWidth / 2);
      ctx.stroke();
    }

    const ticks =
      (domToCanvas(tickDist, 0).x - domToCanvas(0, 0).x) / sampleRate;
    const interval =
      tickIntervals.find((interval) => interval > ticks) ||
      tickIntervals.at(-1)!;

    const startX = round(domToCanvas(0, 0).x / sampleRate, interval);
    const endX = round(domToCanvas(width, 0).x / sampleRate, interval);

    ctx.strokeStyle = futureColor;

    let text = true;
    for (let time = startX; time <= endX; time += interval / 2) {
      const x = canvasToDom(time * sampleRate, 0).x;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, (2 * height) / tickDist);
      ctx.stroke();
      if (text)
        ctx.fillText(
          formatTime(time) + (interval < 1 ? ":" + formatMs(time) : ""),
          x,
          (3 * height) / tickDist,
        );
      text = !text;
    }

    ctx.beginPath();
    const mouseTop = canvasToDom(mouseX, -1);
    const mouseBottom = canvasToDom(mouseX, 1);
    ctx.moveTo(mouseTop.x, mouseTop.y);
    ctx.lineTo(mouseBottom.x, mouseBottom.y);
    ctx.stroke();

    ctx.lineWidth = lineWidth * 2;
    ctx.strokeStyle = timeColor;
    ctx.beginPath();
    const timeTop = canvasToDom(timeX, -1);
    const timeBottom = canvasToDom(timeX, 1);
    ctx.moveTo(timeTop.x, timeTop.y);
    ctx.lineTo(timeBottom.x, timeBottom.y);
    ctx.stroke();

    ctx.strokeStyle = futureColor;
    ctx.beginPath();
    const factor = width / waveform.length;
    ctx.moveTo(factor * domToCanvas(0, 0).x, height - ctx.lineWidth / 2);
    ctx.lineTo(factor * domToCanvas(width, 0).x, height - ctx.lineWidth / 2);
    ctx.stroke();
  }, [
    transform,
    waveform,
    canvasToDom,
    domToCanvas,
    width,
    height,
    mouseX,
    points,
    time,
    sampleRate,
  ]);

  const wheel = useCallback(
    (event: WheelEvent) => {
      if (!matrix.current) return;
      event.preventDefault();
      const { deltaX, deltaY, shiftKey, ctrlKey, clientX, clientY } = event;
      const x = clientX - left;
      const y = clientY - top;
      if (shiftKey || ctrlKey) {
        matrix.current.scale(new Vector3(1, 1.01 ** -deltaY, 1));
        updateTransform();
      } else if (deltaY && Math.abs(deltaX) < 2) {
        const mouse = domToCanvas(x, y);
        matrix.current.scale(new Vector3(1.01 ** -deltaY, 1, 1));
        updateTransform();
        const newMouse = domToCanvas(x, y);
        const { translate, scale } = decompose();
        translate.add(new Vector3((newMouse.x - mouse.x) * scale.x, 0, 0));
        matrix.current.setPosition(translate);
        updateTransform();
      } else if (deltaX && Math.abs(deltaY) < 2) {
        const { translate } = decompose();
        translate.add(new Vector3(deltaX * 10, 0, 0));
        matrix.current.setPosition(translate);
        updateTransform();
      }
      setMouseX(domToCanvas(x, 0).x);
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
