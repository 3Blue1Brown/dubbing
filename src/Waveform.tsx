import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import classes from "./Waveform.module.css";

const Waveform = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer>();
  const recorder = useRef<RecordPlugin>();
  const regions = useRef<RegionsPlugin>();
  const [, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    RecordPlugin.getAvailableAudioDevices().then(setDevices);
  }, []);

  useEffect(() => {
    (async () => {
      if (!containerRef.current) return;
      regions.current = RegionsPlugin.create();

      recorder.current = RecordPlugin.create({
        continuousWaveform: true,
        continuousWaveformDuration: 5,
        mediaRecorderTimeslice: 1,
      });

      wavesurfer.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: "gray",
        progressColor: "skyblue",
        plugins: [recorder.current, regions.current],
      });

      // wavesurfer.current.zoom(1);

      let previousPeak = 0;

      wavesurfer.current.on("decode", () => {
        if (!wavesurfer.current || !regions.current) return;
        const decoded = wavesurfer.current.getDecodedData();
        if (!decoded) return;
        const { sampleRate, getChannelData } = decoded;
        const peak = getChannelData(0).findIndex(
          (value, index) => index > previousPeak + sampleRate && value > 0.1
        );
        if (peak !== -1) {
          regions.current.addRegion({
            start: peak / sampleRate - sampleRate / 1000,
            end: peak / sampleRate + sampleRate / 1000,
            color: "#ff000020",
            drag: false,
            resize: false,
          });
          previousPeak = peak;
        }
      });
    })();

    return () => {
      wavesurfer.current?.destroy();
    };
  }, []);

  return (
    <>
      <button
        onClick={() =>
          recorder.current?.startRecording({ deviceId: "default" })
        }
      >
        Record
      </button>
      <button onClick={() => recorder.current?.stopRecording()}>Stop</button>

      <div ref={containerRef} className={classes.container}></div>
    </>
  );
};

export default Waveform;
