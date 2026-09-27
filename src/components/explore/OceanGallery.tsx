import { useCallback, useEffect, useRef, useState } from 'react';
import type { MenuOption } from '../../data/menuContent';
import { BackButton } from '../menu/BackButton';
import './OceanGallery.css';

const VIDEO_SRC = `${import.meta.env.BASE_URL}ocean_video.mp4`;

interface Props {
  option: MenuOption;
}

export function OceanGallery({ option }: Props) {
  const [theater, setTheater] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const exitTheater = useCallback(() => {
    setTheater(false);
    videoRef.current?.pause();
  }, []);

  useEffect(() => {
    if (!theater) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exitTheater();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [theater, exitTheater]);

  return (
    <div className="menu-content-view ocean-gallery">
      <div className="menu-content-header">
        <div className="menu-content-title">
          <span className="menu-content-icon">{option.icon}</span>
          <div>
            <div className="menu-content-label">{option.label}</div>
            <div className="menu-content-ctx">Explore the Deep · Ocean Gallery</div>
          </div>
        </div>
        <BackButton />
      </div>

      <div className="menu-content-body">
        <div className="mc-section og-hero">
          <h4 className="mc-heading">Ocean Gallery</h4>
          <p className="mc-paragraph">
            Project-related ocean, device, deployment and prototype visuals.
            Click the video below to play it.
          </p>

          <div className={`og-inline${theater ? ' theater' : ''}`}>
            <div className="og-inline-top">
              <div className="og-inline-label">
                {theater ? '🌊 OCEAN VIDEO — full view · ESC to exit' : 'INLINE PREVIEW — plays on click'}
              </div>
              {theater ? (
                <button type="button" className="og-theater-btn" onClick={exitTheater} aria-label="Exit full view">
                  ✕ Exit full view
                </button>
              ) : (
                <button
                  type="button"
                  className="og-theater-btn"
                  onClick={() => {
                    setTheater(true);
                    videoRef.current?.play().catch(() => {});
                  }}
                >
                  ⛶ Full view
                </button>
              )}
            </div>
            {videoError ? (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                Video unavailable. Please check the connection.
              </div>
            ) : (
              <video
                ref={videoRef}
                className="og-player"
                src={VIDEO_SRC}
                controls
                preload="none"
                poster={`${import.meta.env.BASE_URL}depth-profile-bg.png`}
                playsInline
                onPlay={() => setTheater(true)}
                onError={() => setVideoError(true)}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        </div>

        {option.sections?.map((s, i) => (
          <div className={`mc-section${s.accent ? ' mc-accent' : ''}`} key={i}>
            {s.heading && <h4 className="mc-heading">{s.heading}</h4>}
            {s.paragraph && <p className="mc-paragraph">{s.paragraph}</p>}
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
