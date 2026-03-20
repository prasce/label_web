import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberUser, setRememberUser] = useState(false);
  const [rememberPass, setRememberPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 註冊彈窗狀態
  const [showRegister, setShowRegister] = useState(false);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('saved_username') || '';
    const savedPass = localStorage.getItem('saved_password') || '';
    if (savedUser) { setUsername(savedUser); setRememberUser(true); }
    if (savedPass) { setPassword(savedPass); setRememberPass(true); }
  }, []);

  async function handleSubmit(e: React.SyntheticEvent) {
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

  function openRegister() {
    setRegUsername('');
    setRegPassword('');
    setRegConfirm('');
    setRegError('');
    setRegSuccess('');
    setShowRegister(true);
  }

  function closeRegister() {
    setShowRegister(false);
  }

  async function handleRegister(e: React.SyntheticEvent) {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');
    if (regPassword !== regConfirm) {
      setRegError('兩次密碼輸入不一致');
      return;
    }
    setRegLoading(true);
    try {
      await register(regUsername, regPassword);
      setRegSuccess('註冊成功！請使用新帳號登入。');
      setTimeout(() => {
        setShowRegister(false);
        setUsername(regUsername);
        setPassword('');
      }, 1500);
    } catch (err: any) {
      setRegError(err.response?.data?.error || '註冊失敗，請稍後再試');
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div style={s.page}>
      {/* ── 左側漸層面板 ── */}
      <div style={s.left}>
        <div style={s.logo}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M4 28 L16 4 L28 28 Z" fill="rgba(255,255,255,0.9)" />
            <path d="M10 28 L16 16 L22 28 Z" fill="rgba(255,255,255,0.5)" />
          </svg>
        </div>
        <div style={s.bubble1} />
        <div style={s.bubble2} />
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

            <button type="button" style={s.registerLink} onClick={openRegister}>
              Register
            </button>
          </div>

          <button type="submit" style={s.btn} disabled={loading}>
            {loading ? 'Loading...' : 'Login'}
          </button>
        </form>
      </div>

      {/* ── 註冊彈窗 ── */}
      {showRegister && (
        <div style={s.overlay} onClick={closeRegister}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            {/* 標題列 */}
            <div style={s.modalHeader}>
              <h3 style={s.modalTitle}>建立帳號</h3>
              <button type="button" style={s.closeBtn} onClick={closeRegister}>✕</button>
            </div>

            {regError   && <div style={s.error}>{regError}</div>}
            {regSuccess && <div style={s.success}>{regSuccess}</div>}

            <form onSubmit={handleRegister} style={s.modalForm}>
              <div style={s.field}>
                <label style={s.fieldLabel}>帳號</label>
                <input
                  style={s.fieldInput}
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="請輸入帳號"
                  autoFocus
                  required
                />
              </div>

              <div style={s.field}>
                <label style={s.fieldLabel}>密碼 <span style={s.hint}>(至少 6 字元)</span></label>
                <input
                  style={s.fieldInput}
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  required
                />
              </div>

              <div style={s.field}>
                <label style={s.fieldLabel}>確認密碼</label>
                <input
                  style={{
                    ...s.fieldInput,
                    borderColor: regConfirm && regConfirm !== regPassword ? '#ef4444' : undefined,
                  }}
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="再次輸入密碼"
                  required
                />
                {regConfirm && regConfirm !== regPassword && (
                  <span style={s.fieldError}>密碼不一致</span>
                )}
              </div>

              <div style={s.modalBtns}>
                <button type="button" style={s.cancelBtn} onClick={closeRegister}>
                  取消
                </button>
                <button type="submit" style={s.submitBtn} disabled={regLoading}>
                  {regLoading ? '處理中...' : '確認註冊'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  success: {
    background: '#f0fdf4',
    color: '#16a34a',
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
  registerLink: {
    background: 'none',
    border: 'none',
    color: PURPLE,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    padding: 0,
    textDecoration: 'underline',
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
    width: '100%',
  },

  /* 彈窗 */
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    background: '#fff',
    borderRadius: 16,
    padding: '28px 32px 32px',
    width: 420,
    boxShadow: '0 8px 40px rgba(0,0,0,0.22)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: 18,
    color: '#9ca3af',
    cursor: 'pointer',
    lineHeight: 1,
    padding: '2px 6px',
    borderRadius: 6,
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 16,
  },
  fieldLabel: {
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    color: '#374151',
    marginBottom: 6,
  },
  hint: {
    fontWeight: 400,
    color: '#9ca3af',
    fontSize: 12,
  },
  fieldInput: {
    display: 'block',
    width: '100%',
    boxSizing: 'border-box' as const,
    padding: '11px 14px',
    border: '1.5px solid #e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    color: '#111827',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  fieldError: {
    marginTop: 4,
    fontSize: 12,
    color: '#ef4444',
  },
  modalBtns: {
    display: 'flex',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: '12px 0',
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    flex: 2,
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
