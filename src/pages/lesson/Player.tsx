import { useEffect } from "react";
import PlayerComponent from "@/components/Player";
import { useLesson } from "@/pages/lesson/state";

/** player section */
const Player = () => {
  /** use lesson state */
  const playerRef = useLesson("playerRef");
  const video = useLesson("video");
  const time = useLesson("time");
  const playing = useLesson("playing");
  const volume = useLesson("volume");

  /** update time */
  useEffect(() => {
    playerRef.current?.seek(time).catch(console.error);
  }, [playerRef, time]);

  /** update playing state */
  useEffect(() => {
    if (playing) playerRef.current?.play().catch(console.error);
    else playerRef.current?.pause().catch(console.error);
  }, [playerRef, playing]);

  /** update volume */
  useEffect(() => {
    playerRef.current?.volume(volume).catch(console.error);
  }, [playerRef, volume]);

  if (!video) return <div />;

  return <PlayerComponent ref={playerRef} video={video} />;
};

export default Player;
