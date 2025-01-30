let ctx: AudioContext;

/** typed float array to audio buffer */
export const floatToAudio = (float: Float32Array, sampleRate: number) => {
  ctx ??= new AudioContext({ sampleRate });
  const audio = ctx.createBuffer(1, float.length, sampleRate);
  audio.getChannelData(0).set(float);
  return audio;
};
