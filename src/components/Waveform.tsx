import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clamp } from "lodash";
import {
  useElementBounding,
  useEventListener,
  useMouse,
} from "@reactuses/core";
import { peaks } from "@/audio/peaks";
import { round } from "@/util/math";
import { formatMs, formatTime } from "@/util/string";
import classes from "./Waveform.module.css";

type Props = {
  /** waveform data */
  waveform: Int16Array;
  /** is playing */
  playing: boolean;
  /** current time in seconds */
  time: number;
  /** sample rate in hz */
  sampleRate: number;
  /** follow current time cursor while playing */
  autoScroll: boolean;
  /** current time change */
  onSeek: (time: number) => void;
};

/**
 * "amplitude"/"amp" = [-1, 1] "sample" = audio sample # "time" = seconds "tick"
 * = time label on waveform
 *
 * "client" = coord in terms of canvas element, i.e. in pixels (sort-of)
 * "waveform" = coord in terms of waveform, where x = sample # and y = sample
 * amp
 */

/** colors */
const pastColor = "#00bfff";
const timeColor = "#ff1493";
const futureColor = "#c0c0c0";
const controlColor = "#a0a0a0";
/** min dist between ticks, in client coords */
const tickDist = 50;
/** time between ticks at different zoom levels, in seconds */
const tickTimes = [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 20, 30, 60, 120, 600];
/** extra draw resolution */
const oversample = window.devicePixelRatio * 2;
/** speed/strength of waveform scrolling */
const scrollXPower = 1000;
const scrollYPower = 1.75;
let maxDelta = 0;

