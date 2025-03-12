import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "@reactuses/core";
import { isFirefox, isSafari } from "@/util/browser";

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
       * in some browsers, enumerateDevices returns only device user approved
       * permissions for. try to request mic permission beforehand to get all
       * available devices.
       * https://stackoverflow.com/questions/51387564/navigator-mediadevices-enumeratedevices-only-returns-default-devices-on-safari?rq=3
       */
      if (isSafari || isFirefox)
        await navigator.mediaDevices.getUserMedia({ audio: true });
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
        /** get mic stream */
        const stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: {
            deviceId: device,
            sampleRate,
            sampleSize: bitDepth,
            channelCount: 1,
          },
        });

        if (!latest) return;

        /** https://stackoverflow.com/questions/67378379/how-to-get-the-sample-rate-from-a-mediadevices-getusermedia-stream */
        if (isFirefox) {
          const testContext = new AudioContext();
          testContext.createMediaStreamSource(stream);
          const actualSampleRate = testContext.sampleRate;
          if (actualSampleRate !== sampleRate) {
            setSampleRate(new AudioContext().sampleRate);
            return;
          }
        }

        /** odd occasional safari behavior where device id changes */
        if (isSafari) {
          const actualDeviceId = stream
            .getAudioTracks()[0]
            ?.getCapabilities().deviceId;
          if (device !== actualDeviceId) {
            setDevice(actualDeviceId ?? noDevice);
            return;
          }
        }

        setMicStream(stream);
      })().catch(console.error);

    return () => {
      latest = false;
    };
  }, [device, setDevice, sampleRate, setSampleRate, bitDepth]);

  return { devices, device, setDevice, micStream, refresh };
};
