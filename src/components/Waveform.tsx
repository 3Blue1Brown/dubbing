import { useCallback, useEffect, useRef, useState } from "react";
import { Matrix4, Quaternion, Vector3 } from "three";
import { useDeepCompareMemo } from "use-deep-compare";
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

  /** current transform matrix for converting waveform to client coords (non-reactive)*/
  const matrix = useRef(new Matrix4());
  /** signal that transform matrix has been updated (reactive) */
  const [transform, setTransform] = useState(0);

  /** convert waveform to client coords */
  const waveformToClient = useCallback(
    (x: number, y: number) =>
      new Vector3(x, y, 0).applyMatrix4(matrix.current.clone()),
    [],
  );

  /** convert client coords to waveform coords */
  const clientToWaveform = useCallback(
    (x: number, y: number) =>
      new Vector3(x, y, 0).applyMatrix4(matrix.current.clone().invert()),
    [],
  );

  /** decompose transform matrix into constituent components */
  const decompose = useCallback(() => {
    const translate = new Vector3();
    const scale = new Vector3();
    matrix.current.decompose(translate, new Quaternion(), scale);
    return { translate, scale };
  }, []);

  /** call after any change to transform matrix to re-render */
  const updateTransform = useCallback(() => {
    /** max length */
    const length = waveform.length || sampleRate;
    const { translate, scale } = decompose();
    /** limit zoom */
    scale.max(new Vector3(width / length, 1 * (height / 2), 1));
    scale.min(new Vector3(length / (100 * sampleRate), 100 * (height / 2), 1));
    /** limit pan */
    translate.max(new Vector3(width - scale.x * length, height / 2, 0));
    translate.min(new Vector3(0, height / 2, 0));
    /** re-assemble matrix */
    matrix.current.compose(translate, new Quaternion(), scale);
    /** trigger re-render */
    setTransform((transform) => transform + 1);
  }, [decompose, waveform, width, height, sampleRate]);

  useEffect(() => {
    /** initialize zoom */
    matrix.current.scale(new Vector3(0, 1, 1));
    updateTransform();
  }, [updateTransform]);

  /** center current time in waveform view */
  const scroll = useCallback(
    (time: number) => {
      /** current time sample # */
      const currentSample = time * sampleRate;
      const { scale } = decompose();
      /** center */
      matrix.current.setPosition(
        new Vector3(width / 2 - currentSample * scale.x, 0, 0),
      );
      updateTransform();
    },
    [width, decompose, updateTransform, sampleRate],
  );

  useEffect(() => {
    /** auto-scroll */
    if (playing && autoScroll) scroll(time);
  }, [scroll, playing, autoScroll, time]);

  /** waveform points to draw */
  const points = useDeepCompareMemo(
    () =>
      /** client x from 0 (left side of waveform viewport) to width (right side) */
      Array(Math.floor(width) + 1)
        .fill(0)
        .map((_, clientX) => {
          /** left-most sample within pixel */
          const leftSample = Math.floor(clientToWaveform(clientX, 0).x);
          /** right-most sample within pixel */
          const rightSample = Math.floor(clientToWaveform(clientX + 1, 0).x);
          /** get extent of samples within range */
          const { min, max } = range(waveform, leftSample, rightSample);
          return { clientX, leftSample, rightSample, minAmp: min, maxAmp: max };
        }),
    [playing, transform, width, waveform, clientToWaveform],
  );

  /** mouse coords */
  const _mouse = useMouse(canvasRef);
  const mouseClient = { x: _mouse.elementX, y: _mouse.elementY };
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
    transform,
    waveform,
    waveformToClient,
    clientToWaveform,
    mouseWaveform,
    mouseClient.x,
    width,
    height,
    points,
    time,
    sampleRate,
  ]);

  /** handle zoom/pan */
  const wheel = useCallback(
    (event: WheelEvent) => {
      if (!matrix.current) return;

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
      const vertical = Math.abs(deltaY) / Math.abs(deltaX) > 3;
      /** whether user is trying to scroll mostly horizontally (usually means trackpad) */
      const horizontal = Math.abs(deltaX) / Math.abs(deltaY) > 3;

      if (vertical) {
        if (ctrlKey) {
          /** zoom amplitude */
          matrix.current.scale(new Vector3(1, scrollYPower ** -deltaY, 1));
          updateTransform();
        } else if (shiftKey) {
          /** pan left/right */
          const { translate } = decompose();
          translate.add(new Vector3(deltaY * scrollXPower, 0, 0));
          matrix.current.setPosition(translate);
          updateTransform();
        } else {
          /** zoom in/out */
          const mouseWaveform = clientToWaveform(x, y);
          matrix.current.scale(new Vector3(scrollYPower ** -deltaY, 1, 1));
          updateTransform();
          /** offset left/right pan so mouse stays over same spot in waveform */
          const newMouse = clientToWaveform(x, y);
          const { translate, scale } = decompose();
          translate.add(
            new Vector3((newMouse.x - mouseWaveform.x) * scale.x, 0, 0),
          );
          matrix.current.setPosition(translate);
          updateTransform();
        }
      } else if (horizontal) {
        /** pan left/right */
        const { translate } = decompose();
        translate.add(new Vector3(deltaX * scrollXPower, 0, 0));
        matrix.current.setPosition(translate);
        updateTransform();
      }
    },
    [left, top, clientToWaveform, decompose, updateTransform],
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
