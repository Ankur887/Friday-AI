// FILE: src/components/resume/ResumeTemplateGallery.jsx
// STYLE: resume.io — light bg, search bar, category pills, portrait template cards

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import TemplateCard from "./TemplateCard";

const ALL_TEMPLATES = [
  { id: "stockholm",    name: "Stockholm",    tag: "Most popular",  category: "General", color: "#1a56db" },
  { id: "new-york",     name: "New York",     tag: "ATS ready",     category: "ATS",     color: "#0e9f6e" },
  { id: "vienna",       name: "Vienna",       tag: "Creative",      category: "Creative", color: "#e3a008" },
  { id: "sydney",       name: "Sydney",       tag: "Modern",        category: "General", color: "#9061f9" },
  { id: "london",       name: "London",       tag: "Executive",     category: "Business", color: "#e02424" },
  { id: "dublin",       name: "Dublin",       tag: "Minimal",       category: "General", color: "#057a55" },
  { id: "berlin",       name: "Berlin",       tag: "",              category: "Creative", color: "#c2410c" },
  { id: "tokyo",        name: "Tokyo",        tag: "Trending",      category: "Tech",    color: "#0369a1" },
  { id: "paris",        name: "Paris",        tag: "",              category: "Creative", color: "#7c3aed" },
  { id: "chicago",      name: "Chicago",      tag: "ATS best",      category: "ATS",     color: "#374151" },
  { id: "amsterdam",    name: "Amsterdam",    tag: "",              category: "General", color: "#0f766e" },
  { id: "toronto",      name: "Toronto",      tag: "",              category: "Business", color: "#b91c1c" },
];

const CATEGORIES = ["All", "General", "ATS", "Creative", "Tech", "Business"];

const ResumeTemplateGallery = memo(({ onSelectTemplate, selectedId }) => {
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");

  const filtered = ALL_TEMPLATES.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchCat    = category === "All" || t.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div>
      {/* Controls bar */}
      <div style={{
        display: "flex", gap: 12, alignItems: "center",
        marginBottom: 24, flexWrap: "wrap",
      }}>
        {/* Search */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          background: "#fff", border: "1.5px solid #e5e7eb",
          borderRadius: 8, padding: "0 14px",
          flex: "1 1 220px", maxWidth: 300, height: 40,
        }}>
          <Search size={15} color="#9ca3af"/>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates…"
            style={{
              border: "none", outline: "none", background: "none",
              fontSize: 13, color: "#374151", width: "100%",
            }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => {
            const active = category === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  padding: "7px 16px", borderRadius: 20,
                  border: active ? "1.5px solid #1a56db" : "1.5px solid #e5e7eb",
                  background: active ? "#eff6ff" : "#fff",
                  color: active ? "#1a56db" : "#6b7280",
                  fontSize: 12, fontWeight: active ? 700 : 500,
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Template count */}
      <div style={{ fontSize: 13, color: "#9ca3af", marginBottom: 16 }}>
        {filtered.length} template{filtered.length !== 1 ? "s" : ""}
        {category !== "All" ? ` in ${category}` : ""}
        {search ? ` matching "${search}"` : ""}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🔍</div>
          <p style={{ fontSize: 14 }}>No templates match your search.</p>
        </div>
      ) : (
        <motion.div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
            gap: 20,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {filtered.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
            >
              <TemplateCard
                template={t}
                selected={selectedId === t.id}
                onSelect={onSelectTemplate}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
});

ResumeTemplateGallery.displayName = "ResumeTemplateGallery";
export default ResumeTemplateGallery;