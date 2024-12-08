import { useAtomValue } from "jotai";
import { sentencesAtom, videoAtom } from "./data";
import Player from "./Player";
import Sentences from "./Sentences";
import Waveform from "./Waveform";

const App = () => {
  const video = useAtomValue(videoAtom);
  const sentences = useAtomValue(sentencesAtom);

  if (!video || !sentences) return <></>;

  return (
    <>
      <Player video={video} />
      <Waveform />
      <Sentences />
    </>
  );
};

export default App;
