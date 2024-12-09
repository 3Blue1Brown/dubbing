import { atom } from "jotai";
import { throttle } from "lodash";
import type { YouTubePlayer } from "youtube-player/dist/types";
import { lengthAtom } from "@/pages/lesson/data";
import { getAtom, setAtom, subscribe } from "@/util/atoms";
import { record } from "./Waveform";

export const contextAtom = atom<AudioContext>();
export const micStreamAtom = atom<MediaStream>();
export const monitorAtom = atom<number[]>([]);
export const devicesAtom = atom<MediaDeviceInfo[]>([]);
export const deviceAtom = atom<string>();
export const playerAtom = atom<YouTubePlayer>();
export const timeAtom = atom(0);
export const playingAtom = atom(false);
export const recordingAtom = atom(false);
export const balanceAtom = atom(1);
export const showOriginalAtom = atom(false);
export const autoscrollAtom = atom(true);

const sampleRate = 44100;
const bitRate = 16;
const fftSize = 2 ** 10;

let micStream: MediaStreamAudioSourceNode;
let micAnalyzer: AnalyserNode;
let micBuffer: Uint8Array;

const updateMic = () => {
  micAnalyzer?.getByteTimeDomainData(micBuffer);
  setAtom(
    monitorAtom,
    Array.from(micBuffer ?? []).map((value) => 1 - value / 128),
  );
};
window.setInterval(updateMic, 50);

const updateContext = async () => {
  getAtom(contextAtom)?.close();
  micStream?.disconnect();
  micAnalyzer?.disconnect();

  const context = new AudioContext();
  setAtom(contextAtom, context);

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
  setAtom(micStreamAtom, stream);

  micStream = context.createMediaStreamSource(stream);
  micAnalyzer = context.createAnalyser();
  micAnalyzer.fftSize = fftSize;
  micBuffer = new Uint8Array(micAnalyzer.frequencyBinCount);
  micStream.connect(micAnalyzer);
};

subscribe(deviceAtom, updateContext);

export const refreshDevices = async () => {
  const devices = (await navigator.mediaDevices.enumerateDevices()).filter(
    ({ kind, label }) => kind === "audioinput" && label,
  );
  setAtom(devicesAtom, devices);
  if (!getAtom(deviceAtom)) setAtom(deviceAtom, devices[0]?.deviceId);
};

refreshDevices();

let timer: number;
let startedTime = 0;
let startedTimestamp = 0;

const playVideo = throttle(
  async () => await getAtom(playerAtom)?.playVideo(),
  250,
);

const stopVideo = throttle(
  async () => await getAtom(playerAtom)?.pauseVideo(),
  250,
);

const seekVideo = throttle(async (time: number) => {
  const player = getAtom(playerAtom);
  if (!player) return;
  await player.seekTo(time, true);
  if (getAtom(playingAtom)) await player.playVideo();
  else await player.stopVideo();
}, 250);

export const volumeVideo = (balance?: number) =>
  getAtom(playerAtom)?.setVolume(
    (1 - (balance ?? getAtom(balanceAtom))) ** 2 * 100,
  );

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
  seekVideo(time);
  updateTimer(time);
  setAtom(timeAtom, time);
};

export const startRecording = () => {
  record.startRecording();
  setAtom(recordingAtom, true);
};

export const stopRecording = () => {
  record.stopRecording();
  setAtom(recordingAtom, false);
};

subscribe(timeAtom, (value) => {
  const length = getAtom(lengthAtom);
  if (value > length) {
    stop();
    setAtom(timeAtom, length);
  }
});

subscribe(balanceAtom, volumeVideo);
