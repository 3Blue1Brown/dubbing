import YouTube, { type YouTubePlayer } from "react-youtube";
import { atom } from "jotai";
import { playingAtom } from "@/pages/lesson/audio";
import { getAtom, setAtom } from "@/util/atoms";
import classes from "./Player.module.css";

export const playerAtom = atom<YouTubePlayer>();

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
        await player.mute();
      }}
      className={classes.player}
      iframeClassName={classes.iframe}
    />
  );
};

export default Player;

export const playVideo = async () => await getAtom(playerAtom)?.playVideo();

export const pauseVideo = async () => await getAtom(playerAtom)?.pauseVideo();

export const seekVideo = async (time: number) => {
  const player = getAtom(playerAtom);
  if (!player) return;
  await player.seekTo(time, true);
  if (getAtom(playingAtom)) await player.playVideo();
  else await player.pauseVideo();
};

export const volumeVideo = (volume: number) =>
  getAtom(playerAtom)?.setVolume(volume);
