import { useAtomValue } from "jotai";
import { sentencesAtom, videoAtom } from "./data";
import Player from "./Player";
import Sentences from "./Sentences";
import Waveform from "./Waveform";
import Controls from "./Controls";

const App = () => {
  const video = useAtomValue(videoAtom);
  const sentences = useAtomValue(sentencesAtom);

  if (!video || !sentences) return <></>;

  return (
    <>
      <Player video={video} />
      <Sentences />
      <Controls />
      <Waveform />
    </>
  );
};

export default App;
