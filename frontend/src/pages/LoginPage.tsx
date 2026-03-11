import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberUser, setRememberUser] = useState(false);
  const [rememberPass, setRememberPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('saved_username') || '';
    const savedPass = localStorage.getItem('saved_password') || '';
    if (savedUser) { setUsername(savedUser); setRememberUser(true); }
    if (savedPass) { setPassword(savedPass); setRememberPass(true); }
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      if (rememberUser) localStorage.setItem('saved_username', username);
      else localStorage.removeItem('saved_username');
      if (rememberPass) localStorage.setItem('saved_password', password);
      else localStorage.removeItem('saved_password');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '登入失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      {/* ── 左側漸層面板 ── */}
      <div style={s.left}>
        {/* Logo */}
        <div style={s.logo}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 28 L16 4 L28 28 Z" fill="rgba(255,255,255,0.9)" />
            <path d="M10 28 L16 16 L22 28 Z" fill="rgba(255,255,255,0.5)" />
          </svg>
        </div>
        {/* 裝飾泡泡 */}
        <div style={s.bubble1} />
        <div style={s.bubble2} />
        {/* 歡迎文字 */}
        <div style={s.welcome}>
          <span style={s.welcomeText}>Welcome</span>
          <span style={s.welcomeText}>Back!</span>
        </div>
      </div>

      {/* ── 右側表單 ── */}
      <div style={s.right}>
        <form onSubmit={handleSubmit} style={s.form}>
          <h2 style={s.title}>Login</h2>
          <p style={s.subtitle}>歡迎回來！請登入您的帳號。</p>

          {error && <div style={s.error}>{error}</div>}

          <label style={s.label}>User Name</label>
          <input
            style={s.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            autoFocus
            required
          />

          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />

          <div style={s.row}>
            <label style={s.checkRow}>
              <input
                type="checkbox"
                style={s.checkbox}
                checked={rememberUser && rememberPass}
                onChange={(e) => {
                  setRememberUser(e.target.checked);
                  setRememberPass(e.target.checked);
                }}
              />
              <span style={s.checkLabel}>Remember Me</span>
            </label>
          </div>

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

const PURPLE = '#7c3aed';
const GRADIENT = 'linear-gradient(135deg, #f0a07a 0%, #c084fc 40%, #7c3aed 100%)';

const s: Record<string, React.CSSProperties> = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
  },

  /* 左側 */
  left: {
    position: 'relative',
    width: 380,
    minHeight: 480,
    background: GRADIENT,
    borderRadius: '16px 0 0 16px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'flex-end',
    padding: '32px 40px',
  },
  logo: {
    position: 'absolute',
    top: 24,
    left: 24,
  },
  bubble1: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.15)',
    top: -60,
    right: -80,
  },
  bubble2: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    bottom: 40,
    left: -60,
  },
  welcome: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.1,
  },
  welcomeText: {
    fontSize: 44,
    fontWeight: 800,
    color: '#fff',
    letterSpacing: '-1px',
  },

  /* 右側 */
  right: {
    width: 380,
    minHeight: 480,
    background: '#fff',
    borderRadius: '0 16px 16px 0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '4px 4px 24px rgba(0,0,0,0.12)',
  },
  form: {
    width: '100%',
    padding: '40px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  title: {
    margin: '0 0 4px',
    fontSize: 28,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  subtitle: {
    margin: '0 0 12px',
    fontSize: 13,
    color: '#9ca3af',
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '8px 12px',
    borderRadius: 8,
    fontSize: 13,
  },
  label: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 2,
  },
  input: {
    padding: '11px 14px',
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s',
    marginBottom: 4,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  checkRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    cursor: 'pointer',
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: PURPLE,
    cursor: 'pointer',
  },
  checkLabel: {
    fontSize: 13,
    color: '#6b7280',
    userSelect: 'none',
  },
  btn: {
    marginTop: 16,
    padding: '12px 0',
    background: PURPLE,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '0.5px',
  },
};
