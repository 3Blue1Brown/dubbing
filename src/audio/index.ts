export const bitDepth = 16;
export const bitPeak = 2 ** (bitDepth - 1);

let ctx: AudioContext;

/** typed array to audio buffer */
export const bufferToAudio = (buffer: Int16Array, sampleRate: number) => {
  ctx ??= new AudioContext();
  const audio = ctx.createBuffer(1, buffer.length, sampleRate);
  audio.getChannelData(0).set(toFloat(buffer));
  return audio;
};

/** 16-bit ints to 32-bit floats */
export const toFloat = (array: Int16Array) => {
  const result = new Float32Array(array.length);
  for (let i = 0; i < array.length; i++)
    result[i] = array[i]! / (array[i]! < 0 ? bitPeak : bitPeak - 1);
  return result;
};
