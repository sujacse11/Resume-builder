import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getResumes, createResume, deleteResume, duplicateResume } from '../services/api';

function ResumeCard({ resume, onDelete, onDuplicate, onOpen }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const templateColors = {
    modern: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    classic: 'linear-gradient(135deg,#1e3a5f,#2d6a9f)',
    minimal: 'linear-gradient(135deg,#374151,#6b7280)',
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="glass-card" style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
      {/* Template preview strip */}
      <div style={{ height: 100, background: templateColors[resume.template] || templateColors.modern, position: 'relative', display: 'flex', alignItems: 'flex-end', padding: '12px 16px' }} onClick={onOpen}>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '4px 10px', color: '#fff', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {resume.template}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '16px 18px' }} onClick={onOpen}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{resume.title}</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{resume.full_name || 'No name set'}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Updated {fmtDate(resume.updated_at)}</p>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 18px 16px', display: 'flex', gap: 8 }}>
        <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: 12 }} onClick={onOpen}>
          ✏️ Edit
        </button>
        <button className="btn-secondary" style={{ padding: '8px 12px', fontSize: 12 }} onClick={e => { e.stopPropagation(); onDuplicate(); }}>📋</button>
        <button className="btn-danger" style={{ padding: '8px 12px', fontSize: 12 }} onClick={e => { e.stopPropagation(); onDelete(); }}>🗑</button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTemplate, setNewTemplate] = useState('modern');
  const [toast, setToast] = useState(null);

  useEffect(() => { fetchResumes(); }, []);

  const fetchResumes = async () => {
    try {
      const { data } = await getResumes();
      setResumes(data);
    } catch { showToast('Failed to load resumes', 'error'); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { data } = await createResume({ title: newTitle, template: newTemplate });
      navigate(`/builder/${data.id}`);
    } catch { showToast('Failed to create resume', 'error'); setCreating(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resume? This cannot be undone.')) return;
    try {
      await deleteResume(id);
      setResumes(prev => prev.filter(r => r.id !== id));
      showToast('Resume deleted');
    } catch { showToast('Delete failed', 'error'); }
  };

  const handleDuplicate = async (id) => {
    try {
      const { data } = await duplicateResume(id);
      setResumes(prev => [data, ...prev]);
      showToast('Resume duplicated!');
    } catch { showToast('Duplicate failed', 'error'); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📄</div>
            <span style={{ fontFamily: "'Plus Jakarta Sans'", fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>ResumeAI</span>
          </Link>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>👋 {user?.first_name || user?.username}</div>
          <button className="btn-ghost" onClick={logout} style={{ fontSize: 13 }}>Sign Out</button>
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
              My Resumes
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{resumes.length} resume{resumes.length !== 1 ? 's' : ''} in your account</p>
          </div>
          <button id="create-resume-btn" className="btn-primary" style={{ padding: '12px 24px', fontSize: 15 }} onClick={() => { setShowModal(true); setNewTitle(''); setNewTemplate('modern'); }}>
            ✦ New Resume
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {[1,2,3].map(i => (
              <div key={i} className="glass-card" style={{ overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 100 }} />
                <div style={{ padding: 18 }}>
                  <div className="skeleton" style={{ height: 18, width: '70%', marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 14, width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : resumes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 24px' }}>
            <div style={{ fontSize: 60, marginBottom: 24 }}>📝</div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>No resumes yet</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>Create your first AI-powered resume in minutes.</p>
            <button className="btn-primary" style={{ padding: '12px 28px', fontSize: 15 }} onClick={() => setShowModal(true)}>
              ✦ Create First Resume
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {resumes.map(r => (
              <ResumeCard
                key={r.id}
                resume={r}
                onOpen={() => navigate(`/builder/${r.id}`)}
                onDelete={() => handleDelete(r.id)}
                onDuplicate={() => handleDuplicate(r.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }} onClick={() => setShowModal(false)}>
          <div className="glass-card-strong" style={{ width: '100%', maxWidth: 440, padding: '32px' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans'", fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 24 }}>
              Create New Resume
            </h2>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Resume Title</label>
              <input id="new-resume-title" className="form-input" placeholder="e.g. Software Engineer Resume" value={newTitle} onChange={e => setNewTitle(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label className="form-label">Template</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {['modern', 'classic', 'minimal'].map(t => (
                  <button key={t} className={`template-btn ${newTemplate === t ? 'active' : ''}`} onClick={() => setNewTemplate(t)} style={{ flex: 1, textTransform: 'capitalize' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button id="create-resume-confirm" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={!newTitle.trim() || creating} onClick={handleCreate}>
                {creating ? <span className="ai-pulse">Creating…</span> : '✦ Create Resume'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '❌'}</span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
