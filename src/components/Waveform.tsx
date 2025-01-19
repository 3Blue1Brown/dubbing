import { useCallback, useEffect, useMemo, useRef } from "react";
import { clamp } from "lodash";
import { proxy, useSnapshot } from "valtio";
import {
  useElementBounding,
  useEventListener,
  useMouse,
} from "@reactuses/core";
import { range } from "@/util/array";
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
 * "amplitude"/"amp" = -1 to 1
 * "sample" = audio sample #
 * "time" = seconds
 * "tick" = time label on waveform
 *
 * "client" = coord in terms of canvas element, i.e. in pixels (sort-of)
 * "waveform" = coord in terms of waveform, where x = sample # and y = sample amp
 */

/** line thickness in px */
const lineWidth = 1;
/** colors */
const pastColor = "#00bfff";
const timeColor = "#ff1493";
const futureColor = "#c0c0c0";
/** min dist between ticks, in client coords */
const tickDist = 50;
/** time between ticks at different zoom levels, in seconds */
const tickTimes = [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10, 20, 30, 60, 120, 600];
/** extra draw resolution */
const oversample = window.devicePixelRatio * 2;
/** speed/strength of waveform scrolling */
const scrollXPower = 100;
const scrollYPower = 1.2;
let maxDelta = 0;

