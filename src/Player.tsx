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

  useInterval(
    async () => setAtom(timeAtom, (await player?.getCurrentTime()) || 0),
    playing ? 100 : null
  );

  return (
    <YouTube
      videoId={video}
      onReady={(event) =>
        /** update internal player object */
        (player = event.target)
      }
      onStateChange={async (event) => {
        /** when user seeks and releases */
        if (event.data === 1) setAtom(playingAtom, true);
        /** when user pauses/stops */
        if (event.data === 0 || event.data === 2) setAtom(playingAtom, false);
      }}
      className={classes.player}
      iframeClassName={classes.iframe}
    />
  );
};

export default Player;

/** internal player object */
let player: YouTubePlayer | null = null;

/** play video for certain time segment */
export const play = (start?: number) => {
  /** play from start */
  player?.seekTo(start || 0, true);
  player?.playVideo();
};

/** pause/stop video */
export const stopVideo = () => {
  player?.pauseVideo();
};

/** current play time in seconds */
export const timeAtom = atom(0);

/** playing state */
export const playingAtom = atom(false);
