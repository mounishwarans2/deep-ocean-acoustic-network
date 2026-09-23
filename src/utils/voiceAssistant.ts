// Reusable browser-native voice utility for the Ocean Intelligence assistant.
// Uses window.speechSynthesis (laptop speaker, no network, no paid API,
// no microphone data leaves the device). All settings are harmless UI
// preferences in localStorage — never credentials.

export interface SpeakOptions {
  volume?: number; // 0..1
  rate?: number; // 0.1..2
  voiceName?: string; // preferred English voice
  /** dedupe key: identical key within cooldownMs is skipped (prevents re-render loops) */
  dedupeKey?: string;
  cooldownMs?: number;
  /** play the short alert tone first (failure announcements) */
  alertTone?: boolean;
}

const LS_ENABLED = 'oi-voice-enabled';
const LS_VOLUME = 'oi-voice-volume';
const LS_RATE = 'oi-voice-rate';
const LS_VOICE = 'oi-voice-name';

const DEFAULT_COOLDOWN_MS = 60_000;
const lastSpokenAt = new Map<string, number>();

function supported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function isVoiceSupported(): boolean {
  return supported();
}

export function isSpeaking(): boolean {
  return supported() && window.speechSynthesis.speaking;
}

export function stopSpeaking(): void {
  if (supported()) window.speechSynthesis.cancel();
}

export function pauseSpeaking(): void {
  if (supported() && window.speechSynthesis.speaking) window.speechSynthesis.pause();
}

export function resumeSpeaking(): void {
  if (supported() && window.speechSynthesis.paused) window.speechSynthesis.resume();
}

export function isVoiceEnabled(): boolean {
  try {
    const v = localStorage.getItem(LS_ENABLED);
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

export function setVoiceEnabled(on: boolean): void {
  try {
    localStorage.setItem(LS_ENABLED, on ? '1' : '0');
  } catch {}
  if (!on) stopSpeaking();
}

export interface VoiceSettings {
  enabled: boolean;
  volume: number;
  rate: number;
  voiceName: string;
}

export function loadVoiceSettings(): VoiceSettings {
  const num = (key: string, fallback: number): number => {
    try {
      const v = Number(localStorage.getItem(key));
      return Number.isFinite(v) ? v : fallback;
    } catch {
      return fallback;
    }
  };
  let voiceName = '';
  try {
    voiceName = localStorage.getItem(LS_VOICE) || '';
  } catch {}
  return {
    enabled: isVoiceEnabled(),
    volume: Math.min(1, Math.max(0, num(LS_VOLUME, 0.9))),
    rate: Math.min(2, Math.max(0.5, num(LS_RATE, 1))),
    voiceName,
  };
}

export function saveVoiceSettings(s: Partial<VoiceSettings>): void {
  try {
    if (s.volume !== undefined) localStorage.setItem(LS_VOLUME, String(s.volume));
    if (s.rate !== undefined) localStorage.setItem(LS_RATE, String(s.rate));
    if (s.voiceName !== undefined) localStorage.setItem(LS_VOICE, s.voiceName);
  } catch {}
}

export function listEnglishVoices(): SpeechSynthesisVoice[] {
  if (!supported()) return [];
  return window.speechSynthesis
    .getVoices()
    .filter(v => v.lang.toLowerCase().startsWith('en'));
}

function pickVoice(preferred?: string): SpeechSynthesisVoice | null {
  if (!supported()) return null;
  const voices = listEnglishVoices();
  if (voices.length === 0) return null;
  if (preferred) {
    const match = voices.find(v => v.name === preferred);
    if (match) return match;
  }
  return voices.find(v => v.default) || voices[0];
}

/** Short two-tone emergency beep via Web Audio (created on user gesture). */
export function playAlertTone(): void {
  try {
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 660].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t0 = now + i * 0.22;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.25, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.22);
    });
    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 800);
  } catch {}
}

export function speak(text: string, options: SpeakOptions = {}): boolean {
  if (!supported() || !text.trim()) return false;
  if (!isVoiceEnabled()) return false;

  // Duplicate control: same key within cooldown is skipped.
  if (options.dedupeKey) {
    const now = Date.now();
    const last = lastSpokenAt.get(options.dedupeKey) || 0;
    if (now - last < (options.cooldownMs ?? DEFAULT_COOLDOWN_MS)) return false;
    lastSpokenAt.set(options.dedupeKey, now);
  }

  const settings = loadVoiceSettings();
  if (!settings.enabled) return false;

  // Cancel anything in progress so alerts interrupt cleanly (no overlap).
  window.speechSynthesis.cancel();

  if (options.alertTone) playAlertTone();

  const utter = new SpeechSynthesisUtterance(text);
  utter.volume = options.volume ?? settings.volume;
  utter.rate = options.rate ?? settings.rate;
  const voice = pickVoice(options.voiceName ?? settings.voiceName);
  if (voice) utter.voice = voice;
  utter.lang = voice?.lang || 'en-US';
  window.speechSynthesis.speak(utter);
  return true;
}

/** Failure announcement with real incident info; generic fallback when unknown. */
export function speakFailureAlert(nodeId?: string, reason?: string): boolean {
  const node = (nodeId || '').trim();
  const detail = (reason || '').trim();
  const text = node
    ? `Alert. Alert. System failure detected. Node ${node} has reported a ${
        detail || 'communication failure'
      }. Please check the underwater network monitoring system.`
    : 'Alert. Alert. System failure detected. Underwater communication system requires immediate attention.';
  return speak(text, { dedupeKey: `failure-${node || 'generic'}`, alertTone: true });
}
