import { expose } from "comlink";
import { createMp3Encoder } from "wasm-media-encoders";
import type { WasmMediaEncoder } from "wasm-media-encoders";
import { bitPeak } from "@/audio";

export type MP3Params = Parameters<
  WasmMediaEncoder<"audio/mpeg">["configure"]
>[0];

/** encode raw audio buffer to mp3 */
export const encodeMp3 = async (data: Int16Array, params: MP3Params) => {
  const encoder = await createMp3Encoder();
  encoder.configure(params);
  const buffer = new Float32Array(data.length);
  for (let i = 0; i < data.length; i++)
    buffer[i] = data[i]! / (data[i]! < 0 ? bitPeak : bitPeak - 1);
  const frames = encoder.encode([buffer]);
  const lastFrames = encoder.finalize();
  return new Blob([frames, lastFrames], { type: "audio/mpeg" });
};

expose({ encodeMp3 });
