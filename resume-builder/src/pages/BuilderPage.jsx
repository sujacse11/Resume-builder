import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import jsPDF from 'jspdf';
import {
  getResume, updateResume,
  getExperiences, createExperience, updateExperience, deleteExperience,
  getEducations, createEducation, updateEducation, deleteEducation,
  getSkills, createSkill, deleteSkill,
  getProjects, createProject, updateProject, deleteProject,
  getCertifications, createCertification, updateCertification, deleteCertification,
  getLanguages, createLanguage, deleteLanguage,
  getVolunteer, createVolunteer, updateVolunteer, deleteVolunteer,
  getAwards, createAward, updateAward, deleteAward,
  aiSummary, aiSkills, aiEnhanceBullet, aiATSScore,
  aiCoverLetter, aiJobTitles, aiResumeReview,
} from '../services/api';
import ModernTemplate from '../components/Templates/ModernTemplate';
import ClassicTemplate from '../components/Templates/ClassicTemplate';
import MinimalTemplate from '../components/Templates/MinimalTemplate';

const uid = () => Date.now() + Math.random();
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// ── Completeness calculator ───────────────────────────────────────────────────
function calcCompleteness(resume, experiences, educations, skills, projects, certs, languages, volunteer) {
  let score = 0;
  if (resume?.full_name) score += 8;
  if (resume?.email) score += 6;
  if (resume?.phone) score += 4;
  if (resume?.location) score += 4;
  if (resume?.linkedin) score += 4;
  if (resume?.github) score += 4;
  if (resume?.summary?.length > 50) score += 12;
  if (experiences.some(e => e.job_title && e.description?.length > 30)) score += 18;
  if (educations.some(e => e.school_name)) score += 12;
  if (skills.length >= 5) score += 12;
  else if (skills.length > 0) score += 6;
  if (projects.some(p => p.name)) score += 8;
  if (certs.some(c => c.name)) score += 4;
  if (languages.length > 0) score += 2;
  if (volunteer.some(v => v.organization)) score += 2;
  return Math.min(100, score);
}

function CompletenessBar({ score }) {
  const color = score >= 80 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171';
  const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work';
  return (
    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid var(--border)', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Resume Complete</span>
        <span style={{ fontSize: 13, fontWeight: 800, color }}>{score}%</span>
      </div>
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${score}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }} />
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{label}</p>
    </div>
  );
}

