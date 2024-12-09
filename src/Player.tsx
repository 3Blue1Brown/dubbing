import YouTube from "react-youtube";
import type { YouTubePlayer } from "youtube-player/dist/types";
import classes from "./Player.module.css";

export let player: YouTubePlayer | null = null;

type Props = {
  video: string;
};

const Player = ({ video }: Props) => {
  return (
    <YouTube
      videoId={video}
      onReady={(event) => (player = event.target)}
      className={classes.player}
      iframeClassName={classes.iframe}
    />
  );
};

export default Player;