/** audio waveform with zoom, pan, etc */
const Waveform = ({
  waveform,
  // playing,
  time,
  sampleRate,
  autoScroll,
  onSeek,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

  /** get draw context */
  useEffect(() => {
    ctxRef.current = canvasRef.current?.getContext("2d");
  }, []);

  /** element size */
  const {
    left,
    top,
    width = 100,
    height = 100,
  } = useElementBounding(canvasRef);

  /** when size changes */
  useEffect(() => {
    if (!canvasRef.current) return;
    /** over-size canvas buffer */
    canvasRef.current.width = width * oversample;
    canvasRef.current.height = height * oversample;
    /** scale so that draw commands are is if canvas is regular size */
    ctxRef.current?.scale(oversample, oversample);
  }, [width, height]);

  const [transform, setTransform] = useState<Transform>({
    translate: { x: 0, y: 0 },
    scale: { x: 0, y: 1 },
  });

  /** limit transform */
  const limitTransform = useCallback(
    ({ translate, scale }: Transform) => {
      const length = waveform.length || sampleRate;
      /** limit zoom */
      scale.x = clamp(scale.x, width / length, length / (100 * sampleRate));
      scale.y = clamp(scale.y, 1 * (height / 2), 100 * (height / 2));
      /** limit pan */
      translate.x = clamp(translate.x, width - scale.x * length, 0);
      translate.y = clamp(translate.y, height / 2, height / 2);
      return { translate, scale };
    },
    [width, height, sampleRate, waveform.length],
  );

  /** initial limit */
  useEffect(() => {
    setTransform(limitTransform);
  }, [limitTransform]);

  /** auto-scroll */
  useEffect(() => {
    if (autoScroll)
      setTransform(({ translate, scale }) => {
        /** current time sample # */
        const currentSample = time * sampleRate;
        /** center horizontally */
        translate.x = width / 2 - currentSample * scale.x;
        return limitTransform({ translate, scale });
      });
  }, [sampleRate, width, autoScroll, time, limitTransform]);

  /** waveform points to draw */
  const points = useMemo(() => {
    /** left-most sample */
    const start = Math.floor(clientToWaveform(transform, 0, 0).x);
    /** right-most sample */
    const end = Math.ceil(clientToWaveform(transform, width, 0).x);
    /** skip some samples */
    const skip = clamp(Math.floor((end - start) / 1000), 1, 10);
    /** client x from 0 (left side of waveform viewport) to width (right side) */
    return peaks(waveform, start, end, width, skip);
  }, [width, waveform, transform]);

  /** mouse coords */
  const _mouse = useMouse(canvasRef);
  const mouseClient = { x: _mouse.elementX || 0, y: _mouse.elementY || 0 };
  const mouseWaveform = clientToWaveform(
    transform,
    mouseClient.x,
    mouseClient.y,
  );

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    /** clear previous canvas contents */
    ctx.clearRect(0, 0, width, height);

    /** sample # of current time */
    const currentSample = sampleRate * time;

    /** set base styles */
    ctx.textBaseline = "hanging";
    ctx.textAlign = "center";
    ctx.font = "14px Open Sans";

    /** set waveform styles */
    ctx.fillStyle = futureColor;
    ctx.strokeStyle = futureColor;
    ctx.lineWidth = 1;

    /** draw waveform */
    for (let clientX = 0; clientX < width; clientX++) {
      const { min = 0, max = 0 } = points[clientX] ?? {};
      ctx.beginPath();
      ctx.strokeStyle =
        clientToWaveform(transform, clientX, 0).x > currentSample
          ? futureColor
          : pastColor;
      ctx.moveTo(clientX, waveformToClient(transform, 0, min).y - 0.5);
      ctx.lineTo(clientX, waveformToClient(transform, 0, max).y + 0.5);
      ctx.stroke();
    }

    /** left side of waveform viewport */
    const waveformLeft = clientToWaveform(transform, 0, 0);
    /** right side of waveform viewport */
    const waveformRight = clientToWaveform(transform, width, 0);

    /** convert min tick dist to time interval */
    const minTickTime =
      (clientToWaveform(transform, tickDist, 0).x - waveformLeft.x) /
      sampleRate;
    /** find min tick time interval that satisfies min tick dist */
    const tickTime =
      tickTimes.find((tickTime) => tickTime > minTickTime) || tickTimes.at(-1)!;

    /** time at left/right sides of waveform */
    const leftTime = round(waveformLeft.x / sampleRate, tickTime);
    const rightTime = round(waveformRight.x / sampleRate, tickTime);

    /** set tick styles */
    ctx.strokeStyle = controlColor;
    ctx.lineWidth = 1;

    let text = "";
    for (let time = leftTime; time <= rightTime; time += tickTime / 2) {
      /** client x coord */
      const clientX = waveformToClient(transform, time * sampleRate, 0).x;

      /** draw tick line mark */
      ctx.beginPath();
      ctx.moveTo(clientX, 0);
      ctx.lineTo(clientX, height / 20);
      ctx.stroke();

      /** draw text label every other tick */
      text = text
        ? ""
        : formatTime(time) + (tickTime < 1 ? ":" + formatMs(time) : "");

      /** draw text label */
      if (text) ctx.fillText(text, clientX, (3 * height) / tickDist);
    }

    /** draw viewport scroll bar */
    ctx.strokeStyle = controlColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const factor = width / waveform.length;
    let barLeft = factor * waveformLeft.x + ctx.lineWidth;
    let barRight = factor * waveformRight.x - ctx.lineWidth;
    const extendBar = Math.max(0, 4 - (barRight - barLeft));
    barLeft -= extendBar / 2;
    barRight += extendBar / 2;
    ctx.moveTo(barLeft, height - 2);
    ctx.lineTo(barRight, height - 2);
    ctx.stroke();

    /** draw mouse position line */
    ctx.strokeStyle = futureColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(mouseClient.x, 0);
    ctx.lineTo(mouseClient.x, height);
    ctx.stroke();

    /** draw current time line */
    ctx.strokeStyle = timeColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const timeTop = waveformToClient(transform, currentSample, -1);
    const timeBottom = waveformToClient(transform, currentSample, 1);
    ctx.moveTo(timeTop.x, timeTop.y);
    ctx.lineTo(timeBottom.x, timeBottom.y);
    ctx.stroke();
  }, [
    transform,
    waveform,
    width,
    height,
    points,
    time,
    sampleRate,
    mouseWaveform,
    mouseClient.x,
  ]);

  /** handle zoom/pan */
  const wheel = useCallback(
    (event: WheelEvent) => {
      /** prevent page scroll */
      event.preventDefault();

      /** get scroll details */
      let { deltaX, deltaY, shiftKey, ctrlKey, altKey, clientX, clientY } =
        event;

      /** normalize scroll deltas */
      maxDelta = Math.max(maxDelta, Math.abs(deltaX), Math.abs(deltaY));
      deltaX /= maxDelta;
      deltaY /= maxDelta;

      /** make wheel effect more precise */
      if (altKey) {
        deltaX /= 5;
        deltaY /= 5;
      }

      /** coords in terms of element */
      const x = clientX - left;
      const y = clientY - top;

      /** whether user is trying to scroll mostly vertically */
      const vertical = Math.abs(deltaY) / Math.abs(deltaX) > 1.5;
      /**
       * whether user is trying to scroll mostly horizontally (usually means
       * trackpad)
       */
      const horizontal = Math.abs(deltaX) / Math.abs(deltaY) > 1.5;

      /** copy transform */
      let newTransform = { ...transform };

      if (vertical) {
        if (ctrlKey) {
          /** zoom amplitude */
          newTransform.scale.y *= scrollYPower ** -deltaY;
        } else if (shiftKey) {
          /** pan left/right */
          newTransform.translate.x += deltaY * scrollXPower;
        } else {
          /** zoom in/out */
          const mouseWaveform = clientToWaveform(newTransform, x, y);
          newTransform.scale.x *= scrollYPower ** -deltaY;
          newTransform = limitTransform(newTransform);
          /** offset left/right pan so mouse stays over same spot in waveform */
          const newMouse = clientToWaveform(newTransform, x, y);
          newTransform.translate.x +=
            (newMouse.x - mouseWaveform.x) * newTransform.scale.x;
        }
      } else if (horizontal) {
        /** pan left/right */
        // newTransform.translate.x += deltaX * scrollXPower;
      }

      /** update transform */
      newTransform = limitTransform(newTransform);
      setTransform(newTransform);
    },
    [transform, left, top, limitTransform],
  );

  /** on mouse wheel or track pad scroll */
  useEventListener("wheel", wheel, canvasRef);

  return (
    <canvas
      ref={canvasRef}
      className={classes.waveform}
      onClick={({ clientX }) =>
        onSeek(clientToWaveform(transform, clientX - left, 0).x / sampleRate)
      }
    />
  );
};

export default Waveform;

type Transform = {
  translate: { x: number; y: number };
  scale: { x: number; y: number };
};

/** convert waveform to client coords */
const waveformToClient = (transform: Transform, x: number, y: number) => {
  x *= transform.scale.x;
  y *= transform.scale.y;
  x += transform.translate.x;
  y += transform.translate.y;
  return { x, y };
};

/** convert client coords to waveform coords */
const clientToWaveform = (transform: Transform, x: number, y: number) => {
  x -= transform.translate.x;
  y -= transform.translate.y;
  x /= transform.scale.x;
  y /= transform.scale.y;
  return { x, y };
};
