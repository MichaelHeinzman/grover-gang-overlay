/**
 * Production-grade synthesized alert sounds using Web Audio API.
 * Uses layered oscillators, reverb, filters, sub-bass, and stereo panning
 * for rich, broadcast-quality effects — no external files needed.
 */

let audioCtx: AudioContext | null = null;
let reverbBuffer: AudioBuffer | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
    reverbBuffer = createReverbImpulse(audioCtx, 1.2, 3);
  }
  return audioCtx;
}

/** Generate a synthetic reverb impulse response */
function createReverbImpulse(
  ctx: AudioContext,
  duration: number,
  decay: number,
): AudioBuffer {
  const length = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return buffer;
}

/** Create a convolution reverb node */
function createReverb(ctx: AudioContext, wet: number): ConvolverNode {
  const convolver = ctx.createConvolver();
  if (reverbBuffer) convolver.buffer = reverbBuffer;
  // Wet level controlled by gain node upstream
  void wet; // used by caller via gain routing
  return convolver;
}

/** Route output through reverb + dry mix */
function createReverbSend(
  ctx: AudioContext,
  dryLevel: number,
  wetLevel: number,
): { input: GainNode; connect: (dest: AudioNode) => void } {
  const input = ctx.createGain();
  const dry = ctx.createGain();
  const wet = ctx.createGain();
  const reverb = createReverb(ctx, wetLevel);

  dry.gain.value = dryLevel;
  wet.gain.value = wetLevel;

  input.connect(dry);
  input.connect(reverb);
  reverb.connect(wet);

  return {
    input,
    connect(dest: AudioNode) {
      dry.connect(dest);
      wet.connect(dest);
    },
  };
}

interface ToneOptions {
  freq: number;
  duration: number;
  type: OscillatorType;
  gain: number;
  delay?: number;
  freqEnd?: number;
  detune?: number;
  pan?: number;
  filterFreq?: number;
  filterType?: BiquadFilterType;
  filterQ?: number;
  attack?: number;
  reverb?: number;
}

/** Advanced tone with optional filter, panning, detune, attack, and reverb */
function playTone(opts: ToneOptions) {
  const ctx = getCtx();
  const t = ctx.currentTime + (opts.delay ?? 0);
  const attack = opts.attack ?? 0.01;

  const osc = ctx.createOscillator();
  osc.type = opts.type;
  osc.frequency.setValueAtTime(opts.freq, t);
  if (opts.freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, t + opts.duration);
  }
  if (opts.detune) osc.detune.value = opts.detune;

  // Gain envelope with attack
  const vol = ctx.createGain();
  vol.gain.setValueAtTime(0.001, t);
  vol.gain.linearRampToValueAtTime(opts.gain, t + attack);
  vol.gain.exponentialRampToValueAtTime(0.001, t + opts.duration);

  let output: AudioNode = vol;

  // Optional filter
  if (opts.filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType ?? "lowpass";
    filter.frequency.value = opts.filterFreq;
    filter.Q.value = opts.filterQ ?? 1;
    vol.connect(filter);
    output = filter;
  } else {
    output = vol;
  }

  // Stereo panning
  if (opts.pan !== undefined && opts.pan !== 0) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = opts.pan;
    output.connect(panner);
    output = panner;
  }

  osc.connect(vol);

  // Reverb send
  if (opts.reverb && opts.reverb > 0) {
    const send = createReverbSend(ctx, 1 - opts.reverb * 0.5, opts.reverb);
    output.connect(send.input);
    send.connect(ctx.destination);
  } else {
    output.connect(ctx.destination);
  }

  osc.start(t);
  osc.stop(t + opts.duration + 0.05);
}

