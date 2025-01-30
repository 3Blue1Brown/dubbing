import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "@reactuses/core";

/** for debugging */
window.localStorage.clear();

/**
 * special string to indicate no device. can't be empty string because some
 * browsers use that to mean "default device". can't use null or similar because
 * we need to sync with localStorage (string-based).
 */
const noDevice = "NO_DEVICE";

type UseMicrophone = {
  sampleRate: number;
  setSampleRate: (value: number) => void;
  bitDepth: number;
};

export const useMicrophone = ({
  sampleRate,
  setSampleRate,
  bitDepth,
}: UseMicrophone) => {
  /** selected device id */
  let [device, setDevice] = useLocalStorage<string>("device", noDevice);
  /** fallback if no storage set yet */
  device ??= noDevice;
  /** list of available devices */
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  /** microphone audio stream */
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  /** refresh devices */
  const refresh = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    /** get only audio input devices */
    const mics = devices.filter(({ kind }) => kind === "audioinput");
    setDevices(mics);
  }, []);

  useEffect(() => {
    /** auto-select first device if none selected already */
    if (device === noDevice && devices[0]) setDevice(devices[0].deviceId);
  }, [device, setDevice, devices]);

  /** init */
  useEffect(() => {
    let latest = true;
    (async () => {
      /**
       * for firefox: call getUserMedia before enumerateDevices so it will
       * return all available devices and not just device user approved
       * permissions for
       */
      // await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!latest) return;
      await refresh();
    })().catch(console.error);

    return () => {
      latest = false;
    };
  }, [refresh]);

  /** update mic stream */
  useEffect(() => {
    let latest = true;

    if (device !== noDevice)
      (async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
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
        });

        if (!latest) return;

        /**
         * firefox bug:
         * https://stackoverflow.com/questions/67378379/how-to-get-the-sample-rate-from-a-mediadevices-getusermedia-stream
         */
        const testContext = new AudioContext();
        testContext.createMediaStreamSource(stream);
        const actualSampleRate = testContext.sampleRate;
        if (actualSampleRate === sampleRate) setMicStream(stream);
        else setSampleRate(new AudioContext().sampleRate);
      })().catch(console.error);

    return () => {
      latest = false;
    };
  }, [device, sampleRate, setSampleRate, bitDepth]);

  return { devices, device, setDevice, micStream, refresh };
};
