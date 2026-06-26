// ── Template definitions ──────────────────────────────────────────────────────
// In production these could come from the backend.
// For now they live here and can be swapped for an API call.

export const TEMPLATES = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean two-column layout with accent colour",
    tag: "Popular",
    accentColor: "#6366F1",
    preview: null, // Set to a thumbnail URL when available
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Single column, maximum whitespace",
    tag: null,
    accentColor: "#A1A1AA",
    preview: null,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Traditional format for corporate roles",
    tag: "ATS Friendly",
    accentColor: "#2563EB",
    preview: null,
  },
  {
    id: "startup",
    name: "Startup",
    description: "Bold typography, personality-forward",
    tag: "Trending",
    accentColor: "#10B981",
    preview: null,
  },
  {
    id: "classic",
    name: "Classic",
    description: "Timeless serif-based design",
    tag: null,
    accentColor: "#78716C",
    preview: null,
  },
  {
    id: "ats",
    name: "ATS Pro",
    description: "Optimised for Applicant Tracking Systems",
    tag: "ATS #1",
    accentColor: "#F59E0B",
    preview: null,
  },
  {
    id: "google",
    name: "Google Style",
    description: "Inspired by Google engineering résumés",
    tag: null,
    accentColor: "#4285F4",
    preview: null,
  },
  {
    id: "stripe",
    name: "Stripe Style",
    description: "Crisp, detailed — engineering excellence",
    tag: null,
    accentColor: "#635BFF",
    preview: null,
  },
  {
    id: "openai",
    name: "OpenAI Style",
    description: "Monochrome minimalism, research-ready",
    tag: null,
    accentColor: "#10A37F",
    preview: null,
  },
];

export const templateService = {
  /** Return all templates (could be async API call in future) */
  list() {
    return Promise.resolve(TEMPLATES);
  },

  /** Find a template by id */
  get(id) {
    return Promise.resolve(TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]);
  },
};

export default templateService;


