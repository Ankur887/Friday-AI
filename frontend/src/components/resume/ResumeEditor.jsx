import { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Plus,
  Trash2,
  User,
  FileText,
  Briefcase,
  GraduationCap,
  Code2,
  Wrench,
  Award,
  Trophy,
  Languages,
  Link,
  Save,
  Check,
} from "lucide-react";
import ResumeActions from "./ResumeActions";
import ResumePreview from "./ResumePreview";

/* ── Accordion Section Shell ── */
const Section = memo(({ id, icon: Icon, title, open, onToggle, onAIAction, children }) => (
  <div className={`editor-section ${open ? "editor-section--open" : ""}`}>
    <button className="editor-section__header" onClick={() => onToggle(id)}>
      <div className="editor-section__header-left">
        <Icon size={14} className="editor-section__icon" />
        <span className="editor-section__title">{title}</span>
      </div>
      <div className="editor-section__header-right">
        <ResumeActions
          onAction={(action, ctx) => onAIAction(id, action, ctx)}
          context={{ section: id }}
        />
        <ChevronDown
          size={14}
          className="editor-section__chevron"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}
        />
      </div>
    </button>

    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          className="editor-section__body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          <div className="editor-section__content">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
));

Section.displayName = "Section";

/* ── Field Helpers ── */
const Field = ({ label, children }) => (
  <div className="editor-field">
    <label className="editor-field__label">{label}</label>
    {children}
  </div>
);

const Input = ({ value, onChange, placeholder, type = "text" }) => (
  <input
    className="form-input"
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    type={type}
  />
);

const Textarea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    className="form-input form-input--textarea"
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
  />
);

const AddButton = ({ label, onClick }) => (
  <button className="editor-add-btn" onClick={onClick}>
    <Plus size={12} />
    {label}
  </button>
);

const RemoveButton = ({ onClick }) => (
  <button className="editor-remove-btn" onClick={onClick} aria-label="Remove">
    <Trash2 size={12} />
  </button>
);

