import { isVoiceSupported } from '../../utils/voiceAssistant';

interface Props {
  speaking: boolean;
  muted: boolean;
  onSpeakLast: () => void;
  onStop: () => void;
  onToggleMute: () => void;
  canSpeak: boolean;
}

export function VoiceControls({ speaking, muted, onSpeakLast, onStop, onToggleMute, canSpeak }: Props) {
  if (!isVoiceSupported()) {
    return <span className="oi-voice-na">🔈 voice unavailable in this browser</span>;
  }
  return (
    <div className="oi-voice-row" role="group" aria-label="Voice controls">
      <button
        type="button"
        className="oi-btn"
        onClick={onSpeakLast}
        disabled={!canSpeak || speaking}
        aria-label="Speak last response"
        title="Speak last response"
      >
        🔊 Speak
      </button>
      <button
        type="button"
        className="oi-btn"
        onClick={onStop}
        disabled={!speaking}
        aria-label="Stop speaking"
        title="Stop speaking"
      >
        ⏹ Stop
      </button>
      <button
        type="button"
        className={`oi-btn${muted ? ' oi-muted' : ''}`}
        onClick={onToggleMute}
        aria-label={muted ? 'Unmute voice' : 'Mute voice'}
        aria-pressed={muted}
        title={muted ? 'Unmute voice' : 'Mute voice'}
      >
        {muted ? '🔇 Muted' : '🔊 Voice'}
      </button>
      <span className={`oi-speak-state${speaking ? ' on' : ''}`} aria-live="polite">
        {speaking ? '🔊 Speaking…' : '🔈 Voice ready'}
      </span>
    </div>
  );
}
