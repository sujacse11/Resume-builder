// Classic Template — Navy header, traditional serif-inspired typography
export default function ClassicTemplate({ resume, experiences, educations, skills, projects, certs }) {
  const r = resume || {};
  const navy = '#1e3a5f';
  const gold = '#b8902e';

  const SectionTitle = ({ title }) => (
    <div style={{ marginBottom: 12 }}>
      <h2 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: navy, borderBottom: `2px solid ${navy}`, paddingBottom: 4, margin: 0 }}>{title}</h2>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', background: '#faf9f7', color: '#2c2c2c', minHeight: 800 }}>
      {/* Header */}
      <div style={{ background: navy, padding: '36px 36px 28px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: '#fff', margin: '0 0 8px', letterSpacing: '0.03em', fontFamily: 'Georgia, serif' }}>
          {r.full_name || <span style={{ opacity: 0.3 }}>Your Name</span>}
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '4px 20px' }}>
          {[r.email, r.phone, r.location].filter(Boolean).map((c, i) => (
            <span key={i} style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.8)', fontFamily: 'Arial, sans-serif' }}>{c}</span>
          ))}
        </div>
        {(r.linkedin || r.github) && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 6 }}>
            {[r.linkedin, r.github].filter(Boolean).map((l, i) => (
              <span key={i} style={{ fontSize: 11.5, color: 'rgba(200,220,255,0.8)', fontFamily: 'Arial, sans-serif' }}>{l}</span>
            ))}
          </div>
        )}
      </div>

      {/* Gold accent line */}
      <div style={{ height: 4, background: `linear-gradient(90deg, ${gold}, #d4a843, ${gold})` }} />

      {/* Body */}
      <div style={{ padding: '28px 36px' }}>
        {r.summary && (
          <div style={{ marginBottom: 22 }}>
            <SectionTitle title="Professional Summary" />
            <p style={{ fontSize: 13.5, color: '#3d3d3d', lineHeight: 1.75, fontStyle: 'italic' }}>{r.summary}</p>
          </div>
        )}

        {(experiences || []).some(e => e.job_title || e.company) && (
          <div style={{ marginBottom: 22 }}>
            <SectionTitle title="Professional Experience" />
            {(experiences || []).map((exp, i) => {
              if (!exp.job_title && !exp.company) return null;
              return (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <p style={{ fontSize: 14.5, fontWeight: 700, color: '#111', margin: 0, fontFamily: 'Arial, sans-serif' }}>{exp.job_title}</p>
                    <span style={{ fontSize: 12, color: '#777', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap', marginLeft: 12 }}>
                      {[exp.start_date, exp.current ? 'Present' : exp.end_date].filter(Boolean).join(' – ')}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: navy, fontWeight: 600, margin: '3px 0', fontFamily: 'Arial, sans-serif' }}>{exp.company}{exp.location ? `, ${exp.location}` : ''}</p>
                  {exp.description && <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, marginTop: 5 }}>{exp.description}</p>}
                </div>
              );
            })}
          </div>
        )}

        {(educations || []).some(e => e.school_name || e.degree) && (
          <div style={{ marginBottom: 22 }}>
            <SectionTitle title="Education" />
            {(educations || []).map((edu, i) => {
              if (!edu.school_name && !edu.degree) return null;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: 0, fontFamily: 'Arial, sans-serif' }}>{edu.degree}</p>
                    <p style={{ fontSize: 13, color: '#555', margin: '2px 0', fontFamily: 'Arial, sans-serif' }}>{edu.school_name}{edu.gpa ? ` · GPA ${edu.gpa}` : ''}</p>
                  </div>
                  {edu.graduation_year && <span style={{ fontSize: 12.5, color: '#777', fontFamily: 'Arial, sans-serif' }}>{edu.graduation_year}</span>}
                </div>
              );
            })}
          </div>
        )}

        {(skills || []).length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <SectionTitle title="Core Competencies" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 0' }}>
              {(skills || []).map((sk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0' }}>
                  <span style={{ color: gold, fontSize: 16, lineHeight: 1 }}>▪</span>
                  <span style={{ fontSize: 13, color: '#333', fontFamily: 'Arial, sans-serif' }}>{sk.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {(projects || []).some(p => p.name) && (
          <div style={{ marginBottom: 22 }}>
            <SectionTitle title="Notable Projects" />
            {(projects || []).map((proj, i) => {
              if (!proj.name) return null;
              return (
                <div key={i} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111', margin: '0 0 4px', fontFamily: 'Arial, sans-serif' }}>{proj.name}</p>
                  {proj.tech_stack && <p style={{ fontSize: 12, color: '#777', margin: '0 0 4px', fontFamily: 'Arial, sans-serif', fontStyle: 'italic' }}>Technologies: {proj.tech_stack}</p>}
                  {proj.description && <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65 }}>{proj.description}</p>}
                </div>
              );
            })}
          </div>
        )}

        {(certs || []).some(c => c.name) && (
          <div>
            <SectionTitle title="Certifications & Credentials" />
            {(certs || []).map((cert, i) => {
              if (!cert.name) return null;
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#111', fontFamily: 'Arial, sans-serif' }}>{cert.name}</span>
                    {cert.issuer && <span style={{ fontSize: 12.5, color: '#666', marginLeft: 8, fontFamily: 'Arial, sans-serif' }}>— {cert.issuer}</span>}
                  </div>
                  {cert.issue_date && <span style={{ fontSize: 12, color: '#777', fontFamily: 'Arial, sans-serif' }}>{cert.issue_date}</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
