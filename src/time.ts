import { atom } from "jotai";
import { getAtom, setAtom } from "./atoms";
import { player } from "./Player";
import { record } from "./Waveform";

let timer: number;
let startedTime = 0;
let startedTimestamp = 0;

export const play = (setPlayer = true) => {
  if (setPlayer) player?.playVideo();
  setAtom(playingAtom, true);
  startedTime = getAtom(timeAtom);
  startedTimestamp = window.performance.now();
  timer = window.setInterval(() =>
    setAtom(
      timeAtom,
      startedTime + (window.performance.now() - startedTimestamp) / 1000
    )
  );
};

export const stop = (setPlayer = true) => {
  if (setPlayer) player?.pauseVideo();
  setAtom(playingAtom, false);
  window.clearInterval(timer);
};

export const seek = async (time: number = 0, setPlayer = true) => {
  if (setPlayer) player?.seekTo(time, true);
  startedTime = time;
  startedTimestamp = window.performance.now();
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

export const timeAtom = atom(0);

export const playingAtom = atom(false);

export const recordingAtom = atom(false);
