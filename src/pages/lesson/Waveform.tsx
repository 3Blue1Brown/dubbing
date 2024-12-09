import { useEffect, useRef, useState } from "react";
import audioBufferToWav from "audiobuffer-to-wav";
import { useAtomValue } from "jotai";
import WaveSurfer from "wavesurfer.js";
import HoverPlugin from "wavesurfer.js/dist/plugins/hover.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";
import RegionsPlugin from "wavesurfer.js/dist/plugins/regions.esm.js";
import ZoomPlugin from "wavesurfer.js/dist/plugins/zoom.js";
import { formatTime } from "@/util/string";
import { lengthAtom } from "./data";
import classes from "./Waveform.module.css";

const regions = RegionsPlugin.create();

const hover = HoverPlugin.create({
  lineWidth: 1,
  labelSize: "16px",
  formatTimeCallback: formatTime,
});

const zoom = ZoomPlugin.create({
  exponentialZooming: true,
  maxZoom: 44100,
});

export const record = RecordPlugin.create({
  continuousWaveform: true,
  continuousWaveformDuration: 5,
  mediaRecorderTimeslice: 1,
});

const Waveform = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer>();
  const [, setDevices] = useState<MediaDeviceInfo[]>([]);

  const length = useAtomValue(lengthAtom);

  useEffect(() => {
    RecordPlugin.getAvailableAudioDevices().then(setDevices);
  }, []);

  useEffect(() => {
    (async () => {
      if (!containerRef.current) return;

      const url = window.URL.createObjectURL(
        new Blob([
          audioBufferToWav(
            new AudioBuffer({
              length: 44100 * (length || 1),
              sampleRate: 44100,
            }),
          ),
        ]),
      );

      wavesurfer.current = WaveSurfer.create({
        container: containerRef.current,
        minPxPerSec: 1,
        waveColor: "gray",
        progressColor: "var(--primary)",
        cursorColor: "var(--primary)",
        autoScroll: true,
        autoCenter: true,
        url,
        plugins: [zoom, hover, record, regions],
      });

      // let start = 0;
      // let previousIndex = 0;

      // wavesurfer.current.on("decode", () => {
      //   if (!wavesurfer.current || !regions.current) return;
      //   const decoded = wavesurfer.current.getDecodedData();
      //   if (!decoded) return;
      //   const { sampleRate, getChannelData } = decoded;
      //   const channelData = [...getChannelData(0)];
      //   for (let index = 0; index < channelData.length; index++) {
      //     if (channelData[index]! > 0.1 && !start) start = index;
      //     if (channelData[index]! <= 0.1 && start) {
      //       regions.current.addRegion({
      //         start: start / sampleRate,
      //         end: index / sampleRate,
      //         color: "#ff000020",
      //         drag: false,
      //         resize: false,
      //       });
      //       start = 0;
      //     }
      //   }
      //   previousIndex = channelData.length;
      // });
    })();

    return () => {
      wavesurfer.current?.destroy();
    };
  }, [length]);

  return (
    <>
      <div ref={containerRef} className={classes.container} />
    </>
  );
};

export default Waveform;
