// Simple Audio Synthesis to avoid needing external assets
const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
const ctx = new AudioContextClass();

const playTone = (freq: number, type: OscillatorType, duration: number, delay: number = 0, vol: number = 0.1) => {
  if (ctx.state === 'suspended') ctx.resume();
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  
  gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
};

export const playSound = {
  move: () => {
    // A soft "thud" or "whoosh"
    playTone(200, 'sine', 0.1, 0, 0.15);
    playTone(100, 'triangle', 0.1, 0.05, 0.1);
  },
  capture: () => {
    // A cartoon "pop"
    playTone(400, 'sine', 0.1, 0, 0.2);
    playTone(600, 'square', 0.1, 0.05, 0.1);
  },
  king: () => {
    // Magical chime
    playTone(500, 'sine', 0.3, 0);
    playTone(700, 'sine', 0.4, 0.1);
    playTone(1000, 'sine', 0.5, 0.2, 0.1);
  },
  win: () => {
    // Victory fanfare
    [300, 400, 500, 600, 800].forEach((f, i) => {
      playTone(f, 'square', 0.4, i * 0.1, 0.1);
    });
  },
  error: () => {
    playTone(150, 'sawtooth', 0.2);
    playTone(100, 'sawtooth', 0.2, 0.1);
  },
  fightIntro: () => {
    // Deep impactful intro
    playTone(80, 'sawtooth', 0.4, 0, 0.3);
    playTone(120, 'sawtooth', 0.4, 0.1, 0.2);
  },
  fightGo: () => {
    // Sharp start sound
    playTone(800, 'square', 0.2, 0, 0.3);
    playTone(400, 'square', 0.5, 0, 0.2);
    playTone(100, 'sawtooth', 0.6, 0, 0.4);
  }
};