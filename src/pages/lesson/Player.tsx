import PlayerComponent from "@/components/Player";
import { useLesson } from "@/pages/lesson/state";

/** player section */
const Player = () => {
  /** use lesson state */
  const playerRef = useLesson("playerRef");
  const video = useLesson("video");
  const length = useLesson("length");
  const setLength = useLesson("setLength");

  if (!video) return <div className="placeholder">No video loaded</div>;

  return (
    <PlayerComponent
      ref={playerRef}
      video={video}
      onLength={(newLength) =>
        /** increase timeline length to video length */
        newLength > length && setLength(newLength)
      }
    />
  );
};

export default Player;
