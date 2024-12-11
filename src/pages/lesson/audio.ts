import { atom } from "jotai";
import { createMp3Encoder } from "wasm-media-encoders";
import { lengthAtom } from "@/pages/lesson/data";
import { playVideo, seekVideo, stopVideo } from "@/pages/lesson/Player";
import { toFloat } from "@/util/array";
import { getAtom, setAtom, subscribe } from "@/util/atoms";
import { download, type Filename } from "@/util/download";
import worklet from "./wave-processor.js?url";

export const timeAtom = atom(0);
export const playingAtom = atom(false);
export const recordingAtom = atom(false);

export const contextAtom = atom<AudioContext>();
export const micStreamAtom = atom<MediaStream>();
export const micTimeAtom = atom<number[]>([]);
export const micFreqAtom = atom<number[]>([]);
export const devicesAtom = atom<MediaDeviceInfo[]>([]);
export const deviceAtom = atom<string>();

export const sampleRate = 44100;
export const bitRate = 16;
export const peak = 2 ** (bitRate - 1);
export const fftSize = 2 ** 10;

let micSource: MediaStreamAudioSourceNode;
let micAnalyzer: AnalyserNode;
let micRecorder: AudioWorkletNode;
let workletInstalled = false;

export const refreshDevices = async () => {
  const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
    ({ kind, label }) => kind === "audioinput" && label,
  );
  setAtom(devicesAtom, devices);
  if (!getAtom(deviceAtom)) setAtom(deviceAtom, devices[0]?.deviceId);
};

const updateContext = async () => {
  let micStream = getAtom(micStreamAtom);
  if (!micStream) {
    micStream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        sampleRate,
        sampleSize: bitRate,
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        deviceId: getAtom(deviceAtom),
      },
    });
    setAtom(micStreamAtom, micStream);
  }

  let context = getAtom(contextAtom);

  if (!context) {
    context = new AudioContext();
    setAtom(contextAtom, context);
  }

  if (!workletInstalled) {
    await context.audioWorklet.addModule(worklet);
    workletInstalled = true;
  }

  if (!micSource) {
    micSource = context.createMediaStreamSource(micStream);
    micAnalyzer = context.createAnalyser();
    micAnalyzer.fftSize = fftSize;
    micSource.connect(micAnalyzer);
  }

  if (!micRecorder) {
    micRecorder = new AudioWorkletNode(context, "wave-processor");
    micSource.connect(micRecorder);
    micRecorder.port.onmessage = updateRecorder;
  }
};

const micTimeBuffer = new Uint8Array(fftSize);
const micFreqBuffer = new Uint8Array(fftSize / 2);

const updateAnalyzer = () => {
  micAnalyzer?.getByteTimeDomainData(micTimeBuffer);
  micAnalyzer?.getByteFrequencyData(micFreqBuffer);
  setAtom(
    micTimeAtom,
    Array.from(micTimeBuffer ?? []).map((value) => 1 - value / 128),
  );
  setAtom(
    micFreqAtom,
    Array.from(micFreqBuffer ?? []).map((value) => value / 128),
  );
};

export const waveformAtom = atom<Int16Array>(new Int16Array());

export const offsetAtom = atom(0);

const updateRecorder = ({ data }: MessageEvent<Int16Array>) => {
  let waveform = getAtom(waveformAtom);
  if (!waveform.length)
    waveform = new Int16Array(sampleRate * getAtom(lengthAtom));

  if (getAtom(recordingAtom)) {
    const offset = getAtom(offsetAtom);
    waveform.set(data, offset);
    setAtom(offsetAtom, offset + data.length);
  }
  setAtom(waveformAtom, waveform);
};

export const init = async () => {
  subscribe(deviceAtom, updateContext);
  await refreshDevices();
  await updateContext();
  window.setInterval(updateAnalyzer, 30);
};

let timer: number;
let startedTime = 0;
let startedTimestamp = 0;

const updateTimer = (time?: number) => {
  startedTime = time ?? getAtom(timeAtom);
  startedTimestamp = window.performance.now();
};

export const play = () => {
  playVideo();
  setAtom(playingAtom, true);
  updateTimer();
  timer = window.setInterval(() =>
    setAtom(
      timeAtom,
      startedTime + (window.performance.now() - startedTimestamp) / 1000,
    ),
  );
};

export const stop = () => {
  stopVideo();
  setAtom(playingAtom, false);
  window.clearInterval(timer);
};

export const seek = (time: number = 0) => {
  disarmRecording();
  seekVideo(time);
  updateTimer(time);
  setAtom(timeAtom, time);
};

export const armRecording = () => {
  setAtom(recordingAtom, true);
};

export const disarmRecording = () => {
  setAtom(recordingAtom, false);
};

subscribe(timeAtom, (value) => {
  const length = getAtom(lengthAtom);
  if (value > length) {
    stop();
    setAtom(timeAtom, length);
  }
});

export const save = async (filename: Filename) => {
  const encoder = await createMp3Encoder();
  encoder.configure({ sampleRate, channels: 1, bitrate: 192 });
  const frames = encoder.encode([toFloat(getAtom(waveformAtom))]);
  const lastFrames = encoder.finalize();
  const blob = new Blob([frames, lastFrames], { type: "audio/mpeg" });
  const url = window.URL.createObjectURL(blob);
  download(url, filename, "mp3");
  window.URL.revokeObjectURL(url);
};
