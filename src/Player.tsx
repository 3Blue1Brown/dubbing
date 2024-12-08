import YouTube from "react-youtube";
import { atom, useAtomValue } from "jotai";
import type { YouTubePlayer } from "youtube-player/dist/types";
import { setAtom } from "./atoms";
import classes from "./Player.module.css";
import { useInterval } from "@reactuses/core";

type Props = {
  /** youtube video id */
  video: string;
};

/** youtube video player */
const Player = ({ video }: Props) => {
  const playing = useAtomValue(playingAtom);

  useInterval(updateTime, playing ? 100 : null);

  return (
    <YouTube
      videoId={video}
      onReady={(event) =>
        /** update internal player object */
        (player = event.target)
      }
      onStateChange={async (event) => {
        /** when user plays/seeks */
        if (event.data === 1) {
          setAtom(playingAtom, true);
          updateTime();
        }
        /** when user pauses/stops */
        if (event.data === 0 || event.data === 2) setAtom(playingAtom, false);
      }}
      className={classes.player}
      iframeClassName={classes.iframe}
    />
  );
};

export default Player;

/** update time */
const updateTime = async (time?: number) =>
  setAtom(timeAtom, time ?? ((await player?.getCurrentTime()) || 0));

/** internal player object */
let player: YouTubePlayer | null = null;

/** play video at certain time */
export const play = (time: number = 0) => {
  player?.seekTo(time, true);
  player?.playVideo();
};

/** seek video certain time */
export const seek = async (time: number = 0) => {
  player?.seekTo(time, true);
  updateTime(time);
};

/** pause/stop video */
export const stop = () => {
  player?.pauseVideo();
};

/** current play time in seconds */
export const timeAtom = atom(0);

/** playing state */
export const playingAtom = atom(false);
