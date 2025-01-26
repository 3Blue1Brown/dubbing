/**
 * references:
 * https://www.reddit.com/r/learnjavascript/comments/1buqjr3/solution_web_audio_replacing/
 * https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process
 */

/**
 * max # of audio samples worklet buffer can hold. allocate large enough # such
 * that one call to process should never exceed it (resulting in loss of data).
 */
const maxSamples = 100000;
/**
 * once collected samples exceeds this amount, "flush" buffer (send message to
 * parent audio graph with collected sample data). lower -> more frequent
 * updates in parent.
 */
const flushSamples = 1000;

/** custom audio node to capture raw samples from graph */
class Recorder extends AudioWorkletProcessor {
  constructor() {
    super();
    /** buffer to accumulate raw audio samples in */
    this.samples = new Float32Array(maxSamples);
    /** track current position in buffer */
    this.offset = 0;
  }

  process(inputs) {
    /** get block of samples for first channel of first audio node input */
    const input = inputs?.[0]?.[0];

    /** if not defined (yet), ignore */
    if (!input) return true;

    /** write new input to buffer */
    this.samples.set(input, this.offset);

    /** increment sample offset */
    this.offset += input.length;

    /** "flush" buffer */
    if (this.offset >= flushSamples) {
      /** send buffer to audio graph */
      this.port.postMessage(this.samples.slice(0, this.offset));
      /** start over */
      this.offset = 0;
    }

    return true;
  }
}

registerProcessor("recorder", Recorder);
