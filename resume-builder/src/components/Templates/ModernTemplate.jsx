// Modern Template — Bold indigo header, clean two-column feel
export default function ModernTemplate({ resume, experiences, educations, skills, projects, certs }) {
  const r = resume || {};
  const primaryColor = '#4338ca';
  const lightBg = '#eef2ff';

  const SectionTitle = ({ title }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: primaryColor, margin: 0 }}>{title}</h2>
      <div style={{ flex: 1, height: 1.5, background: lightBg, borderRadius: 2 }} />
    </div>
  );

  const hasContent = r.full_name || r.summary || (experiences || []).some(e => e.job_title) || (educations || []).some(e => e.school_name) || (skills || []).length > 0;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: '#fff', color: '#1e1e2e', minHeight: 800 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${primaryColor}, #7c3aed)`, padding: '32px 36px 28px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
          {r.full_name || <span style={{ opacity: 0.4 }}>Your Name</span>}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
          {[r.email, r.phone, r.location].filter(Boolean).map((c, i) => (
            <span key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{c}</span>
          ))}
        </div>
        {(r.linkedin || r.github || r.website) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginTop: 4 }}>
            {[r.linkedin, r.github, r.website].filter(Boolean).map((l, i) => (
              <span key={i} style={{ fontSize: 12, color: 'rgba(199,210,254,0.9)' }}>{l}</span>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '28px 36px' }}>
        {!hasContent && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            <p style={{ fontSize: 14 }}>Fill in the form to see your resume come to life</p>
          </div>
        )}

        {/* Summary */}
        {r.summary && (
          <div style={{ marginBottom: 22 }}>
            <SectionTitle title="Professional Summary" />
            <p style={{ fontSize: 13.5, color: '#374151', lineHeight: 1.7 }}>{r.summary}</p>
          </div>
        )}

        {/* Experience */}
        {(experiences || []).some(e => e.job_title || e.company) && (
          <div style={{ marginBottom: 22 }}>
            <SectionTitle title="Work Experience" />
            {(experiences || []).map((exp, i) => {
              if (!exp.job_title && !exp.company) return null;
              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: 14.5, fontWeight: 700, color: '#111827', margin: 0 }}>{exp.job_title}</p>
                      <p style={{ fontSize: 13, color: primaryColor, fontWeight: 600, margin: '2px 0' }}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                    </div>
                    {(exp.start_date || exp.end_date) && (
                      <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 12, marginTop: 2 }}>
                        {[exp.start_date, exp.current ? 'Present' : exp.end_date].filter(Boolean).join(' – ')}
                      </span>
                    )}
                  </div>
                  {exp.description && <p style={{ fontSize: 13, color: '#4b5563', marginTop: 6, lineHeight: 1.65 }}>{exp.description}</p>}
                </div>
              );
            })}
          </div>
        )}

        {/* Education */}
        {(educations || []).some(e => e.school_name || e.degree) && (
          <div style={{ marginBottom: 22 }}>
            <SectionTitle title="Education" />
            {(educations || []).map((edu, i) => {
              if (!edu.school_name && !edu.degree) return null;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</p>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0' }}>{edu.school_name}{edu.gpa ? ` · GPA: ${edu.gpa}` : ''}</p>
                  </div>
                  {edu.graduation_year && <span style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', marginLeft: 12 }}>{edu.graduation_year}</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Skills */}
        {(skills || []).length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <SectionTitle title="Skills" />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(skills || []).map((sk, i) => (
                <span key={i} style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: lightBg, color: primaryColor, border: `1px solid #c7d2fe` }}>
                  {sk.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {(projects || []).some(p => p.name) && (
          <div style={{ marginBottom: 22 }}>
            <SectionTitle title="Projects" />
            {(projects || []).map((proj, i) => {
              if (!proj.name) return null;
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: 0 }}>{proj.name}</p>
                    {proj.tech_stack && <span style={{ fontSize: 11, color: primaryColor, background: lightBg, padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>{proj.tech_stack}</span>}
                  </div>
                  {proj.description && <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>{proj.description}</p>}
                  <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                    {proj.github_url && <a href={proj.github_url} style={{ fontSize: 12, color: primaryColor }}>GitHub ↗</a>}
                    {proj.live_url && <a href={proj.live_url} style={{ fontSize: 12, color: primaryColor }}>Live ↗</a>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Certifications */}
        {(certs || []).some(c => c.name) && (
          <div>
            <SectionTitle title="Certifications" />
            {(certs || []).map((cert, i) => {
              if (!cert.name) return null;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <p style={{ fontSize: 13.5, fontWeight: 600, color: '#111827', margin: 0 }}>{cert.name}</p>
                    {cert.issuer && <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0' }}>{cert.issuer}</p>}
                  </div>
                  {cert.issue_date && <span style={{ fontSize: 12, color: '#9ca3af' }}>{cert.issue_date}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
