import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { sendMessage, createConversation, uploadFile } from "../api/chat";
import { useAuth } from "../Auth/AuthContext";

const ACCEPTED = ".pdf,.txt,.py,.js,.ts,.csv,.md";

function readAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result.split(",")[1]);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function formatBytes(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function CopyButton({ code }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className={`text-xs px-3 py-1 rounded-md border-none cursor-pointer transition-all duration-200 ${copied ? "bg-green-500 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-500"}`}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

// ── Small icon button ─────────────────────────────────────────────────────────
function Btn({ onClick, title, children, red }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 26, height: 26, borderRadius: 6, border: "1px solid #e5e5e3",
        background: "#fff", cursor: "pointer", color: red ? "#dc2626" : "#6b7280",
        fontSize: 13, padding: 0, flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

const ICopy = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const ICheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
const IEdit = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const ITrash = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const IRetry = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>;

// ── AI message toolbar ────────────────────────────────────────────────────────
function AIToolbar({ content, onRetry }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 6, marginLeft: 2 }}>
      <Btn onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }} title={copied ? "Copied!" : "Copy"}>
        {copied ? <ICheck /> : <ICopy />}
      </Btn>
      <Btn onClick={onRetry} title="Retry for a better response"><IRetry /></Btn>
    </div>
  );
}

// ── User message toolbar ──────────────────────────────────────────────────────
function UserToolbar({ content, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: "flex", gap: 4, marginTop: 6, justifyContent: "flex-end" }}>
      <Btn onClick={onEdit} title="Edit message"><IEdit /></Btn>
      <Btn onClick={() => { navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }} title={copied ? "Copied!" : "Copy"}>
        {copied ? <ICheck /> : <ICopy />}
      </Btn>
      <Btn onClick={onDelete} title="Delete message" red><ITrash /></Btn>
    </div>
  );
}

