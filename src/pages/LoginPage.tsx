import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './LoginPage.css';

const DEFAULT_USERNAME = 'THAILAND';
const DEFAULT_PASSWORD = 'kaviyarasu';

function getStoredCredentials() {
  const stored = localStorage.getItem('signupCredentials');
  if (stored) {
    try { return JSON.parse(stored); } catch { return null; }
  }
  return null;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSignup = searchParams.get('mode') === 'signup';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isSignup) {
      if (!username.trim() || !password.trim()) {
        setError('Please fill in all fields');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 4) {
        setError('Password must be at least 4 characters');
        return;
      }
      const existing = getStoredCredentials();
      if (existing && existing.username === username) {
        setError('Username already exists');
        return;
      }
      localStorage.setItem('signupCredentials', JSON.stringify({ username, password }));
      setSuccess('Account created! You can now login.');
      setTimeout(() => navigate('/login'), 1500);
    } else {
      const stored = getStoredCredentials();
      const validUser = stored && stored.username === username && stored.password === password;
      const isDefault = username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD;

      if (validUser || isDefault) {
        sessionStorage.setItem('authenticated', 'true');
        navigate('/dashboard');
      } else {
        setError('Invalid username or password');
      }
    }
  };

  return (
    <div className="login-page">
      <button className="login-back" onClick={() => navigate('/')}>BACK</button>
      <div className="login-bg" />

      <svg className="login-lines" viewBox="0 0 1540 900" fill="none">
        <line x1="180" y1="200" x2="400" y2="350" stroke="rgba(0,229,255,0.1)" strokeWidth="1" />
        <line x1="400" y1="350" x2="600" y2="250" stroke="rgba(0,229,255,0.08)" strokeWidth="1" />
        <line x1="180" y1="200" x2="350" y2="550" stroke="rgba(0,229,255,0.07)" strokeWidth="1" />
        <line x1="350" y1="550" x2="500" y2="480" stroke="rgba(0,229,255,0.06)" strokeWidth="1" />
        <line x1="600" y1="250" x2="700" y2="400" stroke="rgba(0,229,255,0.06)" strokeWidth="1" />
        <line x1="400" y1="350" x2="500" y2="480" stroke="rgba(0,229,255,0.08)" strokeWidth="1" />
        <line x1="120" y1="600" x2="350" y2="550" stroke="rgba(0,229,255,0.05)" strokeWidth="1" />
      </svg>

      <div className="login-nodes">
        <div className="login-node" style={{ top: '14%', left: '8%' }}>
          <div className="login-node-dot" />
          <span className="login-node-label">SURFACE GATEWAY</span>
          <span className="login-node-id">ID: SG-01</span>
          <span className="login-node-status">STATUS: ONLINE</span>
        </div>
        <div className="login-node" style={{ top: '28%', left: '38%' }}>
          <div className="login-node-dot" />
          <span className="login-node-label">ACOUSTIC RELAY NODE</span>
          <span className="login-node-id">ID: AR-07</span>
          <span className="login-node-id">DEPTH: 890m</span>
          <span className="login-node-status">STATUS: ONLINE</span>
        </div>
        <div className="login-node" style={{ top: '52%', left: '12%' }}>
          <div className="login-node-dot" />
          <span className="login-node-label">SENSOR NODE</span>
          <span className="login-node-id">ID: SN-247</span>
          <span className="login-node-id">DEPTH: 1280m</span>
          <span className="login-node-status">STATUS: ONLINE</span>
        </div>
        <div className="login-node" style={{ top: '58%', left: '36%' }}>
          <div className="login-node-dot" />
          <span className="login-node-label">AUTONOMOUS VEHICLE</span>
          <span className="login-node-id">ID: AV-12</span>
          <span className="login-node-id">DEPTH: 1050m</span>
          <span className="login-node-status">STATUS: ONLINE</span>
        </div>
        <div className="login-node" style={{ top: '72%', left: '42%' }}>
          <div className="login-node-dot" />
          <span className="login-node-label">MONITORING NODE</span>
          <span className="login-node-id">ID: MN-04</span>
          <span className="login-node-id">DEPTH: 2650m</span>
          <span className="login-node-status">STATUS: ONLINE</span>
        </div>
      </div>

      <div className="login-card-wrapper">
        <div className="login-card">
          <div className="login-icon">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="14" y="24" width="20" height="10" rx="5" stroke="#00e5ff" strokeWidth="2" fill="none" />
              <circle cx="24" cy="29" r="2" fill="#00e5ff" />
              <path d="M16 24 C16 18 20 14 24 14 C28 14 32 18 32 24" stroke="#00e5ff" strokeWidth="1.5" fill="none" />
              <line x1="24" y1="14" x2="24" y2="8" stroke="#00e5ff" strokeWidth="1.5" />
              <circle cx="24" cy="6" r="2" fill="none" stroke="#00e5ff" strokeWidth="1.5" />
              <path d="M18 8 C18 5 21 3 24 3 C27 3 30 5 30 8" stroke="#00e5ff" strokeWidth="1" fill="none" opacity="0.5" />
            </svg>
          </div>

          <h1 className="login-title">UNDERWATER<br />INTELLIGENCE</h1>
          <p className="login-subtitle">Deep Ocean Acoustic Communication Network</p>

          <form onSubmit={handleSubmit}>
            <p className="login-secure">
              {isSignup ? 'Create a new account to access the network' : 'Secure Access to Deep Ocean Communication Network'}
            </p>

            <div className="login-field">
              <span className="login-field-icon">&#9787;</span>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); setSuccess(''); }}
              />
            </div>

            <div className="login-field">
              <span className="login-field-icon">&#128274;</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); setSuccess(''); }}
              />
              <button type="button" className="login-eye" onClick={() => setShowPassword(!showPassword)}>
                &#128065;
              </button>
            </div>

            {isSignup && (
              <div className="login-field">
                <span className="login-field-icon">&#128274;</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); setSuccess(''); }}
                />
              </div>
            )}

            {error && <p className="login-error">{error}</p>}
            {success && <p className="login-success">{success}</p>}

            {!isSignup && (
              <div className="login-options">
                <label className="login-remember">
                  <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
                  Remember me
                </label>
                <a href="#" className="login-forgot">Forgot password?</a>
              </div>
            )}

            <button type="submit" className="login-submit">{isSignup ? 'CREATE ACCOUNT' : 'LOGIN'}</button>

            <div className="login-switch">
              {isSignup ? (
                <>Already have an account? <span onClick={() => navigate('/login')}>Login</span></>
              ) : (
                <>Don't have an account? <span onClick={() => navigate('/login?mode=signup')}>Sign Up</span></>
              )}
            </div>

            <div className="login-status">
              <span className="login-status-item">
                <span className="login-status-dot" />
                SYSTEM SECURITY ACTIVE
              </span>
              <span className="login-status-divider" />
              <span className="login-status-item">
                <span className="login-status-dot" />
                NETWORK ONLINE
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
