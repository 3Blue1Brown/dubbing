import { useContext } from "react";
import PlayerComponent from "@/components/Player";
import { LessonContext } from "@/pages/lesson";

const Player = () => {
  const { playerRef, video } = useContext(LessonContext);

  if (!video) return <div />;

  return <PlayerComponent ref={playerRef} video={video} />;
};

export default Player;
