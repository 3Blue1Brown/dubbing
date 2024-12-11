import YouTube, { type YouTubePlayer } from "react-youtube";
import { atom } from "jotai";
import { throttle } from "lodash";
import { playingAtom } from "@/pages/lesson/audio";
import { getAtom, setAtom, subscribe } from "@/util/atoms";
import { lengthAtom } from "./data";
import classes from "./Player.module.css";

export const playerAtom = atom<YouTubePlayer>();
export const balanceAtom = atom(1);

type Props = {
  video: string;
};

const Player = ({ video }: Props) => {
  return (
    <YouTube
      videoId={video}
      onReady={async (event) => {
        const player = event.target;
        setAtom(playerAtom, player);
        volumeVideo();
        const length = await player.getDuration();
        if (length) setAtom(lengthAtom, length);
      }}
      className={classes.player}
      iframeClassName={classes.iframe}
    />
  );
};

export default Player;

export const playVideo = throttle(
  async () => await getAtom(playerAtom)?.playVideo(),
  250,
);

export const stopVideo = throttle(
  async () => await getAtom(playerAtom)?.pauseVideo(),
  250,
);

export const seekVideo = throttle(async (time: number) => {
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

subscribe(balanceAtom, volumeVideo);