/** Create a layered chord tone (detuned for richness) */
function playLayered(
  base: Omit<ToneOptions, "detune">,
  detuneSpread = 8,
  layers = 3,
) {
  const offsets = Array.from(
    { length: layers },
    (_, i) => ((i / (layers - 1)) * 2 - 1) * detuneSpread,
  );
  for (const d of offsets) {
    playTone({ ...base, detune: d, gain: base.gain / layers });
  }
}

/** Noise burst utility for texture layers */
function playNoiseBurst(opts: {
  duration: number;
  gain: number;
  delay?: number;
  filterFreq?: number;
  filterType?: BiquadFilterType;
  filterQ?: number;
  pan?: number;
  reverb?: number;
}) {
  const ctx = getCtx();
  const t = ctx.currentTime + (opts.delay ?? 0);
  const len = ctx.sampleRate * opts.duration;
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const vol = ctx.createGain();
  vol.gain.setValueAtTime(opts.gain, t);
  vol.gain.exponentialRampToValueAtTime(0.001, t + opts.duration);

  let output: AudioNode = vol;

  if (opts.filterFreq) {
    const filter = ctx.createBiquadFilter();
    filter.type = opts.filterType ?? "bandpass";
    filter.frequency.value = opts.filterFreq;
    filter.Q.value = opts.filterQ ?? 2;
    vol.connect(filter);
    output = filter;
  }

  if (opts.pan !== undefined) {
    const panner = ctx.createStereoPanner();
    panner.pan.value = opts.pan;
    output.connect(panner);
    output = panner;
  }

  src.connect(vol);

  if (opts.reverb && opts.reverb > 0) {
    const send = createReverbSend(ctx, 0.7, opts.reverb);
    output.connect(send.input);
    send.connect(ctx.destination);
  } else {
    output.connect(ctx.destination);
  }

  src.start(t);
  src.stop(t + opts.duration);
}

// ─── Alert Sounds ──────────────────────────────────────────────

/** Warm shimmer chime — new follower */
export function playFollowSound() {
  // Layered major triad ascending with reverb tail
  playLayered({
    freq: 523,
    duration: 0.2,
    type: "sine",
    gain: 0.3,
    reverb: 0.4,
  });
  playLayered({
    freq: 659,
    duration: 0.25,
    type: "sine",
    gain: 0.35,
    delay: 0.1,
    reverb: 0.4,
  });
  playLayered({
    freq: 784,
    duration: 0.35,
    type: "sine",
    gain: 0.3,
    delay: 0.22,
    reverb: 0.5,
  });
  // High shimmer overtone
  playTone({
    freq: 1568,
    duration: 0.4,
    type: "sine",
    gain: 0.08,
    delay: 0.28,
    reverb: 0.7,
    pan: 0.3,
  });
  playTone({
    freq: 1318,
    duration: 0.35,
    type: "sine",
    gain: 0.06,
    delay: 0.3,
    reverb: 0.7,
    pan: -0.3,
  });
  // Subtle noise sparkle
  playNoiseBurst({
    duration: 0.15,
    gain: 0.04,
    delay: 0.2,
    filterFreq: 6000,
    filterType: "highpass",
    reverb: 0.5,
  });
}

/** Epic fanfare with sub-bass — subscriber */
export function playSubSound() {
  // Sub-bass foundation
  playTone({
    freq: 65,
    duration: 0.6,
    type: "sine",
    gain: 0.2,
    attack: 0.05,
    filterFreq: 200,
    filterType: "lowpass",
  });
  // Layered fanfare rising chord
  playLayered(
    {
      freq: 392,
      duration: 0.18,
      type: "square",
      gain: 0.18,
      reverb: 0.3,
      delay: 0.0,
    },
    12,
  );
  playLayered(
    {
      freq: 523,
      duration: 0.18,
      type: "square",
      gain: 0.2,
      delay: 0.12,
      reverb: 0.3,
    },
    12,
  );
  playLayered(
    {
      freq: 659,
      duration: 0.2,
      type: "square",
      gain: 0.22,
      delay: 0.24,
      reverb: 0.4,
    },
    12,
  );
  playLayered(
    {
      freq: 784,
      duration: 0.4,
      type: "square",
      gain: 0.25,
      delay: 0.36,
      reverb: 0.5,
    },
    12,
  );
  // Bright octave accent
  playTone({
    freq: 1568,
    duration: 0.3,
    type: "sine",
    gain: 0.1,
    delay: 0.36,
    reverb: 0.6,
    pan: 0.4,
  });
  // Impact noise layer
  playNoiseBurst({
    duration: 0.08,
    gain: 0.1,
    delay: 0.35,
    filterFreq: 3000,
    filterType: "bandpass",
    filterQ: 3,
  });
}

