class SoundManager {
  constructor() {
    this.context = new (window.AudioContext || window.webkitAudioContext)();
    // Pre-generate a white noise buffer for explosion sounds.
    this.noiseBuffer = this.createNoiseBuffer();
  }
  createNoiseBuffer() {
    const bufferSize = this.context.sampleRate;
    let buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    let output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }
  playTone(frequency, duration, type = "sine", volume = 0.5) {
    const osc = this.context.createOscillator();
    const gainNode = this.context.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gainNode.gain.value = volume;
    osc.connect(gainNode);
    gainNode.connect(this.context.destination);
    osc.start();
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
    osc.stop(this.context.currentTime + duration);
  }
  playShootSound() {
    // Two oscillators with a quick frequency slide for a "pew" effect
    const { context } = this;
    const osc1 = context.createOscillator();
    const osc2 = context.createOscillator();
    const gain = context.createGain();
    osc1.type = 'square';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(800, context.currentTime);
    osc2.frequency.setValueAtTime(800, context.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(300, context.currentTime + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(300, context.currentTime + 0.15);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(context.destination);
    gain.gain.setValueAtTime(0.4, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
    osc1.start();
    osc2.start();
    osc1.stop(context.currentTime + 0.15);
    osc2.stop(context.currentTime + 0.15);
  }
  playExplosionSound() {
    // Play the pre-generated white noise with an exponential decay envelope.
    const { context, noiseBuffer } = this;
    const noiseSource = context.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const gainNode = context.createGain();
    noiseSource.connect(gainNode);
    gainNode.connect(context.destination);
    gainNode.gain.setValueAtTime(1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
    noiseSource.start();
    noiseSource.stop(context.currentTime + 0.5);
  }
  playCorrectSound() {
    // Layer three oscillators to simulate a harmonic chord.
    const { context } = this;
    const duration = 0.3;
    const frequencies = [660, 825, 990]; // A chord-like set
    const gain = context.createGain();
    gain.gain.value = 0.3;
    gain.connect(context.destination);
    frequencies.forEach(freq => {
      const osc = context.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.8, context.currentTime + duration);
      osc.connect(gain);
      osc.start();
      osc.stop(context.currentTime + duration);
    });
  }
  playWrongSound() {
    // Play a dissonant descending tone.
    const { context } = this;
    const duration = 0.25;
    const osc = context.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, context.currentTime + duration);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.4, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + duration);
  }
  playGameOverSound() {
    // A deep, descending tone for game over.
    const { context } = this;
    const osc = context.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, context.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, context.currentTime + 0.8);
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.5, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.8);
    osc.connect(gain);
    gain.connect(context.destination);
    osc.start();
    osc.stop(context.currentTime + 0.8);
  }
}
window.soundManager = new SoundManager();
