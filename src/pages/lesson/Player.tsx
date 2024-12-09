import YouTube from "react-youtube";
import type { YouTubePlayer } from "youtube-player/dist/types";
import { lengthAtom } from "@/pages/lesson/data";
import { setAtom } from "@/util/atoms";
import classes from "./Player.module.css";

export let player: YouTubePlayer | null = null;

type Props = {
  video: string;
};

const Player = ({ video }: Props) => {
  return (
    <YouTube
      videoId={video}
      onReady={async (event) => {
        player = event.target;
        const length = await player.getDuration();
        if (length) setAtom(lengthAtom, length);
      }}
      className={classes.player}
      iframeClassName={classes.iframe}
    />
  );
};

export default Player;
