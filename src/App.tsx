import { atom, getDefaultStore, useAtom } from "jotai";
import type { PrimitiveAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";
import { useEventListener, useMeasure } from "@reactuses/core";
import { clamp } from "lodash";

const sampleRate = 44100;
const bitRate = 16;

function App() {
  const [getMicrophoneStream] = useAtom(microphoneStream);
  const [getMediaRecorder] = useAtom(microphoneStream);

  const { start, recording, stop, waveform } = useRecording();

  if (!getMicrophoneStream || !getMediaRecorder)
    return (
      <>
        Reset this page's permissions, refresh, and allow usage of microphone.
      </>
    );

  return (
    <>
      <button onClick={recording ? stop : start}>
        {recording ? "stop" : "start"}
      </button>

      <Waveform waveform={waveform} />
    </>
  );
}

export default App;

const audioContext = atom<AudioContext>();
const microphoneStream = atom<MediaStream>();
const mediaRecorder = atom<MediaRecorder>();

// const getAtom = <Value,>(atom: Atom<Value>) => getDefaultStore().get(atom);

const setAtom = <Value,>(atom: PrimitiveAtom<Value>, value: Value) =>
  getDefaultStore().set(atom, value);

const setup = async () => {
  try {
    setAtom(audioContext, new AudioContext());
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        sampleRate,
        sampleSize: bitRate,
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    setAtom(microphoneStream, stream);
    setAtom(mediaRecorder, new MediaRecorder(stream));
  } catch (error) {
    console.error(error);
  }
};

setup();

const useRecording = () => {
  const [waveform, setWaveform] = useState<number[]>([]);
  const headers = useRef<ArrayBuffer>();
  const headersLength = useRef(0);
  const [recording, setRecording] = useState(false);

  const [getRecorder] = useAtom(mediaRecorder);
  const [getContext] = useAtom(audioContext);

  const record = useCallback(
    async (event: BlobEvent) => {
      if (!getContext) throw Error("No context");

      const buffer = await event.data.arrayBuffer();
      if (!headers.current) {
        headers.current = buffer;
        headersLength.current = (
          await getContext.decodeAudioData(buffer.slice(0))
        ).length;
      }
      const decoded = await getContext.decodeAudioData(
        await new Blob([headers.current, buffer]).arrayBuffer()
      );
      const waveformChunk = Array.from(
        decoded.getChannelData(0).slice(headersLength.current)
      );
      setWaveform((waveform) => waveform.concat(waveformChunk));
    },
    [getContext]
  );

  const start = useCallback(() => {
    if (!getRecorder) throw Error("No recorder");
    setRecording(true);
    getRecorder.addEventListener("dataavailable", record);
    getRecorder.start(100);
  }, [getRecorder, record]);

  const stop = useCallback(() => {
    if (!getRecorder) throw Error("No recorder");
    setRecording(false);
    getRecorder.stop();
    getRecorder.removeEventListener("dataavailable", record);
  }, [getRecorder, record]);

  return { waveform, start, recording, stop };
};

type Props = {
  waveform: number[];
};

const Waveform = ({ waveform }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>();

  const [{ width, height }] = useMeasure(canvasRef);

  const stroke = "black";
  const scaleXMin = width / waveform.length;

  const [scaleX, setScaleX] = useClamped(scaleXMin, scaleXMin, 10);
  const [scaleY, setScaleY] = useClamped(1, 1, 10);

  const getTranslateXMin = useCallback(
    (scaleX: number) => width - scaleX * waveform.length,
    [width, waveform.length]
  );
  const translateXMin = getTranslateXMin(scaleX);

  const [translateX, setTranslateX] = useClamped(0, translateXMin, 0);
  const translateY = height / 2;

  const transform = new DOMMatrix()
    .translate(translateX, translateY)
    .scale(scaleX, scaleY);

  useEffect(() => {
    setScaleX(scaleXMin);
  }, [scaleXMin, setScaleX]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctxRef.current ??= canvas.getContext("2d");
    const ctx = ctxRef.current;
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.setTransform(transform);
    ctx.moveTo(0, 0);
    waveform.forEach((y, x) => ctx.lineTo(x, y * height));
    ctx.restore();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  const zoom = useCallback(
    (event: WheelEvent) => {
      event.preventDefault();

      const { deltaY, shiftKey, ctrlKey, clientX, clientY } = event;

      if (shiftKey) {
        const newScaleX = setScaleX(scaleX * 1.1 ** (deltaY > 0 ? 1 : -1));
        const { left = 0, top = 0 } =
          canvasRef.current?.getBoundingClientRect() || {};
        const mouse = new DOMPoint(clientX - left, clientY - top);
        const mouseX = transform.inverse().transformPoint(mouse).x;
        const newMouseX = new DOMMatrix()
          .translate(translateX, translateY)
          .scale(newScaleX, scaleY)
          .inverse()
          .transformPoint(mouse).x;
        setTranslateX(translateX + (newMouseX - mouseX) * newScaleX, {
          min: getTranslateXMin(newScaleX),
        });
      } else if (ctrlKey) setScaleY(scaleY * 1.1 ** (deltaY > 0 ? 1 : -1));
      else setTranslateX(translateX + deltaY);
    },
    [
      transform,
      getTranslateXMin,
      scaleX,
      scaleY,
      translateX,
      translateY,
      setScaleX,
      setScaleY,
      setTranslateX,
    ]
  );

  useEventListener("wheel", zoom, canvasRef);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "calc(100% - 60px)",
        height: "500px",
        margin: "30px",
        overflow: "visible",
        boxShadow: "1px 2px 5px #00000080",
      }}
    />
  );
};

const useClamped = (defaultValue: number, min = -Infinity, max = Infinity) => {
  const [value, setValue] = useState(defaultValue);
  const set = useCallback(
    (value: number, options?: { min?: number; max?: number }) => {
      const newValue = clamp(value, options?.min ?? min, options?.max ?? max);
      setValue(newValue);
      return newValue;
    },
    [min, max]
  );
  return [value, set] as const;
};
