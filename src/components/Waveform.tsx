import { useEffect, useMemo, useRef } from "react";
import {
  useElementBounding,
  useEventListener,
  useHover,
  useMouse,
} from "@reactuses/core";
import { peaks } from "@/audio/peaks";
import {
  clientToPercent,
  percentToSample,
  sampleToPercent,
  type Transform,
} from "@/components/transform";
import { getCSSVar } from "@/util/dom";
import { round } from "@/util/math";
import { formatTime } from "@/util/string";
import classes from "./Waveform.module.css";

type Props = {
  /** waveform data */
  waveform: Float32Array;
  /** view transform */
  transform: Transform;
  /** on mouse/trackpad wheel */
  onWheel: (event: WheelEvent) => void;
  /** current time, in seconds */
  time: number;
  /** sample rate, in hz */
  sampleRate: number;
  /** whether to show time ticks */
  showTicks: boolean;
  /** current time change */
  onSeek: (time: number) => void;
};

/** min dist between ticks, in px */
const minTickDist = 100;
/** length of tick, in px */
const tickLength = 5;
/** time between ticks at different zoom levels, in seconds */
const tickTimes = [
  0.001,
  0.005,
  0.01,
  0.05,
  0.1,
  0.5,
  1,
  2,
  5,
  10,
  20,
  30,
  60,
  60 * 2,
  60 * 5,
  60 * 10,
  60 * 20,
  60 * 30,
  60 * 60,
];
/** extra draw resolution */
const oversample = window.devicePixelRatio * 2;

/** audio waveform with zoom, pan, etc */
const Waveform = ({
  waveform,
  transform,
  onWheel,
  time,
  sampleRate,
  showTicks,
  onSeek,
}: Props) => {
  /** waveform before current time, "active" */
  const pastColor = getCSSVar("--primary");
  /** waveform after current time, "inactive" */
  const futureColor = getCSSVar("--gray");
  /** current time marker */
  const timeColor = getCSSVar("--secondary");
  /** other markings */
  const tickColor = getCSSVar("--gray");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

  /** get draw context */
  if (!ctxRef.current && canvasRef.current)
    ctxRef.current = canvasRef.current.getContext("2d");

  /** element size */
  const clientBbox = useElementBounding(canvasRef);
  const { width, height } = clientBbox;
  const halfHeight = height / 2;

  /** when size changes */
  useEffect(() => {
    if (!canvasRef.current) return;
    /** over-size canvas buffer */
    canvasRef.current.width = width * oversample;
    canvasRef.current.height = height * oversample;
    if (!ctxRef.current) return;
    /** scale so that draw commands are is if canvas is regular size */
    ctxRef.current.scale(oversample, oversample);
  }, [width, height]);

  /** sample # of current time */
  const currentSample = sampleRate * time;

  /** sample at left/right sides */
  const startSample = Math.floor(percentToSample(transform, { x: 0, y: 0 }).x);
  const endSample = Math.ceil(percentToSample(transform, { x: 1, y: 0 }).x);

  /** convert min tick dist to time interval */
  const minTickPercent = clientToPercent(clientBbox, { x: minTickDist, y: 0 });
  const minTickSample = percentToSample(transform, minTickPercent);
  const minTickTime = (minTickSample.x - startSample) / sampleRate;
  /** find min tick time interval that satisfies min tick dist */
  const tickInterval =
    tickTimes.find((tickTime) => tickTime > minTickTime) || tickTimes.at(-1)!;

  /** time at left/right sides */
  const startTime = round(startSample / sampleRate, tickInterval);
  const endTime = round(endSample / sampleRate, tickInterval);

  /** waveform points to draw */
  const points = useMemo(
    () =>
      peaks(
        waveform,
        startSample,
        endSample,
        /** one point for each pixel of width */
        width,
        /** larger # of samples -> skip more */
        (endSample - startSample) / 1000,
      ),
    [waveform, startSample, endSample, width],
  );

  /** mouse coords */
  const mouseClient = useMouse(canvasRef);
  const hovered = useHover(canvasRef);

  const ctx = ctxRef.current;
  if (ctx) {
    /** clear previous canvas contents */
    ctx.clearRect(0, 0, width, height);

    /** draw waveform */
    {
      ctx.fillStyle = futureColor;
      ctx.strokeStyle = futureColor;
      ctx.lineWidth = 1;

      for (let x = 0; x < points.length; x++) {
        /** get point */
        const { min, max, start } = points[x]!;

        if (!min && !max) continue;

        /** draw line */
        ctx.strokeStyle = start > currentSample ? futureColor : pastColor;
        const top = sampleToPercent(transform, { x: 0, y: min }).y;
        const bottom = sampleToPercent(transform, { x: 0, y: max }).y;
        ctx.beginPath();
        ctx.moveTo(x, halfHeight + top * halfHeight);
        ctx.lineTo(x, halfHeight + bottom * halfHeight);
        ctx.stroke();
      }
    }

    /** draw ticks (time labels) */
    if (showTicks) {
      ctx.fillStyle = tickColor;
      ctx.strokeStyle = tickColor;
      ctx.lineWidth = 1;
      ctx.textBaseline = "hanging";
      ctx.textAlign = "center";
      ctx.font = "14px Open Sans";

      /** whether to draw label on tick */
      let text = "";

      for (
        let tickTime = startTime;
        tickTime <= endTime;
        tickTime += tickInterval / 2
      ) {
        /** client x coord */
        const x =
          sampleToPercent(transform, { x: tickTime * sampleRate, y: 0 }).x *
          width;

        /** draw line */
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, tickLength);
        ctx.stroke();

        /** draw text, every other tick */
        text = text ? "" : formatTime(tickTime, tickInterval < 1);
        if (text) ctx.fillText(text, x, tickLength);
      }
    }

    /** draw mouse position line */
    if (hovered) {
      ctx.textBaseline = "bottom";
      ctx.textAlign = "left";
      ctx.font = "14px Open Sans";
      ctx.fillStyle = futureColor;
      ctx.strokeStyle = futureColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(mouseClient.elementX, 0);
      ctx.lineTo(mouseClient.elementX, height);
      ctx.stroke();
      ctx.fillText(
        formatTime(time),
        mouseClient.elementX + ctx.lineWidth * 2,
        height,
      );
    }

    /** draw current time line */
    {
      ctx.strokeStyle = timeColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const x =
        width * sampleToPercent(transform, { x: time * sampleRate, y: 0 }).x;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  /** on mouse wheel or track pad scroll */
  useEventListener("wheel", onWheel, canvasRef);

  return (
    <canvas
      ref={canvasRef}
      className={classes.waveform}
      onClick={({ clientX }) => {
        const percent = clientToPercent(clientBbox, { x: clientX, y: 0 });
        const sample = percentToSample(transform, percent);
        onSeek(sample.x / sampleRate);
      }}
    />
  );
};

export default Waveform;
