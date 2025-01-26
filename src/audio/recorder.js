/** https://www.reddit.com/r/learnjavascript/comments/1buqjr3/solution_web_audio_replacing/ */

/** custom audio node to capture raw samples from graph */
class Recorder extends AudioWorkletProcessor {
  constructor() {
    super();
    /** buffer to fill up and periodically "flush" to audio graph */
    this.buffer = new Float32Array(128 * 100);
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
      this.buffer[index + this.offset] = input[index];

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

registerProcessor("recorder", Recorder);
