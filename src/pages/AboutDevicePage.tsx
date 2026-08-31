import { useNavigate } from 'react-router-dom';
import AboutDevice from './AboutDevice';

export default function AboutDevicePage() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.5px' }}
          >
            &#9664; HOME
          </span>
          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '1px', color: 'var(--text-primary)' }}>
            UNDERWATER INTELLIGENCE
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '6px 16px', fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
              color: 'var(--text-secondary)', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
            }}
          >
            DASHBOARD
          </button>
          <button
            onClick={() => navigate('/login')}
            style={{
              padding: '6px 16px', fontSize: 10, fontWeight: 600, letterSpacing: '0.5px',
              color: 'var(--text-secondary)', background: 'transparent',
              border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer',
            }}
          >
            LOGIN
          </button>
        </div>
      </header>

      <main style={{ padding: '20px' }}>
        <AboutDevice />
      </main>
    </div>
  );
}
