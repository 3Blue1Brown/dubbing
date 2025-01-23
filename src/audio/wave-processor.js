/** https://www.reddit.com/r/learnjavascript/comments/1buqjr3/solution_web_audio_replacing/ */

/** max 16-bit value */
const peak = 2 ** (16 - 1);

/** custom audio node to capture raw samples from graph */
class WaveProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    /** buffer to fill up and periodically "flush" to audio graph */
    this.buffer = new Int16Array(128 * 100);
    /** track current position in buffer */
    this.offset = 0;
  }

  process(inputs) {
    /** get block of samples for first channel of first audio node input */
    const input = inputs?.[0]?.[0];

    /** if not defined (yet), ignore */
    if (!input) return true;

    /** write new input to buffer */
    for (let index = 0; index < input.length; index++)
      this.buffer[index + this.offset] =
        input[index] *
        /** convert float [-1, 1] to 16 bit int */
        (input[index] < 0 ? peak : peak - 1);

    /** increment sample offset */
    this.offset += input.length;

    /** "flush" buffer */
    if (this.offset >= this.buffer.length - 1) {
      /** send buffer to audio graph */
      this.port.postMessage(this.buffer);
      /** start over */
      this.offset = 0;
    }

    return true;
  }
}

registerProcessor("wave-processor", WaveProcessor);
