import { expose } from "comlink";
import { createMp3Encoder } from "wasm-media-encoders";
import type { WasmMediaEncoder } from "wasm-media-encoders";

export type MP3Params = Parameters<
  WasmMediaEncoder<"audio/mpeg">["configure"]
>[0];

/** encode raw audio buffer to mp3 */
export const encodeMp3 = async (data: Float32Array, params: MP3Params) => {
  const encoder = await createMp3Encoder();
  encoder.configure(params);
  const frames = encoder.encode([data]);
  const lastFrames = encoder.finalize();
  return new Blob([frames, lastFrames], { type: "audio/mpeg" });
};

expose({ encodeMp3 });
