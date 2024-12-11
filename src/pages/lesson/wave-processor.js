// https://www.reddit.com/r/learnjavascript/comments/1buqjr3/solution_web_audio_replacing/

const bufferSize = 128;
const peak = 2 ** (16 - 1);

class WaveProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = new Int16Array(128 * bufferSize);
    this.offset = 0;
  }

  process(inputs) {
    const input = inputs[0][0];

    if (!input) return false;

    for (let index = 0; index < input.length; index++)
      this.buffer[index + this.offset] =
        input[index] * (input[index] < 0 ? peak : peak - 1);

    this.offset += input.length;

    if (this.offset >= this.buffer.length - 1) {
      this.offset = 0;
      this.port.postMessage(this.buffer);
    }

    return true;
  }
}

registerProcessor("wave-processor", WaveProcessor);
