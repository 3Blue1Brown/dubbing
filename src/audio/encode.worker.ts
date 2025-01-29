import { createMp3Encoder } from "wasm-media-encoders";
import type { WasmMediaEncoder } from "wasm-media-encoders";
import { worker } from "workerpool";

export type Mp3Params = Parameters<
  WasmMediaEncoder<"audio/mpeg">["configure"]
>[0];

export type EncodeMp3 = typeof encodeMp3;

/** encode raw audio buffer to mp3 */
export const encodeMp3 = async (data: Float32Array, params: Mp3Params) => {
  const encoder = await createMp3Encoder();
  encoder.configure(params);
  const frames = encoder.encode([data]);
  const lastFrames = encoder.finalize();
  return new Blob([frames, lastFrames], { type: "audio/mpeg" });
};

worker({ encodeMp3 });
