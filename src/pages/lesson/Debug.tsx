import { Fragment } from "react";
import { useLesson } from "@/pages/lesson/state";
import { userAgent } from "@/util/browser";
import classes from "./Debug.module.css";

type Props = {
  data?: Record<string, unknown>;
};

const Debug = ({ data = {} }: Props) => {
  const sampleRate = useLesson("sampleRate");
  const micStream = useLesson("micStream");
  const device = useLesson("device");
  const devices = useLesson("devices");

  data = {
    userAgent,
    ...data,
    sampleRate,
    micStream: !!micStream,
    device,
    // streamDeviceId: micStream?.getAudioTracks()[0]?.getCapabilities().deviceId,
    devices,
  };

  return (
    <details>
      <summary>DEBUG</summary>
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
    </details>
  );
};

export default Debug;
