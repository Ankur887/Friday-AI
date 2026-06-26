import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";
import TemplateCard from "./TemplateCard";

const ALL_TEMPLATES = [
  { id: "modern", name: "Modern", tag: "Popular", category: "General" },
  { id: "classic", name: "Classic", tag: "", category: "General" },
  { id: "startup", name: "Startup", tag: "Trending", category: "Tech" },
  { id: "professional", name: "Professional", tag: "", category: "General" },
  { id: "minimal", name: "Minimal", tag: "", category: "General" },
  { id: "corporate", name: "Corporate", tag: "", category: "Business" },
  { id: "google", name: "Google", tag: "ATS Ready", category: "Tech" },
  { id: "stripe", name: "Stripe", tag: "", category: "Tech" },
  { id: "openai", name: "OpenAI", tag: "", category: "Tech" },
  { id: "microsoft", name: "Microsoft", tag: "", category: "Tech" },
  { id: "ats", name: "ATS", tag: "Best Score", category: "ATS" },
];

const CATEGORIES = ["All", "General", "Tech", "Business", "ATS"];

const ResumeTemplateGallery = memo(({ onSelectTemplate, selectedId }) => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = ALL_TEMPLATES.filter((t) => {
    const matchesSearch = t.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || t.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="template-gallery">
      {/* Controls */}
      <div className="template-gallery__controls">
        <div className="template-gallery__search">
          <Search size={14} className="template-gallery__search-icon" />
          <input
            className="template-gallery__search-input"
            placeholder="Search templates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="template-gallery__cats">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`template-gallery__cat ${
                activeCategory === cat ? "template-gallery__cat--active" : ""
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <motion.div
        className="template-gallery__grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {filtered.length === 0 ? (
          <div className="template-gallery__empty">
            <p>No templates match your search.</p>
          </div>
        ) : (
          filtered.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              selected={selectedId === t.id}
              onSelect={onSelectTemplate}
              onPreview={(t) => console.log("preview", t)}
            />
          ))
        )}
      </motion.div>
    </div>
  );
});

ResumeTemplateGallery.displayName = "ResumeTemplateGallery";
export default ResumeTemplateGallery;