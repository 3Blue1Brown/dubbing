let ctx: AudioContext;

/** typed float array to audio buffer */
export const floatToAudio = (float: Float32Array, sampleRate: number) => {
  ctx ??= new AudioContext();
  const audio = ctx.createBuffer(1, float.length, sampleRate);
  audio.getChannelData(0).set(float);
  return audio;
};

/** typed int array to typed float array */
export const intToFloat = (int: Int16Array) => {
  const float = new Float32Array(int.length);
  for (let index = 0; index < int.length; index++)
    float[index] = int[index]! / 2 ** (16 - 1);
  return float;
};
