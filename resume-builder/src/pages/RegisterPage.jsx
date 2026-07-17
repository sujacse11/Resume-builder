import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', email: '', password: '', password2: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.password2) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const errs = err.response?.data;
      if (errs) {
        const msgs = Object.values(errs).flat().join(' ');
        setError(msgs);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({ value: form[field], onChange: e => setForm(p => ({ ...p, [field]: e.target.value }) ) });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📄</div>
            <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 22, color: 'var(--text-primary)' }}>ResumeAI</span>
          </Link>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginTop: 12 }}>Create your free account to get started.</p>
        </div>

        <div className="glass-card" style={{ padding: '36px 32px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label className="form-label">First Name</label>
                <input id="reg-first-name" className="form-input" placeholder="Jane" {...f('first_name')} />
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input id="reg-last-name" className="form-input" placeholder="Smith" {...f('last_name')} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Username</label>
              <input id="reg-username" className="form-input" placeholder="janesmith" {...f('username')} required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Email</label>
              <input id="reg-email" type="email" className="form-input" placeholder="jane@email.com" {...f('email')} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div>
                <label className="form-label">Password</label>
                <input id="reg-password" type="password" className="form-input" placeholder="Min 6 chars" {...f('password')} required />
              </div>
              <div>
                <label className="form-label">Confirm Password</label>
                <input id="reg-password2" type="password" className="form-input" placeholder="Repeat" {...f('password2')} required />
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--error-bg)', border: '1px solid rgba(248,113,113,0.25)', color: 'var(--error)', fontSize: 13, marginBottom: 18 }}>
                ⚠ {error}
              </div>
            )}

            <button id="reg-submit" type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, borderRadius: 12 }}>
              {loading ? <span className="ai-pulse">Creating account…</span> : 'Create Account →'}
            </button>
          </form>

          <div className="divider" style={{ margin: '24px 0' }} />

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent-bright)', fontWeight: 600, textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
