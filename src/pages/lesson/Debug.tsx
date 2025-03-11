import { Fragment, useEffect, useRef, useState } from "react";
import { random } from "lodash";
import { useEventListener } from "@reactuses/core";
import { concatFloats } from "@/audio";
import Button from "@/components/Button";
import { useLesson } from "@/pages/lesson/state";
import test from "@/test.wav?url";
import { userAgent } from "@/util/browser";
import { sleep } from "@/util/misc";
import { request } from "@/util/request";
import classes from "./Debug.module.css";

type Data = Record<string, unknown>;

type Props = {
  data?: Data;
};

export const debug = (data: Data) =>
  window.dispatchEvent(new CustomEvent("debug", { detail: data }));

let before = 0;
export const timeStart = () => (before = window.performance.now());
export const timeEnd = (key: string) => {
  const diff = window.performance.now() - before;
  if (diff) debug({ [key]: diff });
};

const Debug = ({ data = {} }: Props) => {
  const sampleRate = useLesson("sampleRate");
  const micStream = useLesson("micStream");
  const device = useLesson("device");
  const devices = useLesson("devices");
  const setTracks = useLesson("setTracks");

  const [event, setEvent] = useState<Data>({});

  useEventListener("debug", ({ detail }) =>
    sleep().then(() => setEvent((event) => ({ ...event, ...detail }))),
  );

  data = {
    ...event,
    userAgent,
    ...data,
    sampleRate,
    micStream: !!micStream,
    device,
    // streamDeviceId: micStream?.getAudioTracks()[0]?.getCapabilities().deviceId,
    devices,
  };

  const testTrack = useRef<Float32Array>(null);

  useEffect(() => {
    /** only load test track once */
    if (testTrack.current) return;

    /** if not on "final" sample rate, don't load */
    if (!micStream) return;

    /** load test waveforms */
    (async () => {
      const decoder = new AudioContext({ sampleRate });
      testTrack.current = (
        await decoder.decodeAudioData(await request(test, "arrayBuffer"))
      ).getChannelData(0);
    })().catch(console.error);
  }, [micStream, sampleRate, setTracks]);

  return (
    <details>
      <summary>DEBUG</summary>

      <div className={classes.content}>
        <Button
          accent
          onClick={() => {
            setTracks((tracks) => [
              ...tracks,
              ...(testTrack.current
                ? [
                    {
                      name: `Track ${tracks.length + 1}`,
                      muted: false,
                      audio: concatFloats(
                        /** insert random amount of silence at beginning */
                        new Float32Array(random(0, 20 * sampleRate)).fill(0),
                        testTrack.current!,
                      ),
                    },
                  ]
                : []),
            ]);
          }}
        >
          Add Test Track
        </Button>
        <div className={classes.debug}>
          {Object.entries(data).map(([key, value]) => (
            <Fragment key={key}>
              <div>{key}</div>
              <div>
                {typeof value === "object"
                  ? JSON.stringify(value, null, 2)
                  : String(value)}
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </details>
  );
};

export default Debug;
