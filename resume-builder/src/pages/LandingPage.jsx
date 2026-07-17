import { Link } from 'react-router-dom';

const features = [
  { icon: '✨', title: 'AI Summary Generator', desc: 'Generate compelling professional summaries with one click using Google Gemini AI.' },
  { icon: '🎯', title: 'ATS Score Checker', desc: 'Instantly analyze your resume against job descriptions and get optimization tips.' },
  { icon: '💡', title: 'Smart Skill Suggestions', desc: 'AI recommends the most relevant skills for your target role automatically.' },
  { icon: '⚡', title: 'Bullet Point Enhancer', desc: 'Transform weak job descriptions into impactful, action-oriented achievements.' },
  { icon: '🎨', title: '3 Premium Templates', desc: 'Choose from Modern, Classic, and Minimal designs to match your style.' },
  { icon: '☁️', title: 'Cloud Storage', desc: 'Your resumes are saved securely and accessible from any device.' },
];

const templates = [
  { name: 'Modern', color: 'linear-gradient(135deg,#6366f1,#8b5cf6)', desc: 'Bold & Contemporary' },
  { name: 'Classic', color: 'linear-gradient(135deg,#1e3a5f,#2d6a9f)', desc: 'Traditional & Formal' },
  { name: 'Minimal', color: 'linear-gradient(135deg,#374151,#6b7280)', desc: 'Clean & Simple' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📄</div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: 'var(--text-primary)' }}>ResumeAI</span>
          <span className="badge badge-purple">✦ AI Powered</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/login" className="btn-ghost">Sign In</Link>
          <Link to="/register" className="btn-primary">Get Started Free →</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', padding: '100px 24px 80px', textAlign: 'center', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: 780, margin: '0 auto' }}>
          <div className="badge badge-purple" style={{ marginBottom: 24, fontSize: 13 }}>
            ✦ AI-Powered Resume Builder
          </div>

          <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 'clamp(42px, 6vw, 72px)', fontWeight: 800, lineHeight: 1.1, color: 'var(--text-primary)', marginBottom: 24 }}>
            Build Resumes That{' '}
            <span style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Get You Hired
            </span>
          </h1>

          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Leverage the power of AI to craft professional resumes tailored to any job. Beat ATS filters and stand out from the crowd.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/register" className="btn-primary" style={{ padding: '14px 32px', fontSize: 16, borderRadius: 14 }}>
              Create My Resume → 
            </Link>
            <Link to="/login" className="btn-secondary" style={{ padding: '14px 32px', fontSize: 16, borderRadius: 14 }}>
              Sign In
            </Link>
          </div>

          <p style={{ marginTop: 20, fontSize: 13, color: 'var(--text-muted)' }}>
            ✓ Free to use &nbsp;·&nbsp; ✓ No credit card &nbsp;·&nbsp; ✓ AI-powered
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{ maxWidth: 700, margin: '0 auto 80px', padding: '24px', background: 'var(--bg-card)', borderRadius: 20, border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
        {[['10K+', 'Resumes Created'], ['95%', 'ATS Pass Rate'], ['3', 'Pro Templates']].map(([n, l]) => (
          <div key={l} style={{ textAlign: 'center', padding: '8px 16px' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--accent-bright)', fontFamily: "'Plus Jakarta Sans'" }}>{n}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <section style={{ maxWidth: 1100, margin: '0 auto 100px', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
            Everything You Need to Succeed
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
            Powerful AI features combined with beautiful design to make your resume shine.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {features.map((f) => (
            <div key={f.title} className="glass-card" style={{ padding: 28, transition: 'transform 0.2s ease', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Templates section */}
      <section style={{ background: 'var(--bg-secondary)', padding: '80px 24px', marginBottom: 0 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14 }}>
            3 Professional Templates
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 48 }}>Choose the style that best represents you</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {templates.map((t) => (
              <div key={t.name} style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <div style={{ height: 120, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 20px', color: '#fff', fontWeight: 600, fontSize: 14 }}>{t.name}</div>
                </div>
                <div style={{ padding: '16px 20px' }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 24px', textAlign: 'center', background: 'var(--bg-base)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16 }}>
            Ready to Land Your Dream Job?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, marginBottom: 36 }}>
            Join thousands of professionals who trust ResumeAI to craft their perfect resume.
          </p>
          <Link to="/register" className="btn-primary" style={{ padding: '16px 40px', fontSize: 16, borderRadius: 16 }}>
            Start Building For Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        © 2025 ResumeAI · Built with React + Django
      </footer>
    </div>
  );
}