/* ── Main Editor ── */
const ResumeEditor = memo(({ data, onChange, onSave, template = "modern", saving = false }) => {
  const [openSections, setOpenSections] = useState({
    personal: true,
    summary: false,
    experience: false,
    education: false,
    projects: false,
    skills: false,
    certifications: false,
    achievements: false,
    languages: false,
    links: false,
  });

  const toggleSection = useCallback((id) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const update = useCallback(
    (path, value) => {
      const parts = path.split(".");
      const next = JSON.parse(JSON.stringify(data || {}));
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        if (cur[parts[i]] === undefined) cur[parts[i]] = {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = value;
      onChange(next);
    },
    [data, onChange]
  );

  const handleAIAction = useCallback(async (section, action, ctx) => {
    console.log("AI action:", action, "on section:", section, ctx);
    // Hook into existing AI generation APIs here
  }, []);

  // Array helpers
  const addToArray = (key, template) =>
    update(key, [...(data?.[key] || []), template]);

  const removeFromArray = (key, idx) =>
    update(key, (data?.[key] || []).filter((_, i) => i !== idx));

  const updateArrayItem = (key, idx, field, value) => {
    const arr = JSON.parse(JSON.stringify(data?.[key] || []));
    if (!arr[idx]) arr[idx] = {};
    arr[idx][field] = value;
    update(key, arr);
  };

  const p = data?.personal || {};
  const exp = data?.experience || [];
  const edu = data?.education || [];
  const projects = data?.projects || [];
  const skills = data?.skills || [];
  const certs = data?.certifications || [];
  const achievements = data?.achievements || [];
  const languages = data?.languages || [];
  const links = data?.links || [];

  return (
    <div className="resume-editor">
      {/* Left Pane */}
      <div className="resume-editor__left">
        {/* Autosave status */}
        <div className="resume-editor__save-bar">
          <span className="resume-editor__save-status">
            {saving ? (
              <>
                <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
                  Saving…
                </motion.span>
              </>
            ) : (
              <>
                <Check size={12} />
                All changes saved
              </>
            )}
          </span>
          <button className="btn btn--ghost btn--sm" onClick={onSave}>
            <Save size={12} />
            Save
          </button>
        </div>

        {/* Sections */}
        <Section id="personal" icon={User} title="Personal Details" open={openSections.personal} onToggle={toggleSection} onAIAction={handleAIAction}>
          <div className="editor-grid">
            <Field label="Full Name">
              <Input value={p.name} onChange={(v) => update("personal.name", v)} placeholder="Jane Smith" />
            </Field>
            <Field label="Job Title">
              <Input value={p.title} onChange={(v) => update("personal.title", v)} placeholder="Senior Engineer" />
            </Field>
            <Field label="Email">
              <Input value={p.email} onChange={(v) => update("personal.email", v)} placeholder="jane@example.com" type="email" />
            </Field>
            <Field label="Phone">
              <Input value={p.phone} onChange={(v) => update("personal.phone", v)} placeholder="+1 (555) 000-0000" />
            </Field>
            <Field label="Location">
              <Input value={p.location} onChange={(v) => update("personal.location", v)} placeholder="San Francisco, CA" />
            </Field>
            <Field label="Website">
              <Input value={p.website} onChange={(v) => update("personal.website", v)} placeholder="https://janedoe.com" />
            </Field>
          </div>
        </Section>

        <Section id="summary" icon={FileText} title="Professional Summary" open={openSections.summary} onToggle={toggleSection} onAIAction={handleAIAction}>
          <Textarea
            value={data?.summary}
            onChange={(v) => update("summary", v)}
            placeholder="Write a compelling summary that highlights your key strengths…"
            rows={4}
          />
        </Section>

        <Section id="experience" icon={Briefcase} title="Experience" open={openSections.experience} onToggle={toggleSection} onAIAction={handleAIAction}>
          {exp.map((item, i) => (
            <div key={i} className="editor-entry">
              <div className="editor-entry__header">
                <span className="editor-entry__label">Position {i + 1}</span>
                <RemoveButton onClick={() => removeFromArray("experience", i)} />
              </div>
              <div className="editor-grid">
                <Field label="Job Title">
                  <Input value={item.title} onChange={(v) => updateArrayItem("experience", i, "title", v)} placeholder="Software Engineer" />
                </Field>
                <Field label="Company">
                  <Input value={item.company} onChange={(v) => updateArrayItem("experience", i, "company", v)} placeholder="Acme Corp" />
                </Field>
                <Field label="Start Date">
                  <Input value={item.startDate} onChange={(v) => updateArrayItem("experience", i, "startDate", v)} placeholder="Jan 2022" />
                </Field>
                <Field label="End Date">
                  <Input value={item.endDate} onChange={(v) => updateArrayItem("experience", i, "endDate", v)} placeholder="Present" />
                </Field>
              </div>
              <Field label="Location">
                <Input value={item.location} onChange={(v) => updateArrayItem("experience", i, "location", v)} placeholder="Remote" />
              </Field>
              <Field label="Bullet Points (one per line)">
                <Textarea
                  value={(item.bullets || []).join("\n")}
                  onChange={(v) => updateArrayItem("experience", i, "bullets", v.split("\n"))}
                  placeholder="• Built feature X that increased conversions by 20%"
                  rows={4}
                />
              </Field>
            </div>
          ))}
          <AddButton label="Add Experience" onClick={() => addToArray("experience", { title: "", company: "", startDate: "", endDate: "", bullets: [] })} />
        </Section>

        <Section id="education" icon={GraduationCap} title="Education" open={openSections.education} onToggle={toggleSection} onAIAction={handleAIAction}>
          {edu.map((item, i) => (
            <div key={i} className="editor-entry">
              <div className="editor-entry__header">
                <span className="editor-entry__label">Education {i + 1}</span>
                <RemoveButton onClick={() => removeFromArray("education", i)} />
              </div>
              <div className="editor-grid">
                <Field label="Degree">
                  <Input value={item.degree} onChange={(v) => updateArrayItem("education", i, "degree", v)} placeholder="B.S. Computer Science" />
                </Field>
                <Field label="School">
                  <Input value={item.school} onChange={(v) => updateArrayItem("education", i, "school", v)} placeholder="MIT" />
                </Field>
                <Field label="Year">
                  <Input value={item.year} onChange={(v) => updateArrayItem("education", i, "year", v)} placeholder="2020" />
                </Field>
                <Field label="GPA (optional)">
                  <Input value={item.gpa} onChange={(v) => updateArrayItem("education", i, "gpa", v)} placeholder="3.9" />
                </Field>
              </div>
            </div>
          ))}
          <AddButton label="Add Education" onClick={() => addToArray("education", { degree: "", school: "", year: "" })} />
        </Section>

        <Section id="projects" icon={Code2} title="Projects" open={openSections.projects} onToggle={toggleSection} onAIAction={handleAIAction}>
          {projects.map((item, i) => (
            <div key={i} className="editor-entry">
              <div className="editor-entry__header">
                <span className="editor-entry__label">Project {i + 1}</span>
                <RemoveButton onClick={() => removeFromArray("projects", i)} />
              </div>
              <Field label="Project Name">
                <Input value={item.name} onChange={(v) => updateArrayItem("projects", i, "name", v)} placeholder="My Awesome Project" />
              </Field>
              <Field label="Description">
                <Textarea value={item.description} onChange={(v) => updateArrayItem("projects", i, "description", v)} placeholder="Brief description of the project…" rows={2} />
              </Field>
              <Field label="URL (optional)">
                <Input value={item.url} onChange={(v) => updateArrayItem("projects", i, "url", v)} placeholder="https://github.com/…" />
              </Field>
            </div>
          ))}
          <AddButton label="Add Project" onClick={() => addToArray("projects", { name: "", description: "" })} />
        </Section>

        <Section id="skills" icon={Wrench} title="Skills" open={openSections.skills} onToggle={toggleSection} onAIAction={handleAIAction}>
          {skills.map((item, i) => (
            <div key={i} className="editor-skill-row">
              <Input
                value={typeof item === "string" ? item : item.name}
                onChange={(v) => updateArrayItem("skills", i, typeof item === "string" ? undefined : "name", v)}
                placeholder="e.g. React, TypeScript"
              />
              <RemoveButton onClick={() => removeFromArray("skills", i)} />
            </div>
          ))}
          <AddButton label="Add Skill" onClick={() => addToArray("skills", "")} />
        </Section>

        <Section id="certifications" icon={Award} title="Certifications" open={openSections.certifications} onToggle={toggleSection} onAIAction={handleAIAction}>
          {certs.map((item, i) => (
            <div key={i} className="editor-entry">
              <div className="editor-entry__header">
                <span className="editor-entry__label">Cert {i + 1}</span>
                <RemoveButton onClick={() => removeFromArray("certifications", i)} />
              </div>
              <div className="editor-grid">
                <Field label="Name">
                  <Input value={item.name} onChange={(v) => updateArrayItem("certifications", i, "name", v)} placeholder="AWS Solutions Architect" />
                </Field>
                <Field label="Issuer">
                  <Input value={item.issuer} onChange={(v) => updateArrayItem("certifications", i, "issuer", v)} placeholder="Amazon Web Services" />
                </Field>
              </div>
            </div>
          ))}
          <AddButton label="Add Certification" onClick={() => addToArray("certifications", { name: "", issuer: "" })} />
        </Section>

        <Section id="achievements" icon={Trophy} title="Achievements" open={openSections.achievements} onToggle={toggleSection} onAIAction={handleAIAction}>
          {achievements.map((item, i) => (
            <div key={i} className="editor-entry">
              <div className="editor-entry__header">
                <span className="editor-entry__label">Achievement {i + 1}</span>
                <RemoveButton onClick={() => removeFromArray("achievements", i)} />
              </div>
              <Field label="Title">
                <Input value={item.title} onChange={(v) => updateArrayItem("achievements", i, "title", v)} placeholder="Won Hackathon 2024" />
              </Field>
              <Field label="Description">
                <Textarea value={item.description} onChange={(v) => updateArrayItem("achievements", i, "description", v)} placeholder="Brief description…" rows={2} />
              </Field>
            </div>
          ))}
          <AddButton label="Add Achievement" onClick={() => addToArray("achievements", { title: "", description: "" })} />
        </Section>

        <Section id="languages" icon={Languages} title="Languages" open={openSections.languages} onToggle={toggleSection} onAIAction={handleAIAction}>
          {languages.map((item, i) => (
            <div key={i} className="editor-entry">
              <div className="editor-entry__header">
                <span className="editor-entry__label">Language {i + 1}</span>
                <RemoveButton onClick={() => removeFromArray("languages", i)} />
              </div>
              <div className="editor-grid">
                <Field label="Language">
                  <Input value={item.language} onChange={(v) => updateArrayItem("languages", i, "language", v)} placeholder="Spanish" />
                </Field>
                <Field label="Proficiency">
                  <Input value={item.proficiency} onChange={(v) => updateArrayItem("languages", i, "proficiency", v)} placeholder="Native / Fluent / Intermediate" />
                </Field>
              </div>
            </div>
          ))}
          <AddButton label="Add Language" onClick={() => addToArray("languages", { language: "", proficiency: "" })} />
        </Section>

        <Section id="links" icon={Link} title="Links" open={openSections.links} onToggle={toggleSection} onAIAction={handleAIAction}>
          {links.map((item, i) => (
            <div key={i} className="editor-entry">
              <div className="editor-entry__header">
                <span className="editor-entry__label">Link {i + 1}</span>
                <RemoveButton onClick={() => removeFromArray("links", i)} />
              </div>
              <div className="editor-grid">
                <Field label="Label">
                  <Input value={item.label} onChange={(v) => updateArrayItem("links", i, "label", v)} placeholder="GitHub" />
                </Field>
                <Field label="URL">
                  <Input value={item.url} onChange={(v) => updateArrayItem("links", i, "url", v)} placeholder="https://github.com/…" />
                </Field>
              </div>
            </div>
          ))}
          <AddButton label="Add Link" onClick={() => addToArray("links", { label: "", url: "" })} />
        </Section>
      </div>

      {/* Right Pane - Live Preview */}
      <div className="resume-editor__right">
        <ResumePreview data={data} template={template} onDownload={onSave} />
      </div>
    </div>
  );
});

ResumeEditor.displayName = "ResumeEditor";
export default ResumeEditor;