/** Cascading sparkle waterfall — gift sub */
export function playGiftSound() {
  const notes = [880, 1047, 1175, 1319, 1568, 1760];
  for (let i = 0; i < notes.length; i++) {
    const pan = (i / (notes.length - 1)) * 1.2 - 0.6; // sweep L→R
    playLayered(
      {
        freq: notes[i],
        duration: 0.18 + i * 0.02,
        type: "sine",
        gain: 0.2,
        delay: i * 0.08,
        reverb: 0.5,
        pan,
      },
      6,
    );
  }
  // Sparkle noise bed
  playNoiseBurst({
    duration: 0.5,
    gain: 0.05,
    delay: 0.1,
    filterFreq: 8000,
    filterType: "highpass",
    reverb: 0.7,
    pan: 0,
  });
  // Sub thud
  playTone({ freq: 80, duration: 0.3, type: "sine", gain: 0.15, attack: 0.02 });
}

/** Electrified power surge — cheer/bits */
export function playCheerSound() {
  // Rising distorted sweep
  playTone({
    freq: 150,
    duration: 0.35,
    type: "sawtooth",
    gain: 0.12,
    freqEnd: 900,
    filterFreq: 2000,
    filterType: "lowpass",
    filterQ: 5,
    reverb: 0.3,
  });
  // Detuned mid accent
  playLayered(
    {
      freq: 600,
      duration: 0.2,
      type: "sine",
      gain: 0.2,
      delay: 0.15,
      reverb: 0.4,
    },
    15,
  );
  playLayered(
    {
      freq: 900,
      duration: 0.25,
      type: "sine",
      gain: 0.18,
      delay: 0.25,
      reverb: 0.5,
    },
    10,
  );
  // Electric crackle
  playNoiseBurst({
    duration: 0.12,
    gain: 0.08,
    delay: 0.1,
    filterFreq: 5000,
    filterType: "bandpass",
    filterQ: 8,
    pan: -0.5,
  });
  playNoiseBurst({
    duration: 0.1,
    gain: 0.06,
    delay: 0.2,
    filterFreq: 7000,
    filterType: "bandpass",
    filterQ: 6,
    pan: 0.5,
  });
  // Sub impact
  playTone({
    freq: 55,
    duration: 0.25,
    type: "sine",
    gain: 0.18,
    delay: 0.12,
    attack: 0.01,
  });
}

