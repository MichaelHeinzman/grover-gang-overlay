/**
 * Synthesized alert sounds using Web Audio API.
 * No external audio files needed — generates RL-style effects on the fly.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(
  freq: number,
  duration: number,
  type: OscillatorType,
  gain: number,
  delay = 0,
  freqEnd?: number,
) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const vol = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  if (freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(
      freqEnd,
      ctx.currentTime + delay + duration,
    );
  }

  vol.gain.setValueAtTime(gain, ctx.currentTime + delay);
  vol.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + delay + duration,
  );

  osc.connect(vol);
  vol.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

/** Rising two-tone chime — new follower */
export function playFollowSound() {
  playTone(523, 0.15, "sine", 0.25); // C5
  playTone(659, 0.2, "sine", 0.3, 0.12); // E5
  playTone(784, 0.3, "sine", 0.2, 0.25); // G5
}

/** Triumphant fanfare — subscriber */
export function playSubSound() {
  playTone(392, 0.15, "square", 0.15); // G4
  playTone(523, 0.15, "square", 0.18, 0.12); // C5
  playTone(659, 0.15, "square", 0.2, 0.24); // E5
  playTone(784, 0.35, "square", 0.22, 0.36); // G5
}

/** Sparkly gift drop */
export function playGiftSound() {
  playTone(880, 0.12, "sine", 0.2);
  playTone(1109, 0.12, "sine", 0.22, 0.1);
  playTone(1319, 0.12, "sine", 0.2, 0.2);
  playTone(1568, 0.25, "sine", 0.25, 0.3);
  playTone(1760, 0.3, "sine", 0.15, 0.4);
}

/** Electric zap — cheer/bits */
export function playCheerSound() {
  playTone(200, 0.3, "sawtooth", 0.12, 0, 800);
  playTone(600, 0.15, "sine", 0.2, 0.15);
  playTone(900, 0.2, "sine", 0.18, 0.25);
}

/** Alarm/impact — raid */
export function playRaidSound() {
  playTone(150, 0.4, "sawtooth", 0.2);
  playTone(200, 0.3, "square", 0.15, 0.15);
  playTone(300, 0.2, "square", 0.18, 0.3);
  playTone(400, 0.2, "square", 0.2, 0.4);
  playTone(600, 0.35, "square", 0.22, 0.5);
}

/** Magical item pickup — redemption */
export function playRedeemSound() {
  playTone(440, 0.1, "sine", 0.2);
  playTone(554, 0.1, "sine", 0.2, 0.08);
  playTone(659, 0.15, "sine", 0.22, 0.16);
  playTone(880, 0.3, "sine", 0.18, 0.24);
}

/** Dramatic digital whoosh — scene transition */
export function playSceneTransitionSound() {
  const ctx = getCtx();
  const now = ctx.currentTime;

  // Noise burst for "digital sweep" texture
  const bufferSize = ctx.sampleRate * 0.3;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer;
  const noiseGain = ctx.createGain();
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.setValueAtTime(800, now);
  noiseFilter.frequency.linearRampToValueAtTime(4000, now + 0.15);
  noiseFilter.frequency.linearRampToValueAtTime(200, now + 0.3);
  noiseFilter.Q.value = 2;
  noiseGain.gain.setValueAtTime(0.12, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(now);
  noise.stop(now + 0.3);

  // Descending sweep — low rumble
  playTone(400, 0.25, "sawtooth", 0.1, 0, 80);
  // Rising digital sweep
  playTone(200, 0.2, "square", 0.08, 0.05, 1200);
  // Impact tone
  playTone(100, 0.3, "sine", 0.15, 0.15);
  // Bright tail chime
  playTone(880, 0.15, "sine", 0.1, 0.2);
  playTone(1320, 0.2, "sine", 0.08, 0.25);
}

const SOUND_MAP: Record<string, () => void> = {
  follow: playFollowSound,
  subscribe: playSubSound,
  gift: playGiftSound,
  cheer: playCheerSound,
  raid: playRaidSound,
  redemption: playRedeemSound,
};

/** Play the sound effect matching an alert type */
export function playAlertSound(type: string) {
  const fn = SOUND_MAP[type];
  if (fn) fn();
}
