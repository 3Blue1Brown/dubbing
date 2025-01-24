import { useContext, useEffect } from "react";
import PlayerComponent from "@/components/Player";
import { LessonContext } from "@/pages/lesson";

/** player section */
const Player = () => {
  /** use lesson state */
  const { playerRef, video, time, playing, volume } = useContext(LessonContext);

  /** update time */
  useEffect(() => {
    (async () => {
      await playerRef.current?.seek(time);
    })().catch(console.error);
  }, [playerRef, time]);

  /** update playing state */
  useEffect(() => {
    (async () => {
      if (playing) await playerRef.current?.play();
      else await playerRef.current?.pause();
    })().catch(console.error);
  }, [playerRef, playing]);

  /** update volume */
  useEffect(() => {
    (async () => {
      await playerRef.current?.volume(volume);
    })().catch(console.error);
  }, [playerRef, volume]);

  if (!video) return <div />;

  return <PlayerComponent ref={playerRef} video={video} />;
};

export default Player;
