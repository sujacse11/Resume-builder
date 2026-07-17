import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* bg glow */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📄</div>
            <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 22, color: 'var(--text-primary)' }}>ResumeAI</span>
          </Link>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 12 }}>Welcome back! Sign in to your account.</p>
        </div>

        <div className="glass-card" style={{ padding: '36px 32px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 18 }}>
              <label className="form-label">Email or Username</label>
              <input
                id="login-username"
                className="form-input"
                placeholder="you@email.com"
                value={form.username}
                onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                required
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="form-label">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--error-bg)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--error)', fontSize: 13, marginBottom: 18 }}>
                ⚠ {error}
              </div>
            )}

            <button id="login-submit" type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 12 }}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="ai-pulse">⏳</span> Signing in…
                </span>
              ) : 'Sign In →'}
            </button>
          </form>

          <div className="divider" style={{ margin: '24px 0' }} />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-bright)', fontWeight: 600, textDecoration: 'none' }}>
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
