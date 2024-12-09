import { atom } from "jotai";
import { lengthAtom } from "@/pages/lesson/data";
import { getAtom, setAtom, subscribe } from "@/util/atoms";
import { player } from "./Player";
import { record } from "./Waveform";

let timer: number;
let startedTime = 0;
let startedTimestamp = 0;

export const play = (setPlayer = true) => {
  if (player && setPlayer) player.playVideo();
  setAtom(playingAtom, true);
  startedTime = getAtom(timeAtom);
  startedTimestamp = window.performance.now();
  timer = window.setInterval(() =>
    setAtom(
      timeAtom,
      startedTime + (window.performance.now() - startedTimestamp) / 1000,
    ),
  );
};

export const stop = (setPlayer = true) => {
  if (player && setPlayer) player.pauseVideo();
  setAtom(playingAtom, false);
  window.clearInterval(timer);
};

export const seek = async (time: number = 0, setPlayer = true) => {
  if (player && setPlayer) {
    player?.seekTo(time, true);
    if (getAtom(playingAtom)) player.playVideo();
    else player.pauseVideo();
  }
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

subscribe(timeAtom, (value) => {
  const length = getAtom(lengthAtom);
  if (value > length) {
    stop();
    setAtom(timeAtom, length);
  }
});
