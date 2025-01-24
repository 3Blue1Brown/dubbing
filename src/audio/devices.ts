import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "@reactuses/core";

export const useMicrophone = ({ sampleRate = 44100, bitDepth = 16 }) => {
  /** selected device id */
  const [device, setDevice] = useLocalStorage<
    MediaDeviceInfo["deviceId"] | null
  >("device", null);
  /** list of available devices */
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  /** microphone audio stream */
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  /** request microphone permission */
  const request = useCallback(
    () => navigator.mediaDevices.getUserMedia({ audio: true }),
    [],
  );

  /** refresh devices */
  const refresh = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    /** get only audio input devices */
    const mics = devices.filter(({ kind }) => kind === "audioinput");
    setDevices(mics);
    /** auto-select first device if none selected already */
    setDevice((device) => device ?? mics[0]?.deviceId ?? "");
  }, [setDevice]);

  /** init */
  useEffect(() => {
    let latest = true;
    /**
     * some browsers (which ?) error on enumerateDevices if mic permissions not
     * requested first
     */
    request()
      .then(() => {
        if (latest) refresh().catch(console.error);
      })
      .catch(console.error);

    return () => {
      latest = false;
    };
  }, [request, refresh]);

  /** update mic stream */
  useEffect(() => {
    let latest = true;
    if (device !== null)
      navigator.mediaDevices
        .getUserMedia({
          video: false,
          audio: {
            deviceId: device,
            sampleRate,
            sampleSize: bitDepth,
            channelCount: 1,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
        .then((stream) => {
          if (latest) setMicStream(stream);
        })
        .catch(console.error);
    return () => {
      latest = false;
    };
  }, [device, sampleRate, bitDepth]);

  return { devices, device, setDevice, micStream, refresh };
};