/** Cinematic war horn — raid */
export function playRaidSound() {
  // Deep sub-bass rumble
  playTone({
    freq: 40,
    duration: 0.8,
    type: "sine",
    gain: 0.25,
    attack: 0.1,
    filterFreq: 150,
    filterType: "lowpass",
  });
  // War horn — layered sawtooth rising
  playLayered(
    {
      freq: 130,
      duration: 0.5,
      type: "sawtooth",
      gain: 0.2,
      attack: 0.08,
      reverb: 0.4,
      filterFreq: 800,
      filterType: "lowpass",
      filterQ: 3,
    },
    15,
    5,
  );
  playLayered(
    {
      freq: 195,
      duration: 0.4,
      type: "sawtooth",
      gain: 0.18,
      delay: 0.2,
      reverb: 0.4,
      filterFreq: 1000,
      filterType: "lowpass",
    },
    15,
    5,
  );
  // Power chord hit
  playLayered(
    {
      freq: 260,
      duration: 0.3,
      type: "square",
      gain: 0.2,
      delay: 0.35,
      reverb: 0.5,
    },
    12,
  );
  playLayered(
    {
      freq: 390,
      duration: 0.3,
      type: "square",
      gain: 0.18,
      delay: 0.4,
      reverb: 0.5,
    },
    12,
  );
  playLayered(
    {
      freq: 520,
      duration: 0.4,
      type: "square",
      gain: 0.22,
      delay: 0.5,
      reverb: 0.6,
    },
    12,
  );
  // Impact noise slam
  playNoiseBurst({
    duration: 0.2,
    gain: 0.15,
    delay: 0.35,
    filterFreq: 1500,
    filterType: "bandpass",
    filterQ: 2,
    reverb: 0.4,
  });
  // Bright tail
  playTone({
    freq: 1040,
    duration: 0.3,
    type: "sine",
    gain: 0.08,
    delay: 0.6,
    reverb: 0.7,
    pan: 0.3,
  });
}

/** Magical power-up with harmonic sweep — redemption */
export function playRedeemSound() {
  // Rising harmonic series with widening stereo
  const harmonics = [440, 554, 659, 880];
  for (let i = 0; i < harmonics.length; i++) {
    const pan = i % 2 === 0 ? -0.3 : 0.3;
    playLayered(
      {
        freq: harmonics[i],
        duration: 0.2 + i * 0.05,
        type: "sine",
        gain: 0.22,
        delay: i * 0.08,
        reverb: 0.5,
        pan,
      },
      8,
    );
  }
  // Magic shimmer
  playNoiseBurst({
    duration: 0.3,
    gain: 0.04,
    delay: 0.15,
    filterFreq: 10000,
    filterType: "highpass",
    reverb: 0.8,
  });
  // Warm sub undertone
  playTone({
    freq: 110,
    duration: 0.4,
    type: "sine",
    gain: 0.12,
    attack: 0.05,
    filterFreq: 250,
    filterType: "lowpass",
  });
  // Final bright ring
  playTone({
    freq: 1760,
    duration: 0.5,
    type: "sine",
    gain: 0.06,
    delay: 0.3,
    reverb: 0.8,
    pan: 0,
  });
}

/** Dramatic cinematic whoosh — scene transition */
export function playSceneTransitionSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Filtered noise sweep — "digital wind"
  const bufferSize = ctx.sampleRate * 0.4;
  const noiseBuffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = noiseBuffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.6;
    }
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(600, now);
  noiseFilter.frequency.exponentialRampToValueAtTime(5000, now + 0.15);
  noiseFilter.frequency.exponentialRampToValueAtTime(200, now + 0.35);
  noiseFilter.Q.value = 3;
  noiseGain.gain.setValueAtTime(0.15, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);

  // Reverb on the noise sweep
  const send = createReverbSend(ctx, 0.7, 0.5);
  noiseGain.connect(send.input);
  send.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.4);

  // Deep sub-bass impact
  playTone({ freq: 50, duration: 0.4, type: "sine", gain: 0.2, attack: 0.02 });
  // Descending sweep — cinematic rumble
  playTone({
    freq: 400,
    duration: 0.3,
    type: "sawtooth",
    gain: 0.1,
    freqEnd: 60,
    filterFreq: 600,
    filterType: "lowpass",
    reverb: 0.3,
  });
  // Rising digital sweep
  playTone({
    freq: 200,
    duration: 0.25,
    type: "square",
    gain: 0.08,
    delay: 0.05,
    freqEnd: 1400,
    filterFreq: 3000,
    filterType: "lowpass",
    reverb: 0.4,
  });
  // Impact hit
  playTone({
    freq: 90,
    duration: 0.35,
    type: "sine",
    gain: 0.18,
    delay: 0.15,
    attack: 0.005,
  });
  // Bright stereo tail chimes
  playTone({
    freq: 880,
    duration: 0.2,
    type: "sine",
    gain: 0.1,
    delay: 0.2,
    reverb: 0.6,
    pan: -0.5,
  });
  playTone({
    freq: 1320,
    duration: 0.25,
    type: "sine",
    gain: 0.08,
    delay: 0.25,
    reverb: 0.7,
    pan: 0.5,
  });
  playTone({
    freq: 1760,
    duration: 0.3,
    type: "sine",
    gain: 0.05,
    delay: 0.28,
    reverb: 0.8,
  });
}

