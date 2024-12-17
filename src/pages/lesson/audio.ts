import { atom } from "jotai";
import { createMp3Encoder } from "wasm-media-encoders";
import { lengthAtom } from "@/pages/lesson/data";
import {
  pauseVideo,
  playVideo,
  seekVideo,
  volumeVideo,
} from "@/pages/lesson/Player";
import test from "@/test.raw?url";
import { toFloat } from "@/util/array";
import { getAtom, setAtom, subscribe } from "@/util/atoms";
import { download, type Filename } from "@/util/download";
import worklet from "./wave-processor.js?url";

export const timeAtom = atom(0);
export const playingAtom = atom(false);
export const recordingAtom = atom(false);
export const balanceAtom = atom(0.8);
export const autoScrollAtom = atom(true);
export const playthroughAtom = atom(false);

export const micStreamAtom = atom<MediaStream>();
export const micTimeAtom = atom<number[]>([]);
export const micFreqAtom = atom<number[]>([]);
export const devicesAtom = atom<MediaDeviceInfo[]>([]);
export const deviceAtom = atom<string | null>(null);

export const sampleRate = 44100;
export const bitRate = 16;
export const peak = 2 ** (bitRate - 1);
export const fftSize = 2 ** 10;

let micContext: AudioContext | undefined;
let micSource: MediaStreamAudioSourceNode | undefined;
let micAnalyzer: AnalyserNode | undefined;
let micRecorder: AudioWorkletNode | undefined;
let micPlaythroughGain: GainNode | undefined;
const micTimeBuffer = new Uint8Array(fftSize);
const micFreqBuffer = new Uint8Array(fftSize / 2);

let playbackContext: AudioContext | undefined;
let playbackSource: AudioBufferSourceNode | undefined;
let playbackBuffer: AudioBuffer | undefined;
let playbackGain: GainNode | undefined;

export const waveformAtom = atom<Int16Array>(new Int16Array());
export const waveformUpdatedAtom = atom(0);

fetch(test)
  .then((response) => response.arrayBuffer())
  .then((buffer) => {
    setAtom(waveformAtom, new Int16Array(buffer));
    updatePlaybackBuffer();
  });

let timeTimer: number;
let markTime = 0;
let markTimestamp = 0;
let markSample = 0;

export const refreshDevices = async () => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const mics = devices.filter(({ kind }) => kind === "audioinput");
  setAtom(devicesAtom, mics);
  if (getAtom(deviceAtom) === null)
    setAtom(deviceAtom, mics[0]?.deviceId || "");
};

const updateContext = async () => {
  const micStream = await navigator.mediaDevices.getUserMedia({
    video: false,
    audio: {
      sampleRate,
      sampleSize: bitRate,
      channelCount: 1,
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      deviceId: getAtom(deviceAtom) || "",
    },
  });
  setAtom(micStreamAtom, micStream);

  if (!micContext) {
    micContext = new AudioContext();

    micAnalyzer = micContext.createAnalyser();
    micAnalyzer.fftSize = fftSize;

    await micContext.audioWorklet.addModule(worklet);
    micRecorder = new AudioWorkletNode(micContext, "wave-processor");
    micRecorder.port.onmessage = updateRecorder;
    micPlaythroughGain = micContext.createGain();
  }

  if (!playbackContext) {
    playbackContext = new AudioContext();
    updatePlaybackBuffer();
  }

  micSource = micContext.createMediaStreamSource(micStream);

  if (micAnalyzer) micSource.connect(micAnalyzer);
  if (micRecorder) micSource.connect(micRecorder);
  if (micPlaythroughGain) {
    micSource.connect(micPlaythroughGain);
    micPlaythroughGain.connect(micContext.destination);
  }

  updatePlaythroughGain();
  updatePlaybackGain();
};

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

const updatePlaybackGain = () => {
  const balance = getAtom(balanceAtom);
  const power = 2;
  volumeVideo((1 - balance) ** power * 100);
  if (playbackGain) playbackGain.gain.value = balance ** power;
};

const updatePlaythroughGain = () => {
  if (micPlaythroughGain)
    micPlaythroughGain.gain.value = getAtom(playthroughAtom) ? 1 : 0;
};

const updateTime = () => {
  const length = getAtom(lengthAtom);
  if (getAtom(timeAtom) > length) {
    stop();
    setAtom(timeAtom, length);
  }
};

let initted = false;

export const init = async () => {
  if (initted) return;

  initted = true;

  subscribe(deviceAtom, updateContext);

  subscribe(timeAtom, updateTime);

  subscribe(balanceAtom, updatePlaybackGain);

  subscribe(playthroughAtom, updatePlaythroughGain);

  await refreshDevices();

  window.setInterval(updateAnalyzer, 30);
};

const updateRecorder = ({ data }: MessageEvent<Int16Array>) => {
  let waveform = getAtom(waveformAtom);
  if (!waveform.length)
    waveform = new Int16Array(sampleRate * getAtom(lengthAtom));

  if (getAtom(playingAtom)) {
    if (getAtom(recordingAtom)) {
      waveform.set(data, markSample);
      setAtom(waveformUpdatedAtom, getAtom(waveformUpdatedAtom) + 1);
    }
    markSample += data.length;
  }

  setAtom(waveformAtom, waveform);
};

const updatePlaybackBuffer = () => {
  if (!playbackContext) return;
  const waveform = getAtom(waveformAtom);
  if (!waveform.length) return;
  const floats = toFloat(waveform);
  playbackBuffer = playbackContext.createBuffer(1, waveform.length, sampleRate);
  playbackBuffer.getChannelData(0).set(floats);
};

const updatePlaybackNode = () => {
  if (!playbackContext || !playbackBuffer) return;
  playbackSource = playbackContext.createBufferSource();
  playbackSource.buffer = playbackBuffer;
  playbackGain = playbackContext.createGain();
  playbackSource.connect(playbackGain);
  playbackGain.connect(playbackContext.destination);
};

const playPlayback = (time: number) => {
  stopPlayback();
  updatePlaybackNode();
  playbackSource?.start(0, time);
};

const stopPlayback = () => {
  try {
    playbackSource?.stop();
  } catch (error) {
    //
  }
};

const timerMark = (time?: number) => {
  markTime = time ?? getAtom(timeAtom);
  markTimestamp = window.performance.now();
  markSample = markTime * sampleRate;
};

export const play = () => {
  timerMark();
  playPlayback(getAtom(timeAtom));
  playVideo();
  setAtom(playingAtom, true);
  timeTimer = window.setInterval(
    () =>
      setAtom(
        timeAtom,
        markTime + (window.performance.now() - markTimestamp) / 1000,
      ),
    20,
  );
};

export const stop = () => {
  stopPlayback();
  pauseVideo();
  setAtom(playingAtom, false);
  window.clearInterval(timeTimer);
};

export const seek = (time: number) => {
  timerMark(time);
  if (getAtom(playingAtom)) playPlayback(time);
  seekVideo(time);
  setAtom(timeAtom, time);
};

export const armRecording = () => {
  setAtom(recordingAtom, true);
};

export const disarmRecording = () => {
  setAtom(recordingAtom, false);
  updatePlaybackBuffer();
};

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
