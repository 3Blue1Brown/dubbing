import { useAtom } from "jotai";
import Waveform from "./Waveform";
import { microphoneStream, useRecording } from "./audio";

function App() {
  const [getMicrophoneStream] = useAtom(microphoneStream);
  const [getMediaRecorder] = useAtom(microphoneStream);

  const { start, recording, stop, waveform, src } = useRecording();

  if (!getMicrophoneStream || !getMediaRecorder)
    return (
      <>
        Reset this page's permissions, refresh, and allow usage of microphone.
      </>
    );

  return (
    <>
      <button onClick={recording ? stop : start}>
        {recording ? "stop" : "start"}
      </button>

      <Waveform waveform={waveform} />

      <audio src={src} controls />
    </>
  );
}

export default App;
