import type { MenuOption } from '../../data/menuContent';
import { ExplorePortal } from '../explore/ExplorePortal';
import { DeviceExplorer } from '../explore/DeviceExplorer';
import { OceanGallery } from '../explore/OceanGallery';
import { ListenToOcean } from '../explore/ListenToOcean';
import { AcousticSignals } from '../explore/AcousticSignals';
import { OceanSoundscape } from '../explore/OceanSoundscape';
import './Menu.css';

const EXPLORE_IDS = new Set(['vision', 'mission-arch', 'system-mission', 'milestones', 'future']);
const DEVICE_IDS = new Set(['about-device','ai-intel','prism','snc','primary-power','secondary-power','syntactic','local-1gb','ballast','emergency-recovery']);

interface Props {
  option: MenuOption;
  onClose: () => void;
}

export function MenuContentView({ option, onClose }: Props) {
  if (option.id === 'ocean-gallery') {
    return <OceanGallery option={option} onClose={onClose} />;
  }
  if (option.id === 'listen-ocean') {
    return <ListenToOcean option={option} onClose={onClose} />;
  }
  if (option.id === 'acoustic-signals') {
    return <AcousticSignals option={option} onClose={onClose} />;
  }
  if (option.id === 'ocean-soundscape') {
    return <OceanSoundscape option={option} onClose={onClose} />;
  }
  if (EXPLORE_IDS.has(option.id)) {
    return <ExplorePortal onClose={onClose} initialSection={option.id} />;
  }
  if (DEVICE_IDS.has(option.id)) {
    return <DeviceExplorer onClose={onClose} initialSection={option.id} />;
  }
  return (
    <div className="menu-content-view">
      <div className="menu-content-header">
        <div className="menu-content-title">
          <span className="menu-content-icon">{option.icon}</span>
          <div>
            <div className="menu-content-label">{option.label}</div>
            <div className="menu-content-ctx">Hamburger menu content view</div>
          </div>
        </div>
        <button className="menu-content-back" onClick={onClose}>← Back to Dashboard</button>
      </div>

      <div className="menu-content-body">
        {option.sections?.map((s, i) => (
          <div className={`mc-section${s.accent ? ' mc-accent' : ''}`} key={i}>
            {s.heading && <h4 className="mc-heading">{s.heading}</h4>}
            {s.paragraph && <p className="mc-paragraph">{s.paragraph}</p>}

            {s.flow && (
              <div className="mc-flow">
                {s.flow.map((step, j, arr) => (
                  <div className="mc-flow-item" key={step}>
                    <span className="mc-flow-box">{step}</span>
                    {j < arr.length - 1 && <span className="mc-flow-arrow">↓</span>}
                  </div>
                ))}
              </div>
            )}

            {s.bullets && (
              <ul className="mc-bullets">
                {s.bullets.map(b => <li key={b}>• {b}</li>)}
              </ul>
            )}

            {s.stability && (
              <div className="mc-stability">
                {s.stability.map((st, i) => (
                  <span className={`mc-stability-chip ${st.toLowerCase()}`} key={st}>
                    {i + 1}. {st}
                  </span>
                ))}
              </div>
            )}

            {s.items && (
              <div className="mc-items">
                {s.items.map(item => (
                  <div className="mc-item" key={item.title}>
                    {item.num && <span className="mc-item-num">{item.num}</span>}
                    <div>
                      <div className="mc-item-title">{item.title}</div>
                      {item.desc && <div className="mc-item-desc">{item.desc}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {s.checklist && (
              <div className="mc-checklist">
                {s.checklist.done && s.checklist.done.length > 0 && (
                  <div className="mc-check-group">
                    <div className="mc-check-heading">COMPLETED</div>
                    {s.checklist.done.map(c => <div className="mc-check-item done" key={c}>✓ {c}</div>)}
                  </div>
                )}
                {s.checklist.inProgress && s.checklist.inProgress.length > 0 && (
                  <div className="mc-check-group">
                    <div className="mc-check-heading">IN PROGRESS</div>
                    {s.checklist.inProgress.map(c => <div className="mc-check-item progress" key={c}>◉ {c}</div>)}
                  </div>
                )}
                {s.checklist.future && s.checklist.future.length > 0 && (
                  <div className="mc-check-group">
                    <div className="mc-check-heading">FUTURE DEVELOPMENT</div>
                    {s.checklist.future.map(c => <div className="mc-check-item future" key={c}>• {c}</div>)}
                  </div>
                )}
              </div>
            )}

            {s.note && <div className="mc-note">{s.note}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}