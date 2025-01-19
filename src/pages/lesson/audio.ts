import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { pauseVideo, playVideo, seekVideo } from "@/pages/lesson/Player";
import test from "@/test.raw?url";
import { toFloat } from "@/util/array";
import { countdownAtom, getAtom, setAtom, subscribe } from "@/util/atoms";
import worklet from "./wave-processor.js?url";

export const timeAtom = atom(0);
export const playingAtom = atom(false);
export const recordingAtom = atom(false);
export const volumeAtom = atom(1);
export const autoScrollAtom = atom(true);
export const playthroughAtom = atom(false);

export const micStreamAtom = atom<MediaStream>();
export const micTimeAtom = atom<number[]>([]);
export const micFreqAtom = atom<number[]>([]);
export const devicesAtom = atom<MediaDeviceInfo[]>([]);
export const deviceAtom = atomWithStorage<string | null>("device", null);

export const sampleRateAtom = atom(44100);
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
export const recorderUpdatingAtom = countdownAtom(1000);
export const micSignalAtom = countdownAtom(500);

let playbackContext: AudioContext | undefined;
let playbackSource: AudioBufferSourceNode | undefined;
let playbackBuffer: AudioBuffer | undefined;
let playbackGain: GainNode | undefined;

let timeTimer: number;
let markTime = 0;
let markTimestamp = 0;
let markSample = 0;

export const waveformAtom = atom<Int16Array>(new Int16Array());
export const waveformUpdatedAtom = atom(0);

void fetch(test)
  .then((response) => response.arrayBuffer())
  .then((buffer) => {
    setAtom(waveformAtom, new Int16Array(buffer));
    updatePlaybackBuffer();
  });

let initted = false;

export const init = async () => {
  if (initted) return;

  initted = true;

  if (navigator.userAgent.toLowerCase().includes("firefox"))
    setAtom(sampleRateAtom, new AudioContext().sampleRate);

  subscribe(deviceAtom, updateContext);

  subscribe(timeAtom, updateTime);

  subscribe(volumeAtom, updateGain);
  subscribe(playthroughAtom, updateGain);

  await navigator.mediaDevices.getUserMedia({ audio: true });
  await refreshDevices();

  window.setInterval(updateAnalyzer, 30);
};

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
      sampleRate: getAtom(sampleRateAtom),
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
    micContext = new AudioContext({ sampleRate: getAtom(sampleRateAtom) });

    micAnalyzer = micContext.createAnalyser();
    micAnalyzer.fftSize = fftSize;

    await micContext.audioWorklet.addModule(worklet);
    micRecorder = new AudioWorkletNode(micContext, "wave-processor");
    micRecorder.port.onmessage = updateRecorder;

    micPlaythroughGain = micContext.createGain();
  }

  if (!playbackContext) {
    playbackContext = new AudioContext({ sampleRate: getAtom(sampleRateAtom) });
    updatePlaybackBuffer();
  }

  micSource?.disconnect();
  micSource = micContext.createMediaStreamSource(micStream);

  if (micAnalyzer) micSource.connect(micAnalyzer);
  if (micRecorder) micSource.connect(micRecorder);
  if (micPlaythroughGain) {
    micSource.connect(micPlaythroughGain);
    micPlaythroughGain.connect(micContext.destination);
  }

  updateGain();
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
  if (getAtom(micTimeAtom).some(Boolean)) micSignalAtom.reset();
};

const updateGain = () => {
  const gain = getAtom(volumeAtom) ** 2;
  if (playbackGain) playbackGain.gain.value = gain;
  if (micPlaythroughGain)
    micPlaythroughGain.gain.value = getAtom(playthroughAtom) ? gain : 0;
};

export const lengthAtom = atom(100);

const updateTime = async () => {
  const length = getAtom(lengthAtom);
  if (getAtom(timeAtom) > length) {
    setAtom(timeAtom, length);
    await stop();
  }
};

const updateRecorder = ({ data }: MessageEvent<Int16Array>) => {
  if (data.some(Boolean)) recorderUpdatingAtom.reset();

  let waveform = getAtom(waveformAtom);
  if (!waveform.length)
    waveform = new Int16Array(getAtom(sampleRateAtom) * getAtom(lengthAtom));

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
  playbackBuffer = playbackContext.createBuffer(
    1,
    waveform.length,
    getAtom(sampleRateAtom),
  );
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
  markSample = markTime * getAtom(sampleRateAtom);
};

export const play = async () => {
  timerMark();
  playPlayback(getAtom(timeAtom));
  await playVideo();
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

export const stop = async () => {
  stopPlayback();
  await pauseVideo();
  setAtom(playingAtom, false);
  window.clearInterval(timeTimer);
};

export const seek = async (time: number) => {
  timerMark(time);
  if (getAtom(playingAtom)) playPlayback(time);
  await seekVideo(time);
  setAtom(timeAtom, time);
};

export const armRecording = () => {
  setAtom(recordingAtom, true);
};

export const disarmRecording = () => {
  setAtom(recordingAtom, false);
  updatePlaybackBuffer();
};
