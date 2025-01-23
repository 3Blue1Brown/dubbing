import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentRef,
} from "react";
import YouTube, { type YouTubePlayer } from "react-youtube";
import PlayerStates from "youtube-player/dist/constants/PlayerStates";
import classes from "./Player.module.css";

type Props = {
  /** video id */
  video: string;
};

type Handle = {
  play: () => Promise<void>;
  pause: () => Promise<void>;
  seek: (time: number) => Promise<void>;
  volume: (volume: number) => Promise<void>;
};

export type PlayerRef = ComponentRef<typeof Player>;

/** video player */
const Player = forwardRef<Handle, Props>(({ video }: Props, ref) => {
  const player = useRef<YouTubePlayer>();

  /** expose methods */
  useImperativeHandle(
    ref,
    () => ({
      /** control methods */
      play: async () => await player.current?.playVideo(),
      pause: async () => await player.current?.pauseVideo(),
      seek: async (time: number) => {
        if (!player.current) return;
        await player.current.seekTo(time, true);
        if ((await player.current?.getPlayerState()) === PlayerStates.PLAYING)
          await player.current?.playVideo();
        else await player.current?.pauseVideo();
      },
      volume: async (volume: number) => player.current?.setVolume(volume),
    }),
    [],
  );

  return (
    <YouTube
      videoId={video}
      onReady={async (event) => {
        player.current = event.target;
        await player.current?.mute();
      }}
      className={classes.player}
      iframeClassName={classes.iframe}
    />
  );
});

export default Player;
