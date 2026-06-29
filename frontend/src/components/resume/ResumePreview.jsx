import { memo } from "react";
import { motion } from "framer-motion";
import { Download, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

const Section = ({ title, children, show = true }) => {
  if (!show) return null;
  return (
    <div className="rp-section">
      <div className="rp-section__title">{title}</div>
      {children}
    </div>
  );
};

const ResumePreview = memo(({ data = {}, template = "modern", onDownload }) => {
  const {
    personal = {},
    summary = "",
    experience = [],
    education = [],
    skills = [],
    projects = [],
    certifications = [],
    achievements = [],
    languages = [],
    links = [],
  } = data;

  return (
    <div className="resume-preview">
      {/* Toolbar */}
      <div className="resume-preview__toolbar">
        <span className="resume-preview__label">Live Preview</span>
        <div className="resume-preview__toolbar-actions">
          <button className="resume-preview__tool-btn" aria-label="Zoom in">
            <ZoomIn size={13} />
          </button>
          <button className="resume-preview__tool-btn" aria-label="Zoom out">
            <ZoomOut size={13} />
          </button>
          <button className="resume-preview__tool-btn" aria-label="Fullscreen">
            <Maximize2 size={13} />
          </button>
          {onDownload && (
            <button
              className="resume-preview__download-btn"
              onClick={onDownload}
            >
              <Download size={13} />
              Download
            </button>
          )}
        </div>
      </div>

      {/* Paper */}
      <div className="resume-preview__scroll">
        <motion.div
          className={`resume-preview__paper rp--${template}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="rp-header">
            <h1 className="rp-header__name">
              {personal.name || "Your Name"}
            </h1>
            {personal.title && (
              <div className="rp-header__title">{personal.title}</div>
            )}
            <div className="rp-header__contact">
              {personal.email && <span>{personal.email}</span>}
              {personal.phone && <span>{personal.phone}</span>}
              {personal.location && <span>{personal.location}</span>}
              {links.map((l, i) =>
                l.url ? (
                  <a key={i} href={l.url} className="rp-header__link">
                    {l.label || l.url}
                  </a>
                ) : null
              )}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <Section title="Summary">
              <p className="rp-text">{summary}</p>
            </Section>
          )}

          {/* Experience */}
          <Section title="Experience" show={experience.length > 0}>
            {experience.map((exp, i) => (
              <div key={i} className="rp-entry">
                <div className="rp-entry__top">
                  <div>
                    <div className="rp-entry__title">{exp.title}</div>
                    <div className="rp-entry__sub">
                      {exp.company}
                      {exp.location && ` · ${exp.location}`}
                    </div>
                  </div>
                  <div className="rp-entry__date">
                    {exp.startDate} – {exp.endDate || "Present"}
                  </div>
                </div>
                {exp.bullets?.length > 0 && (
                  <ul className="rp-entry__bullets">
                    {exp.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </Section>

          {/* Education */}
          <Section title="Education" show={education.length > 0}>
            {education.map((edu, i) => (
              <div key={i} className="rp-entry">
                <div className="rp-entry__top">
                  <div>
                    <div className="rp-entry__title">{edu.degree}</div>
                    <div className="rp-entry__sub">{edu.school}</div>
                  </div>
                  <div className="rp-entry__date">{edu.year}</div>
                </div>
              </div>
            ))}
          </Section>

          {/* Projects */}
          <Section title="Projects" show={projects.length > 0}>
            {projects.map((p, i) => (
              <div key={i} className="rp-entry">
                <div className="rp-entry__title">{p.name}</div>
                {p.description && (
                  <p className="rp-text">{p.description}</p>
                )}
              </div>
            ))}
          </Section>

          {/* Skills */}
          <Section title="Skills" show={skills.length > 0}>
            <div className="rp-skills">
              {skills.map((s, i) => (
                <span key={i} className="rp-skill">
                  {typeof s === "string" ? s : s.name}
                </span>
              ))}
            </div>
          </Section>

          {/* Certifications */}
          <Section title="Certifications" show={certifications.length > 0}>
            {certifications.map((c, i) => (
              <div key={i} className="rp-entry">
                <div className="rp-entry__title">{c.name}</div>
                <div className="rp-entry__sub">{c.issuer}</div>
              </div>
            ))}
          </Section>

          {/* Achievements */}
          <Section title="Achievements" show={achievements.length > 0}>
            {achievements.map((a, i) => (
              <div key={i} className="rp-entry">
                <div className="rp-entry__title">{a.title}</div>
                {a.description && (
                  <p className="rp-text">{a.description}</p>
                )}
              </div>
            ))}
          </Section>

          {/* Languages */}
          <Section title="Languages" show={languages.length > 0}>
            <div className="rp-skills">
              {languages.map((l, i) => (
                <span key={i} className="rp-skill">
                  {typeof l === "string" ? l : `${l.language} (${l.proficiency})`}
                </span>
              ))}
            </div>
          </Section>
        </motion.div>
      </div>
    </div>
  );
});

ResumePreview.displayName = "ResumePreview";
export default ResumePreview;