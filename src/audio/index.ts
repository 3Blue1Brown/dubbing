let ctx: AudioContext;

/** typed float array to audio buffer */
export const floatToAudio = (float: Float32Array, sampleRate: number) => {
  ctx ??= new AudioContext({ sampleRate });
  const audio = ctx.createBuffer(1, float.length, sampleRate);
  audio.getChannelData(0).set(float);
  return audio;
};

/** concat two typed arrays together */
export const concatFloats = (a: Float32Array, b: Float32Array) => {
  const result = new Float32Array(a.length + b.length);
  result.set(a);
  result.set(b, a.length);
  return result;
};
