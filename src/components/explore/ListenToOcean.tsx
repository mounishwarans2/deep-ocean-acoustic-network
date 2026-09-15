import type { MenuOption } from '../../data/menuContent';
import { WaveformPlayer } from './WaveformPlayer';
import './ListenToOcean.css';

const WHALE_SRC = `${import.meta.env.BASE_URL}whale.mp3`;
const DOLPHIN_SRC = `${import.meta.env.BASE_URL}dolphin.mp3`;

interface Props {
  option: MenuOption;
  onClose: () => void;
}

export function ListenToOcean({ option, onClose }: Props) {
  return (
    <div className="menu-content-view listen-ocean">
      <div className="menu-content-header">
        <div className="menu-content-title">
          <span className="menu-content-icon">{option.icon}</span>
          <div>
            <div className="menu-content-label">{option.label}</div>
            <div className="menu-content-ctx">Explore the Deep · Audio Explorer</div>
          </div>
        </div>
        <button className="menu-content-back" onClick={onClose}>← Back to Dashboard</button>
      </div>

      <div className="menu-content-body">
        <div className="mc-section lo-hero">
          <h4 className="mc-heading">Listen to the Ocean</h4>
          <p className="mc-paragraph">
            Real ocean-animal audio captured via underwater hydrophones.
            Select a recording below to play.
          </p>
        </div>

        <div className="mc-section lo-tracks">
          <WaveformPlayer
            src={DOLPHIN_SRC}
            icon="🐬"
            title="Dolphin"
            meta="Click trains & whistles · Coastal waters"
          />
          <WaveformPlayer
            src={WHALE_SRC}
            icon="🐋"
            title="Whale"
            meta="Low-frequency vocalizations · Deep ocean"
          />
        </div>

        {option.sections?.map((s, i) => (
          <div className={`mc-section${s.accent ? ' mc-accent' : ''}`} key={i}>
            {s.heading && <h4 className="mc-heading">{s.heading}</h4>}
            {s.bullets && (
              <ul className="mc-bullets">
                {s.bullets.map(b => <li key={b}>• {b}</li>)}
              </ul>
            )}
            {s.note && <div className="mc-note">{s.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
