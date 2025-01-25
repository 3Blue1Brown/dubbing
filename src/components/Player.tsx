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
  const playerRef = useRef<YouTubePlayer>();

  /** expose methods */
  useImperativeHandle(
    ref,
    () => ({
      /** control methods */
      play: async () => await playerRef.current?.playVideo(),
      pause: async () => await playerRef.current?.pauseVideo(),
      seek: async (time: number) => {
        if (!playerRef.current) return;
        await playerRef.current.seekTo(time, true);
        if (
          (await playerRef.current?.getPlayerState()) === PlayerStates.PLAYING
        )
          await playerRef.current?.playVideo();
        else await playerRef.current?.pauseVideo();
      },
      volume: async (volume: number) => playerRef.current?.setVolume(volume),
    }),
    [],
  );

  return (
    <YouTube
      videoId={video}
      onReady={async (event) => {
        playerRef.current = event.target;
        await playerRef.current?.mute();
      }}
      className={classes.container}
      iframeClassName={classes.iframe}
    />
  );
});

export default Player;
