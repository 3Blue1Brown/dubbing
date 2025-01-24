import { useContext, useRef } from "react";
import {
  RAnalyser,
  RAudioContext,
  RGain,
  RMediaStreamSource,
  RPipeline,
} from "r-audio";
import { useInterval } from "@reactuses/core";
import { LessonContext } from "@/pages/lesson";

const fftSize = 2 ** 10;

/** audio graph */
const Graph = () => {
  const analyzer = useRef<AnalyserNode>();
  const micTimeBuffer = useRef(new Uint8Array(fftSize));
  const micFreqBuffer = useRef(new Uint8Array(fftSize / 2));

  /** use lesson state */
  const { volume, micStream, setMicTimeAnal, setMicFreqAnal, playthrough } =
    useContext(LessonContext);

  /** update analyzer data */
  useInterval(() => {
    analyzer.current?.getByteTimeDomainData(micTimeBuffer.current);
    analyzer.current?.getByteFrequencyData(micFreqBuffer.current);
    setMicTimeAnal(Array.from(micTimeBuffer.current).map((v) => 1 - v / 128));
    setMicFreqAnal(Array.from(micFreqBuffer.current).map((v) => v / 128));
  }, 1000 / 30);

  if (!micStream) return <></>;

  return (
    <RAudioContext>
      <RPipeline>
        <RMediaStreamSource stream={micStream} />
        <RAnalyser fftSize={2048}>
          {(proxy: AnalyserNode) => (analyzer.current = proxy)}
        </RAnalyser>
        <RGain gain={playthrough ? volume : 0} />
      </RPipeline>
    </RAudioContext>
  );
};

export default Graph;