/** Warm resub celebration — resub with message */
export function playResubSound() {
  playLayered(
    { freq: 440, duration: 0.2, type: "sine", gain: 0.25, reverb: 0.4 },
    10,
  );
  playLayered({
    freq: 554,
    duration: 0.2,
    type: "sine",
    gain: 0.28,
    delay: 0.1,
    reverb: 0.4,
  });
  playLayered({
    freq: 659,
    duration: 0.25,
    type: "sine",
    gain: 0.3,
    delay: 0.2,
    reverb: 0.5,
  });
  playLayered({
    freq: 880,
    duration: 0.4,
    type: "sine",
    gain: 0.25,
    delay: 0.32,
    reverb: 0.6,
    pan: 0.2,
  });
  playTone({
    freq: 65,
    duration: 0.5,
    type: "sine",
    gain: 0.15,
    attack: 0.05,
  });
}

/** Hype train siren — ascending urgency */
export function playHypeTrainSound() {
  playTone({
    freq: 200,
    duration: 0.4,
    type: "sawtooth",
    gain: 0.12,
    freqEnd: 600,
    filterFreq: 1500,
    filterType: "lowpass",
    filterQ: 4,
    reverb: 0.3,
  });
  playTone({
    freq: 600,
    duration: 0.3,
    type: "sawtooth",
    gain: 0.1,
    delay: 0.2,
    freqEnd: 1000,
    filterFreq: 2000,
    filterType: "lowpass",
    reverb: 0.3,
  });
  playLayered({
    freq: 800,
    duration: 0.3,
    type: "square",
    gain: 0.18,
    delay: 0.35,
    reverb: 0.4,
  });
  playNoiseBurst({
    duration: 0.15,
    gain: 0.1,
    delay: 0.3,
    filterFreq: 4000,
    filterType: "bandpass",
    filterQ: 5,
  });
  playTone({
    freq: 50,
    duration: 0.5,
    type: "sine",
    gain: 0.2,
    attack: 0.03,
  });
}

/** Level-up ding — hype train progress */
export function playHypeProgressSound() {
  playLayered({
    freq: 880,
    duration: 0.15,
    type: "sine",
    gain: 0.2,
    reverb: 0.3,
  });
  playLayered({
    freq: 1175,
    duration: 0.2,
    type: "sine",
    gain: 0.22,
    delay: 0.08,
    reverb: 0.4,
  });
}

/** Goal chime — bright notification */
export function playGoalSound() {
  playLayered({
    freq: 660,
    duration: 0.15,
    type: "sine",
    gain: 0.2,
    reverb: 0.3,
    pan: -0.3,
  });
  playLayered({
    freq: 880,
    duration: 0.2,
    type: "sine",
    gain: 0.22,
    delay: 0.1,
    reverb: 0.4,
    pan: 0.3,
  });
  playTone({
    freq: 1320,
    duration: 0.3,
    type: "sine",
    gain: 0.1,
    delay: 0.2,
    reverb: 0.6,
  });
}

