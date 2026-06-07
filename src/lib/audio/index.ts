let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function isEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const raw = localStorage.getItem('settings');
  if (!raw) return true;
  try {
    const s = JSON.parse(raw) as {
      state?: { settings?: { soundEnabled?: boolean; soundVolume?: number } };
    };
    if (!s.state?.settings?.soundEnabled) return false;
    return s.state.settings.soundEnabled;
  } catch {
    return true;
  }
}

function getVolume(): number {
  if (typeof window === 'undefined') return 0.5;
  const raw = localStorage.getItem('settings');
  if (!raw) return 0.5;
  try {
    const s = JSON.parse(raw) as { state?: { settings?: { soundVolume?: number } } };
    return s.state?.settings?.soundVolume ?? 0.5;
  } catch {
    return 0.5;
  }
}

function playTone(freq: number, duration: number, type: OscillatorType = 'sine'): void {
  if (!isEnabled()) return;
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = getVolume() * 0.3;
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration);
  } catch {
    // Audio may not be available
  }
}

export function playKeyClick(): void {
  playTone(800, 0.08, 'square');
}

export function playError(): void {
  playTone(200, 0.2, 'sawtooth');
}

export function playHit(): void {
  playTone(600, 0.12, 'sine');
  setTimeout(() => playTone(900, 0.1, 'sine'), 60);
}

export function playGameOver(): void {
  playTone(400, 0.3, 'sawtooth');
  setTimeout(() => playTone(300, 0.3, 'sawtooth'), 200);
  setTimeout(() => playTone(200, 0.5, 'sawtooth'), 400);
}

export function playWin(): void {
  playTone(523, 0.15, 'sine');
  setTimeout(() => playTone(659, 0.15, 'sine'), 150);
  setTimeout(() => playTone(784, 0.15, 'sine'), 300);
  setTimeout(() => playTone(1047, 0.3, 'sine'), 450);
}
