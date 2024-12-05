import { atom, useAtom } from "jotai";
import { setAtom } from "./atoms";
import { useCallback, useRef, useState } from "react";

export const audioContext = atom<AudioContext>();
export const microphoneStream = atom<MediaStream>();
export const mediaRecorder = atom<MediaRecorder>();

const sampleRate = 44100;
const bitRate = 16;
const encoding = "audio/ogg; codecs=opus";

const setup = async () => {
  try {
    setAtom(audioContext, new AudioContext());
    const stream = await navigator.mediaDevices.getUserMedia({
      video: false,
      audio: {
        sampleRate,
        sampleSize: bitRate,
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    setAtom(microphoneStream, stream);
    setAtom(mediaRecorder, new MediaRecorder(stream));
  } catch (error) {
    console.error(error);
  }
};

setup();

export const useRecording = () => {
  const blobChunks = useRef<Blob[]>([]);
  const bufferChunks = useRef<ArrayBuffer[]>([]);
  const audioChunks = useRef<AudioBuffer[]>([]);
  const [waveform, setWaveform] = useState<number[]>([]);
  const [recording, setRecording] = useState(false);
  const [src, setSrc] = useState("");

  const [getRecorder] = useAtom(mediaRecorder);
  const [getContext] = useAtom(audioContext);

  const record = useCallback(
    async (event: BlobEvent) => {
      if (!getContext) throw Error("No context");

      const blobChunk = event.data;
      const bufferChunk = await blobChunk.arrayBuffer();
      const firstBufferChunk = bufferChunks.current[0]?.slice(0);
      const audioChunk = await getContext.decodeAudioData(
        await new Blob([
          ...(firstBufferChunk ? [firstBufferChunk] : []),
          bufferChunk.slice(0),
        ]).arrayBuffer()
      );
      const waveformChunk = Array.from(
        audioChunk.getChannelData(0).slice(audioChunks.current[0]?.length || 0)
      );
      blobChunks.current.push(blobChunk);
      bufferChunks.current.push(bufferChunk);
      audioChunks.current.push(audioChunk);
      setWaveform((waveform) => waveform.concat(waveformChunk));
    },
    [getContext]
  );

  const start = useCallback(() => {
    if (!getRecorder) throw Error("No recorder");
    // blobChunks.current = [];
    setRecording(true);
    getRecorder.addEventListener("dataavailable", record);
    getRecorder.start(100);
  }, [getRecorder, record]);

  const stop = useCallback(() => {
    if (!getRecorder) throw Error("No recorder");
    setRecording(false);
    getRecorder.stop();
    getRecorder.removeEventListener("dataavailable", record);
    const blob = new Blob(blobChunks.current, { type: encoding });
    window.URL.revokeObjectURL(src);
    setSrc(window.URL.createObjectURL(blob));
  }, [blobChunks, getRecorder, record, src]);

  return { start, recording, stop, waveform, src };
};