function PdfChip({ name, size }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#f9f9f8", border: "1px solid #e5e5e3", borderRadius: 10, padding: "8px 12px", maxWidth: 280, marginBottom: 8 }}>
      <div style={{ width: 36, height: 36, borderRadius: 6, background: "#e8413a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <div style={{ overflow: "hidden" }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#1a1a1a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 180 }}>{name}</p>
        <p style={{ margin: 0, fontSize: 11, color: "#888", marginTop: 1 }}>PDF{size ? ` · ${size}` : ""}</p>
      </div>
    </div>
  );
}

function AttachmentChip({ file, onRemove }) {
  const isPdf = file.type === "pdf";
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: isPdf ? "#fff5f5" : "#f0f4ff", border: `1px solid ${isPdf ? "#fecaca" : "#bfdbfe"}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, maxWidth: 260 }}>
      {isPdf
        ? <div style={{ width: 22, height: 22, borderRadius: 4, background: "#e8413a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
        : <span style={{ fontSize: 15 }}>📄</span>
      }
      <span style={{ fontWeight: 500, color: isPdf ? "#b91c1c" : "#1d4ed8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{file.name}</span>
      <span style={{ color: "#9ca3af", fontSize: 11, fontFamily: "monospace", textTransform: "uppercase" }}>{file.type}</span>
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, lineHeight: 1, padding: "0 2px", marginLeft: 2 }}>×</button>
    </div>
  );
}

function MarkdownContent({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          const codeStr = String(children).replace(/\n$/, "");
          return !inline && match ? (
            <div className="rounded-xl overflow-hidden my-4 border border-gray-700">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-400 text-xs">
                <span className="font-mono">{match[1]}</span>
                <CopyButton code={codeStr} />
              </div>
              <SyntaxHighlighter style={oneDark} language={match[1]} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: 13, padding: "16px" }} {...props}>
                {codeStr}
              </SyntaxHighlighter>
            </div>
          ) : (
            <code className="bg-gray-100 text-red-500 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>
          );
        },
        h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-3 pb-2 border-b border-gray-200">{children}</h1>,
        h2: ({ children }) => <h2 className="text-xl font-bold mt-5 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
        p:  ({ children }) => <p className="mb-3 leading-8">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
        li: ({ children }) => <li className="leading-7 pl-1">{children}</li>,
        blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-400 pl-4 italic text-gray-500 my-4 bg-blue-50 py-2 rounded-r-lg">{children}</blockquote>,
        table: ({ children }) => <div className="overflow-x-auto my-4 rounded-lg border border-gray-200"><table className="min-w-full text-sm">{children}</table></div>,
        thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
        th:    ({ children }) => <th className="border-b border-gray-200 px-4 py-3 font-semibold text-left text-gray-700">{children}</th>,
        td:    ({ children }) => <td className="border-b border-gray-100 px-4 py-3 text-gray-600">{children}</td>,
        strong:({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
        em:    ({ children }) => <em className="italic">{children}</em>,
        a:     ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" className="text-blue-500 underline underline-offset-2 hover:text-blue-700">{children}</a>,
        hr: () => <hr className="my-4 border-gray-200" />,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

export default function Chat() {
  const { token, loading: authLoading } = useAuth();

  const [prompt,         setPrompt]         = useState("");
  const [messages,       setMessages]       = useState([]);
  const [sending,        setSending]        = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [attachedFile,   setAttachedFile]   = useState(null);
  const [uploading,      setUploading]      = useState(false);
  const [uploadError,    setUploadError]    = useState("");

  const fileInputRef = useRef(null);
  const bottomRef    = useRef(null);
  const textareaRef  = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);
  useEffect(() => { if (!authLoading && token) createNewConversation(); }, [authLoading, token]);

  async function createNewConversation() {
    try {
      const conv = await createConversation("New Chat", token);
      setConversationId(conv.id);
    } catch (err) { console.error("Failed to create conversation:", err.message); }
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(""); setUploading(true); setAttachedFile(null);
    const ext = file.name.split(".").pop().toLowerCase();
    const size = formatBytes(file.size);
    try {
      if (ext === "pdf") {
        const base64 = await readAsBase64(file);
        setAttachedFile({ name: file.name, type: "pdf", base64, size });
      } else {
        const result = await uploadFile(file, token);
        setAttachedFile({ name: file.name, type: result.file_type, content: result.content, size });
      }
    } catch (err) { setUploadError(err.message || "Failed to read file."); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ""; }
  }

  function removeAttachment() { setAttachedFile(null); setUploadError(""); }

  function handleEditMessage(content) {
    setPrompt(content);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + "px";
      }
    }, 50);
  }

  function handleDeleteMessage(index) {
    setMessages(prev => {
      const next = [...prev];
      const count = next[index + 1]?.role === "assistant" ? 2 : 1;
      next.splice(index, count);
      return next;
    });
  }

  async function handleRetry(assistantIndex) {
    const userMsg = messages.slice(0, assistantIndex).reverse().find(m => m.role === "user");
    if (!userMsg || sending) return;
    setMessages(prev => { const next = [...prev]; next.splice(assistantIndex, 1); return next; });
    setSending(true);
    try {
      let cid = conversationId;
      if (!cid) { const conv = await createConversation(userMsg.content.slice(0, 40) || "Chat", token); cid = conv.id; setConversationId(cid); }
      const result = await sendMessage(cid, userMsg.content, token,
        userMsg.attachment?.base64 ?? userMsg.attachment?.content ?? null,
        userMsg.attachment?.name ?? null,
        userMsg.attachment?.type ?? null,
      );
      setMessages(prev => [...prev, { role: "assistant", content: result }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setSending(false);
  }

  async function handleSend() {
    if (!prompt.trim() && !attachedFile) return;
    const messageText = prompt.trim() || "Please read this file and provide a comprehensive summary, key points, and any important insights.";
    const userMsg = { role: "user", content: messageText, attachment: attachedFile ? { ...attachedFile } : null };
    setMessages(prev => [...prev, userMsg]);
    setPrompt(""); setAttachedFile(null); setSending(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    try {
      let cid = conversationId;
      if (!cid) { const conv = await createConversation(messageText.slice(0, 40) || attachedFile?.name || "File Chat", token); cid = conv.id; setConversationId(cid); }
      const result = await sendMessage(cid, messageText, token,
        userMsg.attachment?.base64 ?? userMsg.attachment?.content ?? null,
        userMsg.attachment?.name ?? null,
        userMsg.attachment?.type ?? null,
      );
      setMessages(prev => [...prev, { role: "assistant", content: result }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
    }
    setSending(false);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="min-h-screen flex flex-col items-center bg-white">
      <div className="w-full max-w-3xl flex-1 px-4 pt-8 pb-48">

        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#f0f0ed", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-800">How can I help you today?</p>
            <p className="text-sm text-gray-400 mt-1">Ask anything, or attach a PDF to analyze it.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex mb-1 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

            {msg.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e8e8e4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 10, marginTop: 2, fontSize: 12, fontWeight: 600, color: "#555" }}>F</div>
            )}

            <div style={{ maxWidth: "80%" }}>
              {/* PDF chip */}
              {msg.role === "user" && msg.attachment?.type === "pdf" && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                  <PdfChip name={msg.attachment.name} size={msg.attachment.size} />
                </div>
              )}
              {/* Other file chip */}
              {msg.role === "user" && msg.attachment && msg.attachment.type !== "pdf" && (
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 6 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0f4ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "6px 12px", fontSize: 13 }}>
                    <span>📄</span>
                    <span style={{ fontWeight: 500, color: "#1d4ed8" }}>{msg.attachment.name}</span>
                  </div>
                </div>
              )}

              {/* Bubble */}
              {msg.content && (
                <div style={
                  msg.role === "user"
                    ? { background: "#f4f4f0", borderRadius: "18px 18px 4px 18px", padding: "10px 16px", fontSize: 14, lineHeight: 1.6, color: "#1a1a1a" }
                    : { fontSize: 14, lineHeight: 1.7, color: "#1a1a1a" }
                }>
                  {msg.role === "user" ? msg.content : <MarkdownContent content={msg.content} />}
                </div>
              )}

              {/* ALWAYS-VISIBLE toolbars */}
              {msg.role === "assistant" && (
                <AIToolbar content={msg.content} onRetry={() => handleRetry(i)} />
              )}
              {msg.role === "user" && (
                <UserToolbar
                  content={msg.content}
                  onEdit={() => handleEditMessage(msg.content)}
                  onDelete={() => handleDeleteMessage(i)}
                />
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex items-center gap-3 mb-6">
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e8e8e4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 600, color: "#555" }}>F</div>
            <div style={{ display: "flex", gap: 4, padding: "10px 14px", background: "#f4f4f0", borderRadius: "18px 18px 18px 4px" }}>
              {[0,1,2].map(j => <span key={j} style={{ width: 6, height: 6, borderRadius: "50%", background: "#aaa", display: "inline-block", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${j*0.2}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #f0f0ed", padding: "12px 16px 20px", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: 672 }}>
          {attachedFile && <div style={{ marginBottom: 8 }}><AttachmentChip file={attachedFile} onRemove={removeAttachment} /></div>}
          {attachedFile && !sending && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
              {[
                { label: "Summarize",     text: "Give me a comprehensive summary with key points." },
                { label: "Generate Q&A",  text: "Generate 10 important questions and answers." },
                { label: "Key Concepts",  text: "List and explain the key concepts in this document." },
                { label: "Bullet Points", text: "Extract the most important info as bullet points." },
                { label: "Quiz Me",       text: "Create a 5-question multiple-choice quiz from this." },
              ].map(({ label, text }) => (
                <button key={label} onClick={() => setPrompt(text)} style={{ padding: "4px 12px", fontSize: 12, background: "#f4f4f0", border: "1px solid #e5e5e3", borderRadius: 20, cursor: "pointer", color: "#555" }}>{label}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, background: "#f4f4f0", borderRadius: 16, padding: "8px 8px 8px 14px", border: "1px solid #e5e5e3" }}>
            <input ref={fileInputRef} type="file" accept={ACCEPTED} onChange={handleFileChange} style={{ display: "none" }} id="file-upload" />
            <label htmlFor="file-upload" style={{ width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", cursor: uploading ? "not-allowed" : "pointer", opacity: uploading ? 0.4 : 1, flexShrink: 0, marginBottom: 2, color: "#888" }} title="Attach file">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.41 17.41a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
            </label>
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachedFile ? `Ask anything about "${attachedFile.name}"…` : "Ask Friday anything…"}
              rows={1}
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", resize: "none", fontSize: 14, lineHeight: 1.6, color: "#1a1a1a", maxHeight: 160, overflowY: "auto", padding: "4px 0", fontFamily: "inherit" }}
              onInput={e => { e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px"; }}
            />
            {uploading && <div style={{ width: 18, height: 18, border: "2px solid #ddd", borderTopColor: "#555", borderRadius: "50%", animation: "spin 0.7s linear infinite", flexShrink: 0, marginBottom: 4 }} />}
            <button
              onClick={handleSend}
              disabled={sending || uploading || (!prompt.trim() && !attachedFile)}
              style={{ width: 32, height: 32, borderRadius: "50%", background: sending || uploading || (!prompt.trim() && !attachedFile) ? "#d1d1cb" : "#1a1a1a", border: "none", cursor: sending || uploading || (!prompt.trim() && !attachedFile) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
            </button>
          </div>
          {uploadError && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#dc2626" }}>⚠️ {uploadError}</p>}
        </div>
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,80%,100%{opacity:.3;transform:scale(.85)} 40%{opacity:1;transform:scale(1)} }
      `}</style>
    </div>
  );
}