import YouTube from "react-youtube";
import { playerAtom, volumeVideo } from "@/pages/lesson/state";
import { setAtom } from "@/util/atoms";
import { lengthAtom } from "./data";
import classes from "./Player.module.css";

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