/** Shoutout fanfare — warm spotlight moment */
export function playShoutoutSound() {
  playLayered({
    freq: 440,
    duration: 0.2,
    type: "sine",
    gain: 0.25,
    reverb: 0.5,
  });
  playLayered({
    freq: 554,
    duration: 0.2,
    type: "sine",
    gain: 0.25,
    delay: 0.12,
    reverb: 0.5,
  });
  playLayered({
    freq: 660,
    duration: 0.25,
    type: "sine",
    gain: 0.28,
    delay: 0.24,
    reverb: 0.5,
  });
  playTone({
    freq: 1320,
    duration: 0.3,
    type: "sine",
    gain: 0.08,
    delay: 0.3,
    reverb: 0.7,
    pan: 0.4,
  });
  playNoiseBurst({
    duration: 0.2,
    gain: 0.04,
    delay: 0.15,
    filterFreq: 6000,
    filterType: "highpass",
    reverb: 0.5,
  });
}

/** Poll/vote notification — quick tick */
export function playPollSound() {
  playTone({
    freq: 700,
    duration: 0.1,
    type: "sine",
    gain: 0.2,
    reverb: 0.2,
  });
  playTone({
    freq: 900,
    duration: 0.15,
    type: "sine",
    gain: 0.22,
    delay: 0.06,
    reverb: 0.3,
  });
}

/** Prediction lock — dramatic tension */
export function playPredictionSound() {
  playTone({
    freq: 300,
    duration: 0.3,
    type: "square",
    gain: 0.12,
    filterFreq: 800,
    filterType: "lowpass",
    reverb: 0.3,
  });
  playLayered({
    freq: 500,
    duration: 0.25,
    type: "sine",
    gain: 0.2,
    delay: 0.15,
    reverb: 0.4,
  });
  playTone({
    freq: 70,
    duration: 0.4,
    type: "sine",
    gain: 0.18,
    attack: 0.05,
  });
}

/** Mod/VIP badge — authority tone */
export function playModSound() {
  playTone({
    freq: 440,
    duration: 0.12,
    type: "sine",
    gain: 0.18,
    reverb: 0.2,
  });
  playTone({
    freq: 660,
    duration: 0.18,
    type: "sine",
    gain: 0.2,
    delay: 0.08,
    reverb: 0.3,
  });
}

/** Charity heart — warm donation tone */
export function playCharitySound() {
  playLayered({
    freq: 523,
    duration: 0.25,
    type: "sine",
    gain: 0.28,
    reverb: 0.5,
  });
  playLayered({
    freq: 659,
    duration: 0.25,
    type: "sine",
    gain: 0.28,
    delay: 0.12,
    reverb: 0.5,
  });
  playLayered({
    freq: 784,
    duration: 0.3,
    type: "sine",
    gain: 0.25,
    delay: 0.24,
    reverb: 0.6,
  });
  playTone({
    freq: 1047,
    duration: 0.35,
    type: "sine",
    gain: 0.1,
    delay: 0.3,
    reverb: 0.7,
  });
}

/** Subtle info tone — generic notification */
export function playInfoSound() {
  playTone({
    freq: 600,
    duration: 0.12,
    type: "sine",
    gain: 0.15,
    reverb: 0.2,
  });
  playTone({
    freq: 800,
    duration: 0.15,
    type: "sine",
    gain: 0.12,
    delay: 0.08,
    reverb: 0.3,
  });
}

const SOUND_MAP: Record<string, () => void> = {
  follow: playFollowSound,
  subscribe: playSubSound,
  resub: playResubSound,
  gift: playGiftSound,
  cheer: playCheerSound,
  raid: playRaidSound,
  redemption: playRedeemSound,
  "hype-train": playHypeTrainSound,
  "hype-progress": playHypeProgressSound,
  goal: playGoalSound,
  shoutout: playShoutoutSound,
  poll: playPollSound,
  prediction: playPredictionSound,
  mod: playModSound,
  charity: playCharitySound,
  info: playInfoSound,
};

/** Play the sound effect matching an alert type */
export function playAlertSound(type: string) {
  const fn = SOUND_MAP[type];
  if (fn) fn();
}