/** audio waveform with zoom, pan, etc */
const Waveform = ({
  waveform,
  playing,
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

  /** mutable transform */
  const transform = useRef(
    proxy({
      translate: { x: 0, y: 0 },
      scale: { x: 0, y: 1 },
    }),
  );

  /** re-render anytime transform changes */
  const transformChanged = useSnapshot(transform.current);

  /** convert waveform to client coords */
  const waveformToClient = useCallback((x: number, y: number) => {
    x *= transform.current.scale.x;
    y *= transform.current.scale.y;
    x += transform.current.translate.x;
    y += transform.current.translate.y;
    return { x, y };
  }, []);

  /** convert client coords to waveform coords */
  const clientToWaveform = useCallback((x: number, y: number) => {
    x -= transform.current.translate.x;
    y -= transform.current.translate.y;
    x /= transform.current.scale.x;
    y /= transform.current.scale.y;
    return { x, y };
  }, []);

  /** limit transform  */
  const limitTransform = useCallback(() => {
    const length = waveform.length || sampleRate;
    /** limit zoom */
    transform.current.scale.x = clamp(
      transform.current.scale.x,
      width / length,
      length / (100 * sampleRate),
    );
    transform.current.scale.y = clamp(
      transform.current.scale.y,
      1 * (height / 2),
      100 * (height / 2),
    );
    /** limit pan */
    transform.current.translate.x = clamp(
      transform.current.translate.x,
      width - transform.current.scale.x * length,
      0,
    );
    transform.current.translate.y = clamp(
      transform.current.translate.y,
      height / 2,
      height / 2,
    );
  }, [width, height, sampleRate, waveform.length]);

  limitTransform();

  /** center current time in waveform view */
  const scroll = useCallback(
    (time: number) => {
      /** current time sample # */
      const currentSample = time * sampleRate;
      /** center */
      transform.current.translate.x =
        width / 2 - currentSample * transform.current.scale.x;
    },
    [width, sampleRate],
  );

  useEffect(() => {
    /** auto-scroll */
    if (playing && autoScroll) scroll(time);
  }, [scroll, playing, autoScroll, time]);

  /** waveform points to draw */
  const points = useMemo(
    () =>
      /** client x from 0 (left side of waveform viewport) to width (right side) */
      Array(Math.floor(width) + 1)
        .fill(0)
        .map((_, clientX) => {
          /** silence eslint react-hooks warning */
          void transformChanged;
          /** left-most sample within pixel */
          const leftSample = Math.floor(clientToWaveform(clientX, 0).x);
          /** right-most sample within pixel */
          const rightSample = Math.floor(clientToWaveform(clientX + 1, 0).x);
          /** get extent of samples within range */
          const { min, max } = range(waveform, leftSample, rightSample);
          return { clientX, leftSample, rightSample, minAmp: min, maxAmp: max };
        }),
    [width, waveform, clientToWaveform, transformChanged],
  );

  /** mouse coords */
  const _mouse = useMouse(canvasRef);
  const mouseClient = { x: _mouse.elementX || 0, y: _mouse.elementY || 0 };
  const mouseWaveform = clientToWaveform(mouseClient.x, mouseClient.y);

  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    /** clear previous canvas contents */
    ctx.clearRect(0, 0, width, height);

    /** sample # of current time */
    const currentSample = sampleRate * time;

    /** set base draw styles */
    ctx.lineWidth = lineWidth;
    ctx.textBaseline = "hanging";
    ctx.textAlign = "center";
    ctx.font = "14px Open Sans";
    ctx.strokeStyle = futureColor;
    ctx.fillStyle = futureColor;

    /** draw waveform */
    for (const { leftSample, minAmp, maxAmp, clientX } of points) {
      ctx.beginPath();
      ctx.strokeStyle = leftSample > currentSample ? futureColor : pastColor;
      ctx.moveTo(clientX, waveformToClient(0, minAmp).y - lineWidth / 2);
      ctx.lineTo(clientX, waveformToClient(0, maxAmp).y + lineWidth / 2);
      ctx.stroke();
    }

    /** left side of waveform viewport */
    const waveformLeft = clientToWaveform(0, 0);
    /** right side of waveform viewport */
    const waveformRight = clientToWaveform(width, 0);

    /** convert min tick dist to time interval */
    const minTickTime =
      (clientToWaveform(tickDist, 0).x - waveformLeft.x) / sampleRate;
    /** find min tick time interval that satisfies min tick dist  */
    const tickTime =
      tickTimes.find((tickTime) => tickTime > minTickTime) || tickTimes.at(-1)!;

    /** time at left/right sides of waveform */
    const leftTime = round(waveformLeft.x / sampleRate, tickTime);
    const rightTime = round(waveformRight.x / sampleRate, tickTime);

    /** set tick styles */
    ctx.strokeStyle = futureColor;

    let text = "";

    for (let time = leftTime; time <= rightTime; time += tickTime / 2) {
      /** client x coord */
      const clientX = waveformToClient(time * sampleRate, 0).x;

      /** draw tick line mark */
      ctx.beginPath();
      ctx.moveTo(clientX, 0);
      ctx.lineTo(clientX, (2 * height) / tickDist);
      ctx.stroke();

      /** draw text label every other tick */
      text = text
        ? ""
        : formatTime(time) + (tickTime < 1 ? ":" + formatMs(time) : "");

      /** draw text label */
      if (text) ctx.fillText(text, clientX, (3 * height) / tickDist);
    }

    /** draw mouse position line */
    ctx.beginPath();
    ctx.moveTo(mouseClient.x, 0);
    ctx.lineTo(mouseClient.x, height);
    ctx.stroke();

    /** draw current time line */
    ctx.lineWidth = lineWidth * 2;
    ctx.strokeStyle = timeColor;
    ctx.beginPath();
    const timeTop = waveformToClient(currentSample, -1);
    const timeBottom = waveformToClient(currentSample, 1);
    ctx.moveTo(timeTop.x, timeTop.y);
    ctx.lineTo(timeBottom.x, timeBottom.y);
    ctx.stroke();

    /** draw viewport scroll bar */
    ctx.strokeStyle = futureColor;
    ctx.beginPath();
    const factor = width / waveform.length;
    ctx.moveTo(factor * waveformLeft.x, height - ctx.lineWidth / 2);
    ctx.lineTo(factor * waveformRight.x, height - ctx.lineWidth / 2);
    ctx.stroke();
  }, [
    waveform,
    clientToWaveform,
    waveformToClient,
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
      let { deltaX, deltaY, shiftKey, ctrlKey, clientX, clientY } = event;

      /** normalize scroll deltas */
      maxDelta = Math.max(maxDelta, Math.abs(deltaX), Math.abs(deltaY));
      deltaX /= maxDelta;
      deltaY /= maxDelta;

      /** coords in terms of element */
      const x = clientX - left;
      const y = clientY - top;

      /** whether user is trying to scroll mostly vertically */
      const vertical = Math.abs(deltaY) / Math.abs(deltaX) > 1;
      /** whether user is trying to scroll mostly horizontally (usually means trackpad) */
      const horizontal = Math.abs(deltaX) / Math.abs(deltaY) > 1;

      if (vertical) {
        if (ctrlKey) {
          /** zoom amplitude */
          transform.current.scale.y *= scrollYPower ** -deltaY;
        } else if (shiftKey) {
          /** pan left/right */
          transform.current.translate.x += deltaY * scrollXPower;
        } else {
          /** zoom in/out */
          const mouseWaveform = clientToWaveform(x, y);
          transform.current.scale.x *= scrollYPower ** -deltaY;
          limitTransform();
          /** offset left/right pan so mouse stays over same spot in waveform */
          const newMouse = clientToWaveform(x, y);
          transform.current.translate.x +=
            (newMouse.x - mouseWaveform.x) * transform.current.scale.x;
        }
      } else if (horizontal) {
        /** pan left/right */
        transform.current.translate.x += deltaX * scrollXPower;
      }

      limitTransform();
    },
    [left, top, clientToWaveform, limitTransform],
  );

  /** on mouse wheel or track pad scroll */
  useEventListener("wheel", wheel, canvasRef);

  return (
    <canvas
      ref={canvasRef}
      className={classes.waveform}
      onClick={({ clientX }) =>
        onSeek(clientToWaveform(clientX - left, 0).x / sampleRate)
      }
    />
  );
};

export default Waveform;
