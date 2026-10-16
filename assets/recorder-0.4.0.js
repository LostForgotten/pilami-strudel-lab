class PilamiRecorder extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.active = false;
    this.total = 0;
    this.used = 0;
    this.buffer = new Float32Array(8192);
    this.limit = options.processorOptions.maxFrames;
    this.port.onmessage = event => {
      if (event.data === 'start') this.active = true;
      if (event.data === 'stop') this.finish();
    };
  }
  flush() {
    if (!this.used) return;
    const data = this.buffer.slice(0, this.used * 2);
    this.port.postMessage({type:'chunk', data}, [data.buffer]);
    this.used = 0;
  }
  finish() {
    if (!this.active) return;
    this.active = false;
    this.flush();
    this.port.postMessage({type:'done', frames:this.total});
  }
  process(inputs, outputs) {
    if (!this.active) return true;
    const input = inputs[0];
    const frames = input[0]?.length || outputs[0][0].length;
    for (let i = 0; i < frames && this.total < this.limit; i++) {
      this.buffer[this.used * 2] = input[0]?.[i] || 0;
      this.buffer[this.used * 2 + 1] = (input[1] || input[0])?.[i] || 0;
      this.used++;
      this.total++;
      if (this.used === 4096) this.flush();
    }
    if (this.total >= this.limit) this.finish();
    return true;
  }
}
registerProcessor('pilami-recorder-040', PilamiRecorder);