function SectionHeader({ icon, title, badge }) {
  return (
    <div className="section-header">
      <div className="section-icon">{icon}</div>
      <h3>{title}</h3>
      {badge && <span className="badge badge-purple" style={{ marginLeft: 'auto' }}>{badge}</span>}
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  return (
    <div className={`toast ${type}`}>
      <span>{type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>{msg}</span>
    </div>
  );
}

function ATSPanel({ score, breakdown, keywords, suggestions }) {
  const color = score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warning)' : 'var(--error)';
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 20 }}>
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color, fontFamily: "'Plus Jakarta Sans'" }}>{score}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>ATS Score</div>
        </div>
        <div style={{ flex: 1 }}>
          {Object.entries(breakdown || {}).map(([k, v]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{k}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600 }}>{v}%</span>
              </div>
              <div className="score-bar-track"><div className="score-bar-fill" style={{ width: `${v}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      {keywords?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: 'var(--text-accent)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>✓ Matched Keywords</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {keywords.map(k => <span key={k} className="badge badge-green">{k}</span>)}
          </div>
        </div>
      )}
      {suggestions?.length > 0 && (
        <div>
          <p style={{ fontSize: 11, color: 'var(--text-accent)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>💡 Suggestions</p>
          <ul style={{ paddingLeft: 16, listStyle: 'none' }}>
            {suggestions.map((s, i) => <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.55, paddingLeft: 4 }}>→ {s}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReviewPanel({ data }) {
  const scoreColor = data.overall_score >= 75 ? '#34d399' : data.overall_score >= 50 ? '#fbbf24' : '#f87171';
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.03)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, fontWeight: 900, color: scoreColor, fontFamily: "'Plus Jakarta Sans'" }}>{data.overall_score}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quality Score</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {data.tone && <span className="badge badge-blue">Tone: {data.tone}</span>}
          {data.word_count_rating && <span className="badge badge-purple">Length: {data.word_count_rating?.replace(/_/g,' ')}</span>}
          {data.missing_sections?.map(s => <span key={s} className="badge badge-orange">Missing: {s}</span>)}
        </div>
      </div>
      {data.strengths?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>✦ Strengths</p>
          {data.strengths.map((s, i) => (
            <div key={i} className="review-strength">
              <span style={{ color: 'var(--success)', fontSize: 16 }}>✓</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      )}
      {data.improvements?.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--warning)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>⚡ Improvements</p>
          {data.improvements.map((s, i) => (
            <div key={i} className="review-improve">
              <span style={{ color: 'var(--warning)', fontSize: 16 }}>→</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function BuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resume, setResume] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [educations, setEducations] = useState([]);
  const [skills, setSkills] = useState([]);
  const [projects, setProjects] = useState([]);
  const [certs, setCerts] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [volunteer, setVolunteer] = useState([]);
  const [awards, setAwards] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');
  const [toast, setToast] = useState(null);

  // AI states
  const [summaryInput, setSummaryInput] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [roleInput, setRoleInput] = useState('software developer');
  const [enhancing, setEnhancing] = useState({});
  const [atsJD, setAtsJD] = useState('');
  const [atsResult, setAtsResult] = useState(null);
  const [atsLoading, setAtsLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverJD, setCoverJD] = useState('');
  const [coverCompany, setCoverCompany] = useState('');
  const [coverPosition, setCoverPosition] = useState('');
  const [coverResult, setCoverResult] = useState('');
  const [jobTitles, setJobTitles] = useState([]);
  const [jobTitleLoading, setJobTitleLoading] = useState(false);
  const [reviewResult, setReviewResult] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Load all data
  useEffect(() => {
    Promise.all([
      getResume(id), getExperiences(id), getEducations(id),
      getSkills(id), getProjects(id), getCertifications(id),
      getLanguages(id), getVolunteer(id), getAwards(id),
    ]).then(([r, ex, ed, sk, pr, ce, la, vo, aw]) => {
      setResume(r.data);
      setExperiences(ex.data.length ? ex.data : [newExp()]);
      setEducations(ed.data.length ? ed.data : [newEdu()]);
      setSkills(sk.data);
      setProjects(pr.data);
      setCerts(ce.data);
      setLanguages(la.data);
      setVolunteer(vo.data);
      setAwards(aw.data);
    }).catch(() => showToast('Failed to load resume', 'error'))
      .finally(() => setLoading(false));
  }, [id]);

  const saveDebounced = useCallback(debounce(async (data) => {
    setSaving(true);
    try { await updateResume(id, data); }
    catch { showToast('Auto-save failed', 'error'); }
    finally { setSaving(false); }
  }, 1200), [id]);

  const updateField = (field, value) => {
    const updated = { ...resume, [field]: value };
    setResume(updated);
    saveDebounced(updated);
  };

  // ── Section item factories ──────────────────────────────────────────────────
  const newExp = () => ({ _local: uid(), job_title: '', company: '', location: '', start_date: '', end_date: '', current: false, description: '', order: 0 });
  const newEdu = () => ({ _local: uid(), school_name: '', degree: '', field_of_study: '', gpa: '', start_date: '', graduation_year: '', order: 0 });
  const newProj = () => ({ _local: uid(), name: '', description: '', tech_stack: '', github_url: '', live_url: '', order: 0 });
  const newCert = () => ({ _local: uid(), name: '', issuer: '', issue_date: '', credential_url: '', order: 0 });
  const newLang = () => ({ _local: uid(), name: '', proficiency: 'intermediate' });
  const newVol = () => ({ _local: uid(), organization: '', role: '', start_date: '', end_date: '', current: false, description: '' });
  const newAward = () => ({ _local: uid(), title: '', issuer: '', date: '', description: '' });

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // ── Generic section helpers ─────────────────────────────────────────────────
  const makeSectionHandlers = (state, setState, createFn, updateFn, deleteFn) => ({
    add: (template) => setState(p => [...p, template]),
    remove: async (item, idx) => {
      if (item.id) { try { await deleteFn(item.id); } catch {} }
      setState(p => p.filter((_, i) => i !== idx));
    },
    change: (idx, field, val) => setState(p => p.map((e, i) => i === idx ? { ...e, [field]: val } : e)),
    save: async (item, idx) => {
      try {
        if (item.id) {
          const { data } = await updateFn(item.id, item);
          setState(p => p.map((e, i) => i === idx ? data : e));
        } else {
          const { data } = await createFn(id, item);
          setState(p => p.map((e, i) => i === idx ? data : e));
        }
        showToast('Saved! ✓');
      } catch { showToast('Save failed', 'error'); }
    },
  });

  const expH = makeSectionHandlers(experiences, setExperiences, createExperience, updateExperience, deleteExperience);
  const eduH = makeSectionHandlers(educations, setEducations, createEducation, updateEducation, deleteEducation);
  const projH = makeSectionHandlers(projects, setProjects, createProject, updateProject, deleteProject);
  const certH = makeSectionHandlers(certs, setCerts, createCertification, updateCertification, deleteCertification);
  const volH = makeSectionHandlers(volunteer, setVolunteer, createVolunteer, updateVolunteer, deleteVolunteer);
  const awardH = makeSectionHandlers(awards, setAwards, createAward, updateAward, deleteAward);

  // Skills special (no update, just create/delete)
  const addSkill = async (name) => {
    if (!name.trim() || skills.find(s => s.name === name)) return;
    try { const { data } = await createSkill(id, { name, category: 'technical' }); setSkills(p => [...p, data]); setSkillInput(''); }
    catch { showToast('Add skill failed', 'error'); }
  };
  const removeSkillItem = async (sk) => {
    if (sk.id) { try { await deleteSkill(sk.id); } catch {} }
    setSkills(p => p.filter(s => (s.id ?? s._local) !== (sk.id ?? sk._local)));
  };

  // Languages special
  const addLanguage = async (name, proficiency) => {
    if (!name.trim()) return;
    try { const { data } = await createLanguage(id, { name, proficiency }); setLanguages(p => [...p, data]); }
    catch { showToast('Failed', 'error'); }
  };
  const removeLang = async (lang) => {
    if (lang.id) { try { await deleteLanguage(lang.id); } catch {} }
    setLanguages(p => p.filter(l => (l.id ?? l._local) !== (lang.id ?? lang._local)));
  };

  // ── AI features ─────────────────────────────────────────────────────────────
  const handleGenerateSummary = async () => {
    if (!summaryInput.trim()) return;
    setSummaryLoading(true);
    try { const { data } = await aiSummary(summaryInput); updateField('summary', data.summary); showToast('Summary generated! ✨'); }
    catch { showToast('Using fallback summary', 'info'); }
    finally { setSummaryLoading(false); }
  };

  const fetchSuggestions = async () => {
    setSuggestLoading(true);
    try { const { data } = await aiSkills(roleInput, skills.map(s => s.name)); setSuggestions(data.skills); }
    catch { setSuggestions(['JavaScript', 'React', 'Python', 'TypeScript', 'Node.js', 'REST APIs', 'SQL', 'Git', 'Docker', 'AWS', 'Agile', 'Testing']); }
    finally { setSuggestLoading(false); }
  };

  const handleEnhanceBullet = async (idx, text, jobTitle) => {
    if (!text.trim()) return;
    setEnhancing(p => ({ ...p, [idx]: true }));
    try { const { data } = await aiEnhanceBullet(text, jobTitle); expH.change(idx, 'description', data.enhanced); showToast('Bullet enhanced! ⚡'); }
    catch { showToast('Enhancement failed', 'error'); }
    finally { setEnhancing(p => ({ ...p, [idx]: false })); }
  };

  const handleATSCheck = async () => {
    if (!atsJD.trim()) return;
    setAtsLoading(true);
    const resumeText = [resume?.full_name, resume?.email, resume?.summary, ...experiences.map(e => `${e.job_title} ${e.company} ${e.description}`), ...skills.map(s => s.name)].filter(Boolean).join(' ');
    try { const { data } = await aiATSScore(resumeText, atsJD); setAtsResult(data); }
    catch { showToast('ATS check failed', 'error'); }
    finally { setAtsLoading(false); }
  };

  const handleCoverLetter = async () => {
    setCoverLoading(true);
    try {
      const { data } = await aiCoverLetter({ name: resume?.full_name, position: coverPosition, company: coverCompany, summary: resume?.summary, job_description: coverJD });
      setCoverResult(data.cover_letter);
      updateField('cover_letter', data.cover_letter);
      showToast('Cover letter generated! ✉️');
    } catch { showToast('Cover letter failed', 'error'); }
    finally { setCoverLoading(false); }
  };

  const handleJobTitles = async () => {
    setJobTitleLoading(true);
    try { const { data } = await aiJobTitles(skills.map(s => s.name), experiences.map(e => e.description).join(' ')); setJobTitles(data.titles); }
    catch { showToast('Failed to fetch titles', 'error'); }
    finally { setJobTitleLoading(false); }
  };

  const handleResumeReview = async () => {
    setReviewLoading(true);
    const resumeText = [resume?.full_name, resume?.job_title, resume?.email, resume?.summary, ...experiences.map(e => `${e.job_title} ${e.company} ${e.description}`), ...skills.map(s => s.name), ...educations.map(e => `${e.degree} ${e.school_name}`)].filter(Boolean).join(' ');
    try { const { data } = await aiResumeReview(resumeText); setReviewResult(data); }
    catch { showToast('Review failed', 'error'); }
    finally { setReviewLoading(false); }
  };

  // ── PDF Export ───────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const M = 20; const CW = W - M * 2; let y = 20;
    const primary = resume?.template === 'classic' ? [30,58,95] : resume?.template === 'minimal' ? [55,65,81] : [99,102,241];

    doc.setFillColor(...primary); doc.rect(0, 0, W, 42, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(255,255,255);
    doc.text(resume?.full_name || 'Your Name', M, 15);
    if (resume?.job_title) { doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(200,210,255); doc.text(resume.job_title, M, 22); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(200,210,255);
    doc.text([resume?.email, resume?.phone, resume?.location].filter(Boolean).join('  •  '), M, 30);
    const links = [resume?.linkedin, resume?.github].filter(Boolean).join('  •  ');
    if (links) doc.text(links, M, 37);
    y = 52;

    const sec = (title) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(...primary);
      doc.text(title, M, y); doc.setDrawColor(...primary); doc.setLineWidth(0.4); doc.line(M, y+2, W-M, y+2); y += 7;
    };

    if (resume?.summary) { sec('PROFESSIONAL SUMMARY'); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(30,30,50); const l = doc.splitTextToSize(resume.summary, CW); doc.text(l, M, y); y += l.length*5+5; }

    if (experiences.some(e => e.job_title)) {
      sec('EXPERIENCE');
      experiences.forEach(exp => {
        if (!exp.job_title && !exp.company) return;
        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(30,30,50); doc.text(exp.job_title, M, y);
        doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(100,100,120);
        doc.text([exp.start_date, exp.current?'Present':exp.end_date].filter(Boolean).join(' – '), W-M, y, {align:'right'}); y+=5;
        doc.setFont('helvetica','italic'); doc.text(`${exp.company}${exp.location?' · '+exp.location:''}`, M, y); y+=4;
        if (exp.description) { doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(30,30,50); const l=doc.splitTextToSize(exp.description,CW); doc.text(l,M+2,y); y+=l.length*4.5+3; } else y+=2;
      }); y+=2;
    }

    if (educations.some(e => e.degree||e.school_name)) {
      sec('EDUCATION');
      educations.forEach(edu => {
        if (!edu.school_name&&!edu.degree) return;
        doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(30,30,50); doc.text(edu.degree, M, y);
        if (edu.graduation_year) { doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(100,100,120); doc.text(edu.graduation_year, W-M, y, {align:'right'}); }
        y+=5; doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(100,100,120); doc.text(`${edu.school_name}${edu.gpa?' · GPA: '+edu.gpa:''}`, M, y); y+=7;
      });
    }

    if (skills.length > 0) { sec('SKILLS'); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(30,30,50); const l=doc.splitTextToSize(skills.map(s=>s.name).join('  •  '),CW); doc.text(l,M,y); y+=l.length*5+5; }

    if (projects.some(p => p.name)) {
      sec('PROJECTS');
      projects.forEach(proj => { if(!proj.name) return; doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(30,30,50); doc.text(proj.name, M, y); y+=5; if(proj.tech_stack){doc.setFont('helvetica','italic'); doc.setFontSize(8.5); doc.setTextColor(100,100,120); doc.text(`Tech: ${proj.tech_stack}`,M,y); y+=4;} if(proj.description){doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(30,30,50); const l=doc.splitTextToSize(proj.description,CW); doc.text(l,M+2,y); y+=l.length*4.5+3;} });
    }

    if (certs.some(c => c.name)) {
      sec('CERTIFICATIONS');
      certs.forEach(cert => { if(!cert.name) return; doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(30,30,50); doc.text(cert.name, M, y); if(cert.issue_date){doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(100,100,120); doc.text(cert.issue_date,W-M,y,{align:'right'});} y+=5; if(cert.issuer){doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(100,100,120); doc.text(cert.issuer,M,y); y+=6;} });
    }

    if (languages.length > 0) { sec('LANGUAGES'); doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(30,30,50); doc.text(languages.map(l=>`${l.name} (${l.proficiency})`).join('   •   '), M, y); y+=8; }

    if (volunteer.some(v => v.organization)) {
      sec('VOLUNTEER WORK');
      volunteer.forEach(v => { if(!v.organization) return; doc.setFont('helvetica','bold'); doc.setFontSize(10); doc.setTextColor(30,30,50); doc.text(v.role||v.organization, M, y); y+=5; doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(100,100,120); doc.text(v.organization, M, y); y+=5; if(v.description){doc.setTextColor(30,30,50); const l=doc.splitTextToSize(v.description,CW); doc.text(l,M+2,y); y+=l.length*4.5+3;} });
    }

    doc.save(`${resume?.full_name||'resume'}_resume.pdf`);
    showToast('PDF exported! 📄');
  };

  // ── Template component ──────────────────────────────────────────────────────
  const previewData = { resume, experiences, educations, skills, projects, certs, languages, volunteer, awards };
  const TemplateComp = { modern: ModernTemplate, classic: ClassicTemplate, minimal: MinimalTemplate }[resume?.template] || ModernTemplate;

  const completeness = calcCompleteness(resume, experiences, educations, skills, projects, certs, languages, volunteer);

  const sections = [
    { key: 'personal', icon: '👤', label: 'Personal' },
    { key: 'summary', icon: '✨', label: 'Summary' },
    { key: 'experience', icon: '💼', label: 'Experience' },
    { key: 'education', icon: '🎓', label: 'Education' },
    { key: 'skills', icon: '⚡', label: 'Skills' },
    { key: 'projects', icon: '🚀', label: 'Projects' },
    { key: 'certifications', icon: '🏆', label: 'Certs' },
    { key: 'languages', icon: '🌐', label: 'Languages', badge: 'New' },
    { key: 'volunteer', icon: '🤝', label: 'Volunteer', badge: 'New' },
    { key: 'awards', icon: '🥇', label: 'Awards', badge: 'New' },
    { key: 'cover-letter', icon: '✉️', label: 'Cover Letter', badge: 'AI' },
    { key: 'review', icon: '🔍', label: 'AI Review', badge: 'AI' },
    { key: 'ats', icon: '🎯', label: 'ATS Score' },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(99,102,241,0.25)', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Loading your resume…</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Navbar */}
      <nav className="navbar" style={{ gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 13, flexShrink: 0 }}>← Dashboard</Link>
          <div style={{ height: 18, width: 1, background: 'var(--border)' }} />
          <input className="form-input" value={resume?.title || ''} onChange={e => updateField('title', e.target.value)}
            style={{ background: 'transparent', border: 'none', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', padding: '4px 0', outline: 'none', minWidth: 0, maxWidth: 220, boxShadow: 'none' }} />
          {saving && <span style={{ fontSize: 11, color: 'var(--text-muted)' }} className="ai-pulse">Saving…</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button id="export-pdf-btn" className="btn-primary" onClick={handleExportPDF} style={{ padding: '8px 16px', fontSize: 13 }}>📄 Export PDF</button>
        </div>
      </nav>

      {/* Template bar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Template:</span>
        {['modern', 'classic', 'minimal'].map(t => (
          <button key={t} className={`template-btn ${resume?.template === t ? 'active' : ''}`} style={{ textTransform: 'capitalize', padding: '5px 14px', fontSize: 12 }} onClick={() => updateField('template', t)}>{t}</button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Complete:</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: completeness >= 80 ? 'var(--success)' : completeness >= 50 ? 'var(--warning)' : 'var(--error)' }}>{completeness}%</span>
        </div>
      </div>

      {/* Layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '190px 1fr 1fr', overflow: 'hidden', height: 'calc(100vh - 113px)' }}>

        {/* Sidebar */}
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', background: 'rgba(11,21,48,0.8)', padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <CompletenessBar score={completeness} />
          {sections.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 11px', borderRadius: 10, border: 'none', cursor: 'pointer', transition: 'all 0.15s', fontSize: 12.5, fontWeight: activeSection === s.key ? 700 : 500, color: activeSection === s.key ? '#fff' : 'var(--text-secondary)', background: activeSection === s.key ? 'var(--gradient-primary)' : 'transparent', textAlign: 'left' }}>
              <span style={{ fontSize: 14 }}>{s.icon}</span>
              <span style={{ flex: 1 }}>{s.label}</span>
              {s.badge && <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 5px', borderRadius: 6, background: s.badge === 'AI' ? 'rgba(99,102,241,0.3)' : 'rgba(52,211,153,0.2)', color: s.badge === 'AI' ? '#c4b5fd' : '#34d399' }}>{s.badge}</span>}
            </button>
          ))}
        </div>

        {/* Form Panel */}
        <div style={{ overflowY: 'auto', padding: '20px' }}>

          {/* Personal */}
          {activeSection === 'personal' && (
            <div className="fade-in-up section-card">
              <SectionHeader icon="👤" title="Personal Information" />
              <div style={{ display: 'grid', gap: 12 }}>
                <div><label className="form-label">Full Name</label><input id="inp-name" className="form-input" placeholder="Jane Smith" value={resume?.full_name||''} onChange={e=>updateField('full_name',e.target.value)} /></div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Desired Job Title</label>
                    <button className="btn-ghost" style={{ fontSize: 11, padding: '3px 8px' }} onClick={handleJobTitles} disabled={jobTitleLoading}>{jobTitleLoading ? '…' : '✦ AI Suggest'}</button>
                  </div>
                  <input id="inp-job-title" className="form-input" placeholder="Software Engineer" value={resume?.job_title||''} onChange={e=>updateField('job_title',e.target.value)} />
                  {jobTitles.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                      {jobTitles.map(t => <button key={t} className="skill-suggestion" onClick={() => updateField('job_title', t)}>{t}</button>)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label className="form-label">Email</label><input id="inp-email" type="email" className="form-input" placeholder="jane@email.com" value={resume?.email||''} onChange={e=>updateField('email',e.target.value)} /></div>
                  <div><label className="form-label">Phone</label><input id="inp-phone" type="tel" className="form-input" placeholder="+1 555 0100" value={resume?.phone||''} onChange={e=>updateField('phone',e.target.value)} /></div>
                </div>
                <div><label className="form-label">Location</label><input className="form-input" placeholder="City, State" value={resume?.location||''} onChange={e=>updateField('location',e.target.value)} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label className="form-label">LinkedIn</label><input className="form-input" placeholder="linkedin.com/in/…" value={resume?.linkedin||''} onChange={e=>updateField('linkedin',e.target.value)} /></div>
                  <div><label className="form-label">GitHub</label><input className="form-input" placeholder="github.com/…" value={resume?.github||''} onChange={e=>updateField('github',e.target.value)} /></div>
                </div>
                <div><label className="form-label">Website</label><input className="form-input" placeholder="yoursite.com" value={resume?.website||''} onChange={e=>updateField('website',e.target.value)} /></div>
              </div>
            </div>
          )}

          {/* Summary */}
          {activeSection === 'summary' && (
            <div className="fade-in-up section-card">
              <SectionHeader icon="✨" title="Professional Summary" />
              <textarea id="inp-summary" className="form-input" rows={5} placeholder="Your professional summary…" value={resume?.summary||''} onChange={e=>updateField('summary',e.target.value)} style={{ marginBottom: 16 }} />
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <p style={{ fontSize: 11, color: 'var(--text-accent)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>✦ AI GENERATOR</p>
                <textarea className="form-input" rows={2} placeholder="Your background: 5 years React, led teams, fintech, AWS…" value={summaryInput} onChange={e=>setSummaryInput(e.target.value)} style={{ marginBottom: 10 }} />
                <button id="btn-generate-summary" className="btn-primary" onClick={handleGenerateSummary} disabled={summaryLoading || !summaryInput.trim()} style={{ width: '100%', justifyContent: 'center' }}>
                  {summaryLoading ? <span className="ai-pulse">✨ Generating…</span> : '✨ Generate with AI'}
                </button>
              </div>
            </div>
          )}

          {/* Experience */}
          {activeSection === 'experience' && (
            <div className="fade-in-up">
              <div className="section-card" style={{ marginBottom: 12 }}><SectionHeader icon="💼" title="Work Experience" /></div>
              {experiences.map((exp, idx) => (
                <div key={exp.id||exp._local} className="entry-card fade-in-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Position {idx+1}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => expH.save(exp, idx)}>💾 Save</button>
                      {experiences.length > 1 && <button className="btn-danger" onClick={() => expH.remove(exp, idx)}>🗑</button>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div><label className="form-label">Job Title</label><input className="form-input" placeholder="Software Engineer" value={exp.job_title} onChange={e=>expH.change(idx,'job_title',e.target.value)} /></div>
                    <div><label className="form-label">Company</label><input className="form-input" placeholder="Acme Corp" value={exp.company} onChange={e=>expH.change(idx,'company',e.target.value)} /></div>
                    <div><label className="form-label">Start Date</label><input className="form-input" placeholder="Jan 2022" value={exp.start_date} onChange={e=>expH.change(idx,'start_date',e.target.value)} /></div>
                    <div><label className="form-label">End Date</label><input className="form-input" placeholder="Present" value={exp.current ? 'Present' : exp.end_date} onChange={e=>expH.change(idx,'end_date',e.target.value)} disabled={exp.current} /></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <input type="checkbox" id={`cur-${idx}`} checked={exp.current} onChange={e=>expH.change(idx,'current',e.target.checked)} />
                    <label htmlFor={`cur-${idx}`} style={{ fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>Currently working here</label>
                  </div>
                  <div style={{ marginBottom: 10 }}><label className="form-label">Location</label><input className="form-input" placeholder="City, State" value={exp.location} onChange={e=>expH.change(idx,'location',e.target.value)} /></div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Responsibilities / Achievements</label>
                      <button className="btn-secondary" style={{ padding: '3px 9px', fontSize: 11 }} onClick={() => handleEnhanceBullet(idx, exp.description, exp.job_title)} disabled={enhancing[idx]}>
                        {enhancing[idx] ? <span className="ai-pulse">⚡…</span> : '⚡ AI Enhance'}
                      </button>
                    </div>
                    <textarea className="form-input" rows={3} placeholder="Describe key responsibilities and achievements…" value={exp.description} onChange={e=>expH.change(idx,'description',e.target.value)} />
                  </div>
                </div>
              ))}
              <button id="btn-add-experience" className="btn-secondary" onClick={() => expH.add(newExp())} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>+ Add Experience</button>
            </div>
          )}

          {/* Education */}
          {activeSection === 'education' && (
            <div className="fade-in-up">
              <div className="section-card" style={{ marginBottom: 12 }}><SectionHeader icon="🎓" title="Education" /></div>
              {educations.map((edu, idx) => (
                <div key={edu.id||edu._local} className="entry-card fade-in-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Entry {idx+1}</span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => eduH.save(edu, idx)}>💾 Save</button>
                      {educations.length > 1 && <button className="btn-danger" onClick={() => eduH.remove(edu, idx)}>🗑</button>}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div><label className="form-label">School / University</label><input className="form-input" placeholder="MIT" value={edu.school_name} onChange={e=>eduH.change(idx,'school_name',e.target.value)} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label className="form-label">Degree</label><input className="form-input" placeholder="B.S. Computer Science" value={edu.degree} onChange={e=>eduH.change(idx,'degree',e.target.value)} /></div>
                      <div><label className="form-label">Field of Study</label><input className="form-input" placeholder="Computer Science" value={edu.field_of_study} onChange={e=>eduH.change(idx,'field_of_study',e.target.value)} /></div>
                      <div><label className="form-label">Graduation Year</label><input className="form-input" placeholder="2024" value={edu.graduation_year} onChange={e=>eduH.change(idx,'graduation_year',e.target.value)} /></div>
                      <div><label className="form-label">GPA (optional)</label><input className="form-input" placeholder="3.8/4.0" value={edu.gpa} onChange={e=>eduH.change(idx,'gpa',e.target.value)} /></div>
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn-secondary" onClick={() => eduH.add(newEdu())} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>+ Add Education</button>
            </div>
          )}

          {/* Skills */}
          {activeSection === 'skills' && (
            <div className="fade-in-up section-card">
              <SectionHeader icon="⚡" title="Skills" />
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input id="inp-skill" className="form-input" placeholder="e.g. React, Python…" value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addSkill(skillInput)} />
                <button className="btn-primary" style={{ flexShrink: 0 }} onClick={() => addSkill(skillInput)}>+ Add</button>
              </div>
              {skills.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {skills.map(sk => <span key={sk.id||sk._local} className="skill-tag">{sk.name}<button onClick={() => removeSkillItem(sk)}>✕</button></span>)}
                </div>
              )}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  <input className="form-input" placeholder="Role (e.g. data scientist)" value={roleInput} onChange={e=>setRoleInput(e.target.value)} />
                  <button className="btn-primary" style={{ flexShrink: 0, fontSize: 12 }} onClick={fetchSuggestions} disabled={suggestLoading}>
                    {suggestLoading ? <span className="ai-pulse">✦…</span> : '✦ AI Suggest'}
                  </button>
                </div>
                {suggestions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {suggestions.map(s => <button key={s} className={`skill-suggestion ${skills.find(sk=>sk.name===s)?'added':''}`} onClick={() => addSkill(s)} disabled={!!skills.find(sk=>sk.name===s)}>{skills.find(sk=>sk.name===s)?'✓ ':'+ '}{s}</button>)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects */}
          {activeSection === 'projects' && (
            <div className="fade-in-up">
              <div className="section-card" style={{ marginBottom: 12 }}><SectionHeader icon="🚀" title="Projects" /></div>
              {projects.map((proj, idx) => (
                <div key={proj.id||proj._local} className="entry-card fade-in-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Project {idx+1}</span>
                    <div style={{ display: 'flex', gap: 6 }}><button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => projH.save(proj, idx)}>💾 Save</button><button className="btn-danger" onClick={() => projH.remove(proj, idx)}>🗑</button></div>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div><label className="form-label">Project Name</label><input className="form-input" placeholder="My Awesome App" value={proj.name} onChange={e=>projH.change(idx,'name',e.target.value)} /></div>
                    <div><label className="form-label">Description</label><textarea className="form-input" rows={2} value={proj.description} onChange={e=>projH.change(idx,'description',e.target.value)} /></div>
                    <div><label className="form-label">Tech Stack</label><input className="form-input" placeholder="React, Node.js, PostgreSQL" value={proj.tech_stack} onChange={e=>projH.change(idx,'tech_stack',e.target.value)} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label className="form-label">GitHub URL</label><input className="form-input" placeholder="github.com/…" value={proj.github_url} onChange={e=>projH.change(idx,'github_url',e.target.value)} /></div>
                      <div><label className="form-label">Live URL</label><input className="form-input" placeholder="myapp.com" value={proj.live_url} onChange={e=>projH.change(idx,'live_url',e.target.value)} /></div>
                    </div>
                  </div>
                </div>
              ))}
              <button className="btn-secondary" onClick={() => projH.add(newProj())} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>+ Add Project</button>
            </div>
          )}

          {/* Certifications */}
          {activeSection === 'certifications' && (
            <div className="fade-in-up">
              <div className="section-card" style={{ marginBottom: 12 }}><SectionHeader icon="🏆" title="Certifications" /></div>
              {certs.map((cert, idx) => (
                <div key={cert.id||cert._local} className="entry-card fade-in-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Cert {idx+1}</span>
                    <div style={{ display: 'flex', gap: 6 }}><button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => certH.save(cert, idx)}>💾 Save</button><button className="btn-danger" onClick={() => certH.remove(cert, idx)}>🗑</button></div>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div><label className="form-label">Certification Name</label><input className="form-input" placeholder="AWS Certified Solutions Architect" value={cert.name} onChange={e=>certH.change(idx,'name',e.target.value)} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label className="form-label">Issuing Organization</label><input className="form-input" placeholder="Amazon" value={cert.issuer} onChange={e=>certH.change(idx,'issuer',e.target.value)} /></div>
                      <div><label className="form-label">Issue Date</label><input className="form-input" placeholder="Mar 2024" value={cert.issue_date} onChange={e=>certH.change(idx,'issue_date',e.target.value)} /></div>
                    </div>
                    <div><label className="form-label">Credential URL</label><input className="form-input" placeholder="https://…" value={cert.credential_url} onChange={e=>certH.change(idx,'credential_url',e.target.value)} /></div>
                  </div>
                </div>
              ))}
              <button className="btn-secondary" onClick={() => certH.add(newCert())} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>+ Add Certification</button>
            </div>
          )}

          {/* Languages (NEW) */}
          {activeSection === 'languages' && (
            <div className="fade-in-up section-card">
              <SectionHeader icon="🌐" title="Languages" badge="New" />
              {languages.map((lang, idx) => (
                <div key={lang.id||lang._local} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border)' }}>
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{lang.name}</span>
                  <span className="badge badge-blue">{lang.proficiency}</span>
                  <button className="btn-danger" style={{ padding: '4px 8px' }} onClick={() => removeLang(lang)}>🗑</button>
                </div>
              ))}
              <AddLanguageForm onAdd={addLanguage} />
            </div>
          )}

          {/* Volunteer (NEW) */}
          {activeSection === 'volunteer' && (
            <div className="fade-in-up">
              <div className="section-card" style={{ marginBottom: 12 }}><SectionHeader icon="🤝" title="Volunteer Work" badge="New" /></div>
              {volunteer.map((vol, idx) => (
                <div key={vol.id||vol._local} className="entry-card fade-in-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Entry {idx+1}</span>
                    <div style={{ display: 'flex', gap: 6 }}><button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => volH.save(vol, idx)}>💾 Save</button><button className="btn-danger" onClick={() => volH.remove(vol, idx)}>🗑</button></div>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label className="form-label">Organization</label><input className="form-input" placeholder="Red Cross" value={vol.organization} onChange={e=>volH.change(idx,'organization',e.target.value)} /></div>
                      <div><label className="form-label">Role</label><input className="form-input" placeholder="Volunteer Coordinator" value={vol.role} onChange={e=>volH.change(idx,'role',e.target.value)} /></div>
                      <div><label className="form-label">Start Date</label><input className="form-input" placeholder="Jan 2023" value={vol.start_date} onChange={e=>volH.change(idx,'start_date',e.target.value)} /></div>
                      <div><label className="form-label">End Date</label><input className="form-input" placeholder="Present" value={vol.current?'Present':vol.end_date} onChange={e=>volH.change(idx,'end_date',e.target.value)} disabled={vol.current} /></div>
                    </div>
                    <div><label className="form-label">Description</label><textarea className="form-input" rows={2} value={vol.description} onChange={e=>volH.change(idx,'description',e.target.value)} /></div>
                  </div>
                </div>
              ))}
              <button className="btn-secondary" onClick={() => volH.add(newVol())} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>+ Add Volunteer Work</button>
            </div>
          )}

          {/* Awards (NEW) */}
          {activeSection === 'awards' && (
            <div className="fade-in-up">
              <div className="section-card" style={{ marginBottom: 12 }}><SectionHeader icon="🥇" title="Awards & Achievements" badge="New" /></div>
              {awards.map((aw, idx) => (
                <div key={aw.id||aw._local} className="entry-card fade-in-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Award {idx+1}</span>
                    <div style={{ display: 'flex', gap: 6 }}><button className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => awardH.save(aw, idx)}>💾 Save</button><button className="btn-danger" onClick={() => awardH.remove(aw, idx)}>🗑</button></div>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div><label className="form-label">Award Title</label><input className="form-input" placeholder="Employee of the Year" value={aw.title} onChange={e=>awardH.change(idx,'title',e.target.value)} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label className="form-label">Issuer</label><input className="form-input" placeholder="Company / Organization" value={aw.issuer} onChange={e=>awardH.change(idx,'issuer',e.target.value)} /></div>
                      <div><label className="form-label">Date</label><input className="form-input" placeholder="Dec 2023" value={aw.date} onChange={e=>awardH.change(idx,'date',e.target.value)} /></div>
                    </div>
                    <div><label className="form-label">Description</label><textarea className="form-input" rows={2} value={aw.description} onChange={e=>awardH.change(idx,'description',e.target.value)} /></div>
                  </div>
                </div>
              ))}
              <button className="btn-secondary" onClick={() => awardH.add(newAward())} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>+ Add Award</button>
            </div>
          )}

          {/* Cover Letter (NEW AI) */}
          {activeSection === 'cover-letter' && (
            <div className="fade-in-up section-card">
              <SectionHeader icon="✉️" title="AI Cover Letter Generator" badge="AI" />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>Generate a personalized cover letter tailored to the job description using AI.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div><label className="form-label">Position Applied For</label><input className="form-input" placeholder="Frontend Engineer" value={coverPosition} onChange={e=>setCoverPosition(e.target.value)} /></div>
                <div><label className="form-label">Company Name</label><input className="form-input" placeholder="Google" value={coverCompany} onChange={e=>setCoverCompany(e.target.value)} /></div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label className="form-label">Job Description (optional)</label>
                <textarea className="form-input" rows={4} placeholder="Paste job description here for a more tailored letter…" value={coverJD} onChange={e=>setCoverJD(e.target.value)} />
              </div>
              <button className="btn-primary" onClick={handleCoverLetter} disabled={coverLoading} style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
                {coverLoading ? <span className="ai-pulse">✉️ Generating…</span> : '✉️ Generate Cover Letter'}
              </button>
              {coverResult && (
                <div>
                  <div className="divider" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <p style={{ fontSize: 12, color: 'var(--text-accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Generated Cover Letter</p>
                    <button className="btn-secondary" style={{ padding: '5px 10px', fontSize: 11 }} onClick={() => { navigator.clipboard.writeText(coverResult); showToast('Copied to clipboard!'); }}>📋 Copy</button>
                  </div>
                  <div className="cover-letter-preview">{coverResult}</div>
                </div>
              )}
            </div>
          )}

          {/* AI Resume Review (NEW) */}
          {activeSection === 'review' && (
            <div className="fade-in-up section-card">
              <SectionHeader icon="🔍" title="AI Resume Review" badge="AI" />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>Get a comprehensive quality review of your entire resume with actionable improvement suggestions.</p>
              <button className="btn-primary" onClick={handleResumeReview} disabled={reviewLoading} style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
                {reviewLoading ? <span className="ai-pulse">🔍 Analyzing…</span> : '🔍 Analyze My Resume'}
              </button>
              {reviewResult && <ReviewPanel data={reviewResult} />}
            </div>
          )}

          {/* ATS Score */}
          {activeSection === 'ats' && (
            <div className="fade-in-up section-card">
              <SectionHeader icon="🎯" title="ATS Score Checker" />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.6 }}>Paste a job description to check ATS compatibility and get optimization tips.</p>
              <label className="form-label">Job Description</label>
              <textarea id="inp-ats-jd" className="form-input" rows={7} placeholder="Paste the full job description here…" value={atsJD} onChange={e=>setAtsJD(e.target.value)} style={{ marginBottom: 12 }} />
              <button className="btn-primary" onClick={handleATSCheck} disabled={atsLoading||!atsJD.trim()} style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
                {atsLoading ? <span className="ai-pulse">🎯 Analyzing…</span> : '🎯 Check ATS Score'}
              </button>
              {atsResult && <ATSPanel score={atsResult.score} breakdown={atsResult.breakdown} keywords={atsResult.matched_keywords} suggestions={atsResult.suggestions} />}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div style={{ overflowY: 'auto', background: '#dde3ef', padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 12, padding: '8px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>📋 Live Preview</span>
            <button className="btn-primary" onClick={handleExportPDF} style={{ padding: '5px 14px', fontSize: 12 }}>📄 Export PDF</button>
          </div>
          <div style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.4)', background: '#fff' }}>
            <TemplateComp {...previewData} />
          </div>
        </div>
      </div>

      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── Add Language inline form ──────────────────────────────────────────────────
function AddLanguageForm({ onAdd }) {
  const [name, setName] = useState('');
  const [proficiency, setProficiency] = useState('intermediate');
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <input className="form-input" placeholder="Language (e.g. Spanish)" value={name} onChange={e=>setName(e.target.value)} style={{ flex: 2 }} />
      <select className="form-input" value={proficiency} onChange={e=>setProficiency(e.target.value)} style={{ flex: 1.5 }}>
        {[['native','Native'],['fluent','Fluent'],['professional','Professional'],['intermediate','Intermediate'],['basic','Basic']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
      </select>
      <button className="btn-primary" style={{ flexShrink: 0, padding: '10px 14px', fontSize: 13 }} onClick={() => { if(name.trim()){onAdd(name.trim(),proficiency);setName('');} }}>+ Add</button>
    </div>
  );
}
