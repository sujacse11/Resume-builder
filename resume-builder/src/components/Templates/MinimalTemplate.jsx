// Minimal Template — Ultra-clean, monochrome, whitespace-driven design
export default function MinimalTemplate({ resume, experiences, educations, skills, projects, certs }) {
  const r = resume || {};
  const accent = '#18181b';
  const line = '#e4e4e7';

  const SectionTitle = ({ title }) => (
    <p style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#71717a', margin: '0 0 12px' }}>{title}</p>
  );

  const Divider = () => <div style={{ height: 1, background: line, margin: '20px 0' }} />;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#fff', color: '#18181b', minHeight: 800 }}>
      {/* Header — minimal top strip */}
      <div style={{ padding: '40px 40px 24px', borderBottom: `2px solid ${accent}` }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: accent, margin: '0 0 10px', letterSpacing: '-0.03em' }}>
          {r.full_name || <span style={{ color: '#d4d4d8' }}>Your Name</span>}
        </h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 24px' }}>
          {[r.email, r.phone, r.location, r.linkedin, r.github].filter(Boolean).map((c, i) => (
            <span key={i} style={{ fontSize: 12.5, color: '#71717a' }}>{c}</span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 40px' }}>
        {r.summary && (
          <>
            <SectionTitle title="About" />
            <p style={{ fontSize: 14, color: '#3f3f46', lineHeight: 1.75, margin: 0 }}>{r.summary}</p>
            <Divider />
          </>
        )}

        {(experiences || []).some(e => e.job_title || e.company) && (
          <>
            <SectionTitle title="Experience" />
            {(experiences || []).map((exp, i) => {
              if (!exp.job_title && !exp.company) return null;
              return (
                <div key={i} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                    <div>
                      <span style={{ fontSize: 14.5, fontWeight: 700, color: accent }}>{exp.job_title}</span>
                      <span style={{ fontSize: 13, color: '#71717a', marginLeft: 8 }}>@ {exp.company}{exp.location ? `, ${exp.location}` : ''}</span>
                    </div>
                    {(exp.start_date || exp.end_date) && (
                      <span style={{ fontSize: 12, color: '#a1a1aa', whiteSpace: 'nowrap', marginLeft: 12 }}>
                        {[exp.start_date, exp.current ? 'Present' : exp.end_date].filter(Boolean).join('–')}
                      </span>
                    )}
                  </div>
                  {exp.description && <p style={{ fontSize: 13.5, color: '#52525b', lineHeight: 1.7, margin: '6px 0 0' }}>{exp.description}</p>}
                </div>
              );
            })}
            <Divider />
          </>
        )}

        {(educations || []).some(e => e.school_name || e.degree) && (
          <>
            <SectionTitle title="Education" />
            {(educations || []).map((edu, i) => {
              if (!edu.school_name && !edu.degree) return null;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: accent, margin: 0 }}>{edu.degree}</p>
                    <p style={{ fontSize: 13, color: '#71717a', margin: '2px 0' }}>{edu.school_name}{edu.gpa ? ` · ${edu.gpa}` : ''}</p>
                  </div>
                  {edu.graduation_year && <span style={{ fontSize: 12, color: '#a1a1aa' }}>{edu.graduation_year}</span>}
                </div>
              );
            })}
            <Divider />
          </>
        )}

        {(skills || []).length > 0 && (
          <>
            <SectionTitle title="Skills" />
            <p style={{ fontSize: 13.5, color: '#3f3f46', lineHeight: 1.8, margin: 0 }}>
              {(skills || []).map(s => s.name).join(' · ')}
            </p>
            {((projects || []).some(p => p.name) || (certs || []).some(c => c.name)) && <Divider />}
          </>
        )}

        {(projects || []).some(p => p.name) && (
          <>
            <SectionTitle title="Projects" />
            {(projects || []).map((proj, i) => {
              if (!proj.name) return null;
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: accent }}>{proj.name}</span>
                    {proj.tech_stack && <span style={{ fontSize: 11.5, color: '#71717a', background: '#f4f4f5', padding: '2px 8px', borderRadius: 4 }}>{proj.tech_stack}</span>}
                  </div>
                  {proj.description && <p style={{ fontSize: 13, color: '#52525b', lineHeight: 1.65, margin: '4px 0 0' }}>{proj.description}</p>}
                </div>
              );
            })}
            {(certs || []).some(c => c.name) && <Divider />}
          </>
        )}

        {(certs || []).some(c => c.name) && (
          <>
            <SectionTitle title="Certifications" />
            {(certs || []).map((cert, i) => {
              if (!cert.name) return null;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: accent }}>{cert.name}</span>
                    {cert.issuer && <span style={{ fontSize: 12.5, color: '#71717a', marginLeft: 8 }}>{cert.issuer}</span>}
                  </div>
                  {cert.issue_date && <span style={{ fontSize: 12, color: '#a1a1aa' }}>{cert.issue_date}</span>}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
