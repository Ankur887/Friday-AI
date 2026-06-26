const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const getHeaders = (extra = {}) => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
};

// ── Resume CRUD ───────────────────────────────────────────────────────────────
export const resumeService = {
  /** Fetch all resumes for the current user */
  async list() {
    const res = await fetch(`${API}/api/resumes`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to load resumes");
    return res.json();
  },

  /** Fetch a single resume */
  async get(id) {
    const res = await fetch(`${API}/api/resumes/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to load resume");
    return res.json();
  },

  /** Create a new resume */
  async create(payload) {
    const res = await fetch(`${API}/api/resumes`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create resume");
    return res.json();
  },

  /** Update a resume */
  async update(id, payload) {
    const res = await fetch(`${API}/api/resumes/${id}`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to save resume");
    return res.json();
  },

  /** Delete a resume */
  async delete(id) {
    const res = await fetch(`${API}/api/resumes/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete resume");
    return res.json();
  },

  /** Upload a resume file (PDF / DOCX) */
  async upload(file, onProgress) {
    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("file", file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API}/api/resumes/upload`);
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error("Upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Upload failed"));
      xhr.send(formData);
    });
  },

  /** Download resume as PDF */
  async downloadPDF(id, filename = "resume.pdf") {
    const token = localStorage.getItem("access_token");
    const res = await fetch(`${API}/api/resumes/${id}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Download failed");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  /** ATS Analysis */
  async analyzeATS(id) {
    const res = await fetch(`${API}/api/resumes/${id}/ats`, {
      method: "POST",
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error("ATS analysis failed");
    return res.json();
  },

  /** AI improvement for a section */
  async improveSection(id, section, action, content) {
    const res = await fetch(`${API}/api/resumes/${id}/ai-improve`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ section, action, content }),
    });
    if (!res.ok) throw new Error("AI improvement failed");
    return res.json();
  },

  /** Generate a full resume from scratch */
  async generateFromAI(payload) {
    const res = await fetch(`${API}/api/resumes/generate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("AI generation failed");
    return res.json();
  },
};

export default resumeService;