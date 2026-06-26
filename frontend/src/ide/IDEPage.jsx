import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Editor from "@monaco-editor/react";
import DebugPanel from './DebugPanel';

const API = "http://127.0.0.1:8000";
const LS_KEY = "friday_ide_files_v2";
const LS_PROJECT_KEY = "friday_ide_project_v2";

const EXT_LANG = {
  py:"python",js:"javascript",jsx:"javascript",ts:"typescript",tsx:"typescript",
  css:"css",scss:"scss",sass:"scss",less:"less",html:"html",htm:"html",xml:"xml",
  svg:"xml",json:"json",jsonc:"json",json5:"json",md:"markdown",mdx:"markdown",
  txt:"plaintext",env:"plaintext",log:"plaintext",sh:"shell",bash:"shell",
  zsh:"shell",fish:"shell",yml:"yaml",yaml:"yaml",toml:"plaintext",sql:"sql",
  psql:"sql",rs:"rust",go:"go",c:"c",cpp:"cpp",cc:"cpp",h:"c",hpp:"cpp",
  cs:"csharp",java:"java",kt:"kotlin",kts:"kotlin",rb:"ruby",php:"php",
  swift:"swift",dart:"dart",r:"r",lua:"lua",pl:"perl",ex:"elixir",exs:"elixir",
  hs:"haskell",scala:"scala",clj:"clojure",dockerfile:"dockerfile",tf:"hcl",
  hcl:"hcl",graphql:"graphql",gql:"graphql",proto:"proto",vue:"html",svelte:"html",
};
const getLanguage = (name="") => {
  const lower = name.toLowerCase();
  if (lower==="dockerfile") return "dockerfile";
  if (lower==="makefile") return "plaintext";
  if (lower===".env"||lower.startsWith(".env")) return "plaintext";
  return EXT_LANG[lower.split(".").pop()] || "plaintext";
};
const getLangLabel = (name="") => {
  const m = {python:"Python",javascript:"JavaScript",typescript:"TypeScript",css:"CSS",
    scss:"SCSS",less:"LESS",html:"HTML",xml:"XML",json:"JSON",markdown:"Markdown",
    shell:"Shell/Bash",yaml:"YAML",sql:"SQL",rust:"Rust",go:"Go",c:"C",cpp:"C++",
    csharp:"C#",java:"Java",kotlin:"Kotlin",ruby:"Ruby",php:"PHP",swift:"Swift",
    dart:"Dart",r:"R",lua:"Lua",perl:"Perl",elixir:"Elixir",haskell:"Haskell",
    scala:"Scala",clojure:"Clojure",dockerfile:"Dockerfile",hcl:"HCL/Terraform",
    graphql:"GraphQL"};
  return m[getLanguage(name)] || "Plain Text";
};
const RUNNABLE_LANGS = {
  python:"Python",javascript:"Node.js",typescript:"TypeScript",ruby:"Ruby",
  perl:"Perl",php:"PHP",lua:"Lua",r:"R",shell:"Bash",swift:"Swift",go:"Go",
  kotlin:"Kotlin",elixir:"Elixir",dart:"Dart",haskell:"Haskell",scala:"Scala",
  c:"C",cpp:"C++",rust:"Rust",java:"Java",csharp:"C#",
};
const DEBUGGABLE_LANGS = new Set(Object.keys(RUNNABLE_LANGS));
const isRunnable   = (n="") => getLanguage(n) in RUNNABLE_LANGS;
const isDebuggable = (n="") => DEBUGGABLE_LANGS.has(getLanguage(n));
const FILE_ICONS = {
  py:"🐍",js:"🟨",jsx:"⚛️",ts:"🔷",tsx:"⚛️",css:"🎨",scss:"🎨",sass:"🎨",
  less:"🎨",html:"🌐",htm:"🌐",xml:"📰",svg:"🖼️",json:"📋",md:"📝",mdx:"📝",
  env:"⚙️",sh:"💲",bash:"💲",zsh:"💲",yml:"📄",yaml:"📄",toml:"⚙️",lock:"🔒",
  sql:"🗄️",rs:"🦀",go:"🐹",c:"⚙️",cpp:"⚙️",h:"⚙️",hpp:"⚙️",cs:"💜",java:"☕",
  kt:"🟠",rb:"💎",php:"🐘",swift:"🍎",dart:"🎯",r:"📊",lua:"🌙",pl:"🐪",
  ex:"💜",exs:"💜",hs:"λ",scala:"⚡",clj:"🔵",dockerfile:"🐳",tf:"🟣",hcl:"🟣",
  graphql:"🔴",gql:"🔴",txt:"📄",log:"📋",proto:"📡",vue:"💚",svelte:"🔥",
};
const getFileIcon = (name="") => {
  const lower = name.toLowerCase();
  if (lower==="dockerfile") return "🐳";
  if (lower==="makefile") return "⚙️";
  if (lower.startsWith(".env")) return "⚙️";
  if (lower===".gitignore"||lower===".gitattributes") return "🔧";
  if (lower.startsWith(".")) return "⚙️";
  return FILE_ICONS[lower.split(".").pop()] || "📄";
};

function authHeaders(extra={}) {
  const t = localStorage.getItem("access_token");
  return { ...(t?{Authorization:`Bearer ${t}`}:{}), ...extra };
}

function saveFilesToStorage(files, projectName) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(
      files.map(f => ({ path:f.path, name:f.name, content:f.content }))
    ));
    localStorage.setItem(LS_PROJECT_KEY, projectName);
  } catch {}
}
function loadFilesFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const pn  = localStorage.getItem(LS_PROJECT_KEY) || "FRIDAY_AI";
    if (!raw) return { files: null, projectName: pn };
    const files = JSON.parse(raw).map(f => ({ ...f, isDirty: false }));
    return { files, projectName: pn };
  } catch { return { files: null, projectName: "FRIDAY_AI" }; }
}

function buildTree(flatFiles) {
  const root = { name:"", children:{}, isDir:true, path:"" };
  for (const file of flatFiles) {
    const parts = file.path.split("/").filter(Boolean);
    let node = root;
    for (let i=0;i<parts.length-1;i++) {
      const p = parts[i];
      if (!node.children[p]) node.children[p]={name:p,children:{},isDir:true,path:parts.slice(0,i+1).join("/")};
      node = node.children[p];
    }
    const fname = parts[parts.length-1];
    node.children[fname]={name:fname,isDir:false,path:file.path,content:file.content};
  }
  return root;
}

function renderInline(text) {
  const parts=[];
  const regex=/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|__[^_]+__)/g;
  let last=0,m,i=0;
  while((m=regex.exec(text))!==null){
    if(m.index>last) parts.push(<span key={i++}>{text.slice(last,m.index)}</span>);
    const t=m[0];
    if(t.startsWith("`")) parts.push(<code key={i++} style={{background:"#161b22",color:"#79c0ff",padding:"1px 5px",borderRadius:4,fontSize:"0.9em",fontFamily:"'Fira Code',monospace",border:"1px solid #30363d"}}>{t.slice(1,-1)}</code>);
    else if(t.startsWith("**")||t.startsWith("__")) parts.push(<strong key={i++} style={{color:"#e6edf3",fontWeight:700}}>{t.slice(2,-2)}</strong>);
    else if(t.startsWith("*")) parts.push(<em key={i++} style={{color:"#a5d6ff"}}>{t.slice(1,-1)}</em>);
    last=m.index+t.length;
  }
  if(last<text.length) parts.push(<span key={i++}>{text.slice(last)}</span>);
  return parts;
}
function InlineMarkdown({text}) {
  const lines=text.split("\n");
  return (
    <div>
      {lines.map((line,li)=>{
        if(!line.trim()) return <div key={li} style={{height:5}}/>;
        if(line.startsWith("### ")) return <div key={li} style={{fontWeight:700,color:"#c9d1d9",fontSize:13,margin:"8px 0 3px"}}>{line.slice(4)}</div>;
        if(line.startsWith("## "))  return <div key={li} style={{fontWeight:700,color:"#e6edf3",fontSize:14,margin:"10px 0 4px",borderBottom:"1px solid #21262d",paddingBottom:3}}>{line.slice(3)}</div>;
        if(line.startsWith("# "))   return <div key={li} style={{fontWeight:700,color:"#e6edf3",fontSize:15,margin:"12px 0 5px"}}>{line.slice(2)}</div>;
        if(line.match(/^[-*•] /))   return <div key={li} style={{display:"flex",gap:6,margin:"2px 0"}}><span style={{color:"#374151",flexShrink:0,marginTop:2}}>▸</span><span>{renderInline(line.replace(/^[-*•] /,""))}</span></div>;
        const nm=line.match(/^(\d+)\. (.+)/);
        if(nm) return <div key={li} style={{display:"flex",gap:6,margin:"2px 0"}}><span style={{color:"#6b7280",flexShrink:0,minWidth:16,textAlign:"right"}}>{nm[1]}.</span><span>{renderInline(nm[2])}</span></div>;
        return <div key={li} style={{lineHeight:1.65,margin:"1px 0"}}>{renderInline(line)}</div>;
      })}
    </div>
  );
}

// ── Code block: Copy + Apply to file ─────────────────────────────────────────
function CodeBlockMsg({lang, code, onApply, activeFile}) {
  const [copied, setCopied]   = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    onApply(code, lang);
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  };

  return (
    <div style={{borderRadius:8,overflow:"hidden",border:"1px solid #30363d",margin:"6px 0"}}>
      {/* toolbar */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"6px 12px",background:"#161b22",borderBottom:"1px solid #30363d"}}>
        <span style={{fontSize:11,color:"#8b949e",fontFamily:"monospace"}}>{lang||"code"}</span>
        <div style={{display:"flex",gap:6}}>
          {/* Copy */}
          <button
            onClick={()=>{navigator.clipboard.writeText(code);setCopied(true);setTimeout(()=>setCopied(false),1500);}}
            style={{padding:"3px 10px",background:copied?"#16a34a":"#21262d",
              border:"1px solid #30363d",color:"#e6edf3",borderRadius:5,fontSize:11,
              cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
            {copied ? "✓ Copied" : "⎘ Copy"}
          </button>
          {/* Apply to open file */}
          {activeFile && (
            <button
              onClick={handleApply}
              style={{padding:"3px 10px",
                background: applied ? "#16a34a" : "linear-gradient(135deg,#1d4ed8,#6366f1)",
                border:"none",color:"#fff",borderRadius:5,fontSize:11,
                cursor:"pointer",fontFamily:"inherit",fontWeight:700,
                display:"flex",alignItems:"center",gap:4,
                boxShadow: applied ? "none" : "0 0 0 1px #6366f1"}}>
              {applied
                ? "✓ Applied!"
                : <>⚡ Apply → <span style={{opacity:0.8,maxWidth:80,overflow:"hidden",
                    textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{activeFile.name}</span></>}
            </button>
          )}
        </div>
      </div>
      {/* code body */}
      <pre style={{margin:0,padding:"12px 14px",background:"#0d1117",overflowX:"auto",
        fontSize:12.5,lineHeight:1.65,color:"#e6edf3",
        fontFamily:"'Fira Code','Cascadia Code',monospace",whiteSpace:"pre"}}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Diff viewer ───────────────────────────────────────────────────────────────
function DiffViewer({original,modified,filename,onApply,onReject}) {
  const origLines = (original||"").split("\n");
  const modLines  = (modified||"").split("\n");
  const added     = modLines.filter(l=>!origLines.includes(l)).length;
  const removed   = origLines.filter(l=>!modLines.includes(l)).length;
  return (
    <div style={{border:"1px solid #30363d",borderRadius:10,overflow:"hidden",margin:"8px 0"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"8px 12px",background:"#161b22",borderBottom:"1px solid #30363d"}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:"#e6edf3",fontWeight:600}}>{filename}</span>
          <span style={{fontSize:10,color:"#34d399",background:"rgba(52,211,153,0.12)",padding:"1px 6px",borderRadius:10}}>+{added}</span>
          <span style={{fontSize:10,color:"#f87171",background:"rgba(248,113,113,0.12)",padding:"1px 6px",borderRadius:10}}>-{removed}</span>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={onReject} style={{padding:"4px 12px",background:"transparent",border:"1px solid #374151",color:"#8b949e",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕ Reject</button>
          <button onClick={onApply} style={{padding:"4px 12px",background:"#16a34a",border:"none",color:"#fff",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>✓ Apply</button>
        </div>
      </div>
      <div style={{maxHeight:240,overflowY:"auto",background:"#0d1117"}}>
        {modLines.slice(0,80).map((line,i)=>{
          const inOrig = origLines.includes(line);
          const color  = !inOrig ? "#34d399" : "#8b949e";
          const bg     = !inOrig ? "rgba(52,211,153,0.06)" : "transparent";
          const prefix = !inOrig ? "+" : " ";
          return (
            <div key={i} style={{display:"flex",background:bg,fontFamily:"'Fira Code',monospace",fontSize:11.5}}>
              <span style={{width:36,flexShrink:0,textAlign:"right",paddingRight:8,color:"#374151",userSelect:"none",borderRight:"1px solid #21262d",lineHeight:"1.7"}}>{i+1}</span>
              <span style={{width:16,flexShrink:0,textAlign:"center",color,lineHeight:"1.7"}}>{prefix}</span>
              <span style={{flex:1,padding:"0 8px",color,lineHeight:"1.7",whiteSpace:"pre"}}>{line}</span>
            </div>
          );
        })}
        {modLines.length>80 && <div style={{padding:"6px 14px",color:"#374151",fontSize:11}}>…{modLines.length-80} more lines</div>}
      </div>
    </div>
  );
}

// ── Agent action card ─────────────────────────────────────────────────────────
function AgentActionCard({action,onApply,onReject,files}) {
  const [applied,setApplied]=useState(false);
  if(applied) return (
    <div style={{padding:"8px 12px",borderRadius:8,background:"rgba(34,197,94,0.08)",
      border:"1px solid rgba(34,197,94,0.25)",fontSize:12,color:"#34d399",margin:"6px 0"}}>
      ✓ Applied to <code style={{background:"#161b22",padding:"1px 5px",borderRadius:3,fontSize:11}}>{action.file}</code>
    </div>
  );
  const origFile = files.find(f=>f.path===action.file||f.name===action.file);
  return (
    <div style={{margin:"6px 0",borderRadius:10,border:"1px solid #30363d",overflow:"hidden",background:"#0d1117"}}>
      <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 12px",background:"#161b22",borderBottom:"1px solid #21262d"}}>
        <span style={{fontSize:13}}>
          {action.type==="edit"?"✏️":action.type==="create"?"📄":action.type==="delete"?"🗑️":"📋"}
        </span>
        <span style={{fontSize:12,fontWeight:700,color:"#e6edf3",textTransform:"capitalize"}}>{action.type}</span>
        <code style={{fontSize:11,color:"#58a6ff",background:"rgba(88,166,255,0.1)",padding:"1px 7px",borderRadius:4,fontFamily:"'Fira Code',monospace"}}>{action.file}</code>
        {action.explanation&&<span style={{marginLeft:"auto",fontSize:11,color:"#4b5563",maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{action.explanation}</span>}
      </div>
      {action.code&&origFile&&(
        <DiffViewer
          original={origFile.content}
          modified={action.code}
          filename={action.file}
          onApply={()=>{onApply(action);setApplied(true);}}
          onReject={onReject}
        />
      )}
      {action.code&&!origFile&&(
        <div>
          <pre style={{margin:0,padding:"10px 14px",fontSize:11.5,color:"#e6edf3",fontFamily:"'Fira Code',monospace",maxHeight:200,overflowY:"auto",lineHeight:1.6}}>{action.code.slice(0,1000)}{action.code.length>1000?"…":""}</pre>
          <div style={{display:"flex",gap:6,padding:"8px 12px",borderTop:"1px solid #21262d"}}>
            <button onClick={onReject} style={{padding:"4px 12px",background:"transparent",border:"1px solid #374151",color:"#8b949e",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>✕ Reject</button>
            <button onClick={()=>{onApply(action);setApplied(true);}} style={{padding:"4px 12px",background:"#16a34a",border:"none",color:"#fff",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>✓ Create file</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FIX 1 — parseAgentResponse (bulletproof JSON extraction)
// ═══════════════════════════════════════════════════════════════════════════════
function extractJSON(raw) {
  // Strategy A: strip markdown code fences then parse whole string
  const stripped = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  try { return JSON.parse(stripped); } catch {}

  // Strategy B: grab the first balanced { … } block
  let depth = 0, start = -1;
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "{") { if (start === -1) start = i; depth++; }
    else if (raw[i] === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        try { return JSON.parse(raw.slice(start, i + 1)); } catch {}
        // move past this brace and keep looking
        start = -1;
      }
    }
  }
  return null;
}

function parseAgentResponse(raw, activeFile) {
  if (!raw) return { text: "", actions: [] };

  // ── Try to pull a JSON object out of whatever the AI returned ──────────────
  const obj = extractJSON(raw);

  if (obj) {
    // Shape: { edited_code, explanation }
    if (obj.edited_code && activeFile) {
      return {
        text: obj.explanation || "Here are my changes:",
        actions: [{
          type: "edit",
          file: activeFile.path,
          code: obj.edited_code,
          explanation: obj.explanation,
        }],
      };
    }

    // Shape: { actions: [...], message }
    if (Array.isArray(obj.actions)) {
      return {
        text: obj.message || obj.explanation || "Agent actions:",
        actions: obj.actions,
      };
    }

    // Shape: { code, explanation }  (simpler single-block response)
    if (obj.code && activeFile) {
      return {
        text: obj.explanation || obj.message || "Here is the code:",
        actions: [{
          type: "edit",
          file: activeFile.path,
          code: obj.code,
          explanation: obj.explanation,
        }],
      };
    }

    // Shape: { response } — treat as plain text
    if (obj.response) return { text: obj.response, actions: [] };
  }

  // ── No JSON — treat the whole thing as markdown prose ─────────────────────
  return { text: raw, actions: [] };
}

// ── Command Palette ───────────────────────────────────────────────────────────
function CommandPalette({onClose,onNewFile,onNewFolder,onOpenFolder,onToggleTerminal,onToggleDebug,onToggleSql,onToggleFriday,activeFile,onRun}) {
  const [query,setQuery]=useState("");
  const inputRef=useRef(null);
  useEffect(()=>{ inputRef.current?.focus(); },[]);

  const cmds = [
    {id:"new-file",   label:"New File",         icon:"📄", action:()=>onNewFile("")},
    {id:"new-folder", label:"New Folder",        icon:"📁", action:()=>onNewFolder("")},
    {id:"open-folder",label:"Open Folder",       icon:"📂", action:onOpenFolder},
    {id:"toggle-term",label:"Toggle Terminal",   icon:"💻", action:onToggleTerminal},
    {id:"toggle-debug",label:"Toggle Debug",     icon:"🐛", action:onToggleDebug},
    {id:"toggle-sql", label:"Toggle SQL IDE",    icon:"🗄",  action:onToggleSql},
    {id:"toggle-fri", label:"Toggle Friday AI",  icon:"⚡", action:onToggleFriday},
    ...(activeFile&&isRunnable(activeFile.name)?[{id:"run",label:`Run ${activeFile.name}`,icon:"▶",action:onRun}]:[]),
  ];

  const filtered = query
    ? cmds.filter(c=>c.label.toLowerCase().includes(query.toLowerCase()))
    : cmds;

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:20000,paddingTop:"15vh"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{width:560,background:"#161b22",border:"1px solid #30363d",borderRadius:12,overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,0.8)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderBottom:"1px solid #21262d"}}>
          <span style={{color:"#4b5563",fontSize:16}}>⌘</span>
          <input ref={inputRef} value={query} onChange={e=>setQuery(e.target.value)}
            onKeyDown={e=>{if(e.key==="Escape")onClose();if(e.key==="Enter"&&filtered[0]){filtered[0].action();onClose();}}}
            placeholder="Type a command…"
            style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#e6edf3",fontSize:14,fontFamily:"inherit"}}
          />
          <kbd style={{fontSize:10,color:"#4b5563",background:"#21262d",padding:"2px 6px",borderRadius:4,fontFamily:"monospace"}}>Esc</kbd>
        </div>
        <div style={{maxHeight:360,overflowY:"auto"}}>
          {filtered.length===0
            ? <div style={{padding:"16px",color:"#4b5563",fontSize:13,textAlign:"center"}}>No commands found</div>
            : filtered.map((cmd)=>(
              <div key={cmd.id} onClick={()=>{cmd.action();onClose();}}
                style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",cursor:"pointer",borderBottom:"1px solid #0d1117"}}
                onMouseEnter={e=>e.currentTarget.style.background="#1f2937"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                <span style={{fontSize:15,width:22,textAlign:"center"}}>{cmd.icon}</span>
                <span style={{fontSize:13,color:"#e6edf3"}}>{cmd.label}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ── File Tree ─────────────────────────────────────────────────────────────────
function TreeNode({node,depth,activeFile,onSelectFile,onDeleteFile,onRenameFile,onNewFile,onNewFolder,setContextMenu}) {
  const [expanded,setExpanded]=useState(depth<2);
  const children=node.isDir?Object.values(node.children).sort((a,b)=>a.isDir!==b.isDir?a.isDir?-1:1:a.name.localeCompare(b.name)):[];
  const isActive=!node.isDir&&activeFile?.path===node.path;
  if(node.isDir&&depth===0) return <div>{children.map(c=><TreeNode key={c.path||c.name} node={c} depth={depth+1} activeFile={activeFile} onSelectFile={onSelectFile} onDeleteFile={onDeleteFile} onRenameFile={onRenameFile} onNewFile={onNewFile} onNewFolder={onNewFolder} setContextMenu={setContextMenu}/>)}</div>;
  return (
    <div>
      <div
        onClick={()=>node.isDir?setExpanded(v=>!v):onSelectFile(node)}
        onContextMenu={e=>{e.preventDefault();e.stopPropagation();setContextMenu({x:e.clientX,y:e.clientY,node});}}
        style={{display:"flex",alignItems:"center",gap:4,padding:`4px 8px 4px ${depth*12+6}px`,cursor:"pointer",background:isActive?"#1f2937":"transparent",borderLeft:isActive?"2px solid #58a6ff":"2px solid transparent",userSelect:"none"}}
        onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background="#161b22";}}
        onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background="transparent";}}
      >
        {node.isDir?<span style={{fontSize:10,color:"#6b7280",width:12,textAlign:"center"}}>{expanded?"▾":"▸"}</span>:<span style={{width:12}}/>}
        <span style={{fontSize:12,flexShrink:0}}>{node.isDir?(expanded?"📂":"📁"):getFileIcon(node.name)}</span>
        <span style={{fontSize:12.5,color:isActive?"#e6edf3":node.isDir?"#c9d1d9":"#8b949e",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",fontWeight:node.isDir?600:400}}>{node.name}</span>
      </div>
      {node.isDir&&expanded&&<div>{children.map(c=><TreeNode key={c.path||c.name} node={c} depth={depth+1} activeFile={activeFile} onSelectFile={onSelectFile} onDeleteFile={onDeleteFile} onRenameFile={onRenameFile} onNewFile={onNewFile} onNewFolder={onNewFolder} setContextMenu={setContextMenu}/>)}</div>}
    </div>
  );
}
function ContextMenu({menu,onClose,onNewFile,onNewFolder,onRename,onDelete}) {
  const ref=useRef(null);
  useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))onClose();};window.addEventListener("mousedown",h);return()=>window.removeEventListener("mousedown",h);},[onClose]);
  const items=menu.node.isDir
    ?[{label:"New File",icon:"📄",action:()=>{onNewFile(menu.node.path);onClose();}},{label:"New Folder",icon:"📁",action:()=>{onNewFolder(menu.node.path);onClose();}},null,{label:"Rename",icon:"✏️",action:()=>{onRename(menu.node);onClose();}},{label:"Delete",icon:"🗑️",action:()=>{onDelete(menu.node);onClose();},danger:true}]
    :[{label:"Rename",icon:"✏️",action:()=>{onRename(menu.node);onClose();}},{label:"Delete",icon:"🗑️",action:()=>{onDelete(menu.node);onClose();},danger:true}];
  return (
    <div ref={ref} style={{position:"fixed",top:menu.y,left:menu.x,zIndex:9999,background:"#1c2128",border:"1px solid #30363d",borderRadius:8,padding:"4px 0",minWidth:160,boxShadow:"0 8px 24px rgba(0,0,0,0.5)"}}>
      {items.map((item,i)=>item===null?<div key={i} style={{height:1,background:"#30363d",margin:"4px 0"}}/>
        :<div key={i} onClick={item.action} style={{padding:"7px 14px",display:"flex",alignItems:"center",gap:8,fontSize:13,cursor:"pointer",color:item.danger?"#f87171":"#c9d1d9"}}
          onMouseEnter={e=>e.currentTarget.style.background="#30363d"}
          onMouseLeave={e=>e.currentTarget.style.background="transparent"}
        ><span>{item.icon}</span>{item.label}</div>
      )}
    </div>
  );
}
function FileTreePanel({files,activeFile,onSelectFile,onNewFile,onNewFolder,onDeleteFile,onRenameFile,onOpenFolder,projectName}) {
  const [contextMenu,setContextMenu]=useState(null);
  const tree=useMemo(()=>buildTree(files),[files]);
  return (
    <div style={{height:"100%",display:"flex",flexDirection:"column",background:"#0d1117"}}>
      <div style={{padding:"8px 10px 6px",borderBottom:"1px solid #21262d",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
          <span style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:"1px",textTransform:"uppercase"}}>Explorer</span>
          <div style={{display:"flex",gap:2}}>
            {[{title:"New File",icon:"📄",action:()=>onNewFile("")},{title:"New Folder",icon:"📁",action:()=>onNewFolder("")},{title:"Open Folder",icon:"📂",action:onOpenFolder}].map(btn=>(
              <button key={btn.title} onClick={btn.action} title={btn.title} style={{background:"transparent",border:"none",color:"#6b7280",cursor:"pointer",padding:"2px 4px",borderRadius:4,fontSize:13}}
                onMouseEnter={e=>e.currentTarget.style.color="#e6edf3"} onMouseLeave={e=>e.currentTarget.style.color="#6b7280"}>{btn.icon}</button>
            ))}
          </div>
        </div>
        {projectName&&<div style={{fontSize:11,fontWeight:700,color:"#c9d1d9",letterSpacing:"0.3px",textTransform:"uppercase",padding:"2px 0"}}>{projectName}</div>}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"4px 0"}} onContextMenu={e=>{e.preventDefault();setContextMenu({x:e.clientX,y:e.clientY,node:{isDir:true,path:"",name:""}});}}>
        {files.length===0
          ?<div style={{padding:"24px 12px",textAlign:"center"}}><p style={{color:"#4b5563",fontSize:12,margin:"0 0 12px"}}>No files yet.</p><button onClick={onOpenFolder} style={{padding:"6px 14px",background:"#1d4ed8",border:"none",color:"#fff",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Open Folder</button></div>
          :<TreeNode node={tree} depth={0} activeFile={activeFile} onSelectFile={onSelectFile} onDeleteFile={onDeleteFile} onRenameFile={onRenameFile} onNewFile={onNewFile} onNewFolder={onNewFolder} setContextMenu={setContextMenu}/>
        }
      </div>
      {contextMenu&&<ContextMenu menu={contextMenu} onClose={()=>setContextMenu(null)} onNewFile={onNewFile} onNewFolder={onNewFolder} onRename={onRenameFile} onDelete={onDeleteFile}/>}
    </div>
  );
}

function EditorTabs({openFiles,activeFile,onSelectTab,onCloseTab}) {
  return (
    <div style={{display:"flex",background:"#010409",borderBottom:"1px solid #21262d",overflowX:"auto",flexShrink:0,minHeight:35,scrollbarWidth:"none"}}>
      {openFiles.map(file=>{
        const isActive=activeFile?.path===file.path;
        return (
          <div key={file.path} onClick={()=>onSelectTab(file)} style={{display:"flex",alignItems:"center",gap:6,padding:"0 12px",cursor:"pointer",whiteSpace:"nowrap",borderRight:"1px solid #21262d",flexShrink:0,background:isActive?"#0d1117":"transparent",borderBottom:isActive?"2px solid #58a6ff":"2px solid transparent"}}>
            <span style={{fontSize:11}}>{getFileIcon(file.name)}</span>
            <span style={{fontSize:12.5,color:isActive?"#e6edf3":"#6b7280"}}>{file.name}</span>
            {file.isDirty&&<span style={{color:"#f97316",fontSize:9}}>●</span>}
            <button onClick={e=>{e.stopPropagation();onCloseTab(file.path);}} style={{background:"transparent",border:"none",color:"#4b5563",cursor:"pointer",padding:"0 0 0 2px",fontSize:14,lineHeight:1}}
              onMouseEnter={e=>e.currentTarget.style.color="#e6edf3"} onMouseLeave={e=>e.currentTarget.style.color="#4b5563"}>×</button>
          </div>
        );
      })}
    </div>
  );
}
function Breadcrumb({activeFile}) {
  if(!activeFile) return null;
  const parts=activeFile.path.split("/");
  return (
    <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 14px",background:"#010409",borderBottom:"1px solid #161b22",flexShrink:0,overflowX:"auto",scrollbarWidth:"none"}}>
      {parts.map((p,i)=>(
        <React.Fragment key={i}>
          {i>0&&<span style={{color:"#374151",fontSize:11}}>›</span>}
          <span style={{fontSize:11,color:i===parts.length-1?"#e6edf3":"#6b7280",whiteSpace:"nowrap"}}>{i===parts.length-1?<span>{getFileIcon(p)} {p}</span>:p}</span>
        </React.Fragment>
      ))}
      <span style={{marginLeft:"auto",fontSize:10,color:"#374151",whiteSpace:"nowrap"}}>{getLangLabel(activeFile.name)}</span>
    </div>
  );
}

function TerminalPanel({output,onRun,onClear,activeFile,running,height,onResize,onToggle,expanded,onToggleExpand}) {
  const lang=getLanguage(activeFile?.name||"");
  const canRun=isRunnable(activeFile?.name||"");
  const langLabel=activeFile?(RUNNABLE_LANGS[lang]||getLangLabel(activeFile.name)):"";
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[output]);
  const handleDragStart=useCallback((e)=>{
    e.preventDefault();const startY=e.clientY;const startH=height;
    const onMove=(ev)=>onResize(Math.max(80,Math.min(700,startH+(startY-ev.clientY))));
    const onUp=()=>{document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
    document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onUp);
  },[height,onResize]);
  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#010409"}}>
      <div onMouseDown={handleDragStart} style={{height:5,background:"transparent",cursor:"ns-resize",flexShrink:0,borderTop:"1px solid #21262d",position:"relative",zIndex:10,transition:"background 0.15s"}}
        onMouseEnter={e=>e.currentTarget.style.background="#1f6feb55"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",display:"flex",gap:3}}>
          {[0,1,2].map(i=><div key={i} style={{width:3,height:3,borderRadius:"50%",background:"#374151"}}/>)}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"4px 12px",borderBottom:"1px solid #21262d",flexShrink:0,background:"#0d1117"}}>
        <div style={{display:"flex",alignItems:"center",gap:5}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:"#22c55e"}}/>
          <span style={{fontSize:11,color:"#6b7280",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.6px"}}>Terminal</span>
          {activeFile&&canRun&&<span style={{fontSize:10,color:"#374151"}}>{langLabel}</span>}
        </div>
        {canRun&&(
          <button onClick={onRun} disabled={running} style={{padding:"3px 10px",background:running?"#374151":"#16a34a",border:"none",color:"#fff",borderRadius:5,fontSize:11,cursor:running?"not-allowed":"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:4}}>
            {running?<><span style={{width:7,height:7,borderRadius:"50%",border:"2px solid #fff",borderTopColor:"transparent",display:"inline-block",animation:"spin 0.7s linear infinite"}}/>Running…</>:`▶ Run ${langLabel}`}
          </button>
        )}
        <div style={{marginLeft:"auto",display:"flex",gap:4,alignItems:"center"}}>
          <button onClick={onClear} style={{padding:"2px 8px",background:"transparent",border:"1px solid #21262d",color:"#6b7280",borderRadius:4,fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
          <button onClick={onToggleExpand} style={{padding:"2px 7px",background:"transparent",border:"1px solid #21262d",color:"#6b7280",borderRadius:4,fontSize:12,cursor:"pointer",lineHeight:1}}>{expanded?"⊟":"⊞"}</button>
          <button onClick={onToggle} style={{padding:"2px 7px",background:"transparent",border:"1px solid #21262d",color:"#6b7280",borderRadius:4,fontSize:14,cursor:"pointer",lineHeight:1}}>×</button>
        </div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"10px 14px",fontFamily:"'Fira Code',monospace",fontSize:12.5}}>
        {output.length===0
          ?<span style={{color:"#374151"}}>$ {canRun?`Click ▶ Run ${langLabel} to execute`:"Terminal output appears here"}</span>
          :output.map((line,i)=><div key={i} style={{color:line.type==="error"?"#f87171":line.type==="info"?"#60a5fa":"#86efac",lineHeight:1.7}}>{line.text}</div>)
        }
        <div ref={bottomRef}/>
      </div>
    </div>
  );
}

function StatusBar({activeFile,saved,terminalOpen,onToggleTerminal,debugOpen,onToggleDebug,fileCount,sqlOpen,onToggleSql}) {
  const canRun=isRunnable(activeFile?.name||"");
  return (
    <div style={{height:24,background:"#1f6feb",display:"flex",alignItems:"center",padding:"0 12px",gap:16,flexShrink:0}}>
      <span style={{fontSize:11,color:"#cfe2ff",fontWeight:700}}>⚡ Friday IDE</span>
      <button onClick={onToggleTerminal} style={{background:"transparent",border:"none",color:terminalOpen?"#fff":"#93c5fd",fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:0}}>{terminalOpen?"▾ Terminal":"▸ Terminal"}</button>
      <button onClick={onToggleSql} style={{background:"transparent",border:"none",color:sqlOpen?"#bfdbfe":"#93c5fd",fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:0}}>{sqlOpen?"▾ SQL IDE":"▸ SQL IDE"}</button>
      {isDebuggable(activeFile?.name||"")&&<button onClick={onToggleDebug} style={{background:"transparent",border:"none",color:debugOpen?"#fb923c":"#93c5fd",fontSize:11,cursor:"pointer",fontFamily:"inherit",padding:0}}>{debugOpen?"▾ Debug":"▸ Debug"}</button>}
      {fileCount>0&&<span style={{fontSize:11,color:"#93c5fd"}}>{fileCount} files</span>}
      <span style={{marginLeft:"auto",fontSize:11,color:"#cfe2ff"}}>{activeFile?getLangLabel(activeFile.name):""}{canRun&&<span style={{marginLeft:6,color:"#86efac",fontSize:10}}>● runnable</span>}</span>
      {activeFile?.path&&<span style={{fontSize:11,color:"#93c5fd",opacity:0.7}}>{activeFile.path}</span>}
      {activeFile&&<span style={{fontSize:11,color:saved?"#86efac":"#f97316"}}>{saved?"✓ Saved":"● Unsaved"}</span>}
    </div>
  );
}

function InputDialog({title,placeholder,defaultValue="",onConfirm,onCancel}) {
  const [val,setVal]=useState(defaultValue);
  const ref=useRef(null);
  useEffect(()=>{ref.current?.focus();ref.current?.select();},[]);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:10000}}>
      <div style={{background:"#161b22",border:"1px solid #30363d",borderRadius:12,padding:22,width:340}}>
        <h3 style={{color:"#e6edf3",margin:"0 0 14px",fontSize:14,fontWeight:700}}>{title}</h3>
        <input ref={ref} value={val} onChange={e=>setVal(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter"&&val.trim())onConfirm(val.trim());if(e.key==="Escape")onCancel();}}
          placeholder={placeholder}
          style={{width:"100%",padding:"9px 12px",background:"#0d1117",border:"1px solid #30363d",borderRadius:8,color:"#e6edf3",fontSize:13.5,outline:"none",fontFamily:"inherit",boxSizing:"border-box"}}
        />
        <div style={{display:"flex",gap:8,marginTop:14,justifyContent:"flex-end"}}>
          <button onClick={onCancel} style={{padding:"7px 14px",background:"transparent",border:"1px solid #30363d",color:"#8b949e",borderRadius:7,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>Cancel</button>
          <button onClick={()=>val.trim()&&onConfirm(val.trim())} style={{padding:"7px 14px",background:"#1d4ed8",border:"none",color:"#fff",borderRadius:7,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>OK</button>
        </div>
      </div>
    </div>
  );
}

function ResizableDebugPanel({activeFile,onClose,onApplyEdit,height,onResize,expanded,onToggleExpand,autoAnalyze}) {
  const handleDragStart=useCallback((e)=>{
    e.preventDefault();const startY=e.clientY;const startH=height;
    const onMove=(ev)=>onResize(Math.max(120,Math.min(900,startH+(startY-ev.clientY))));
    const onUp=()=>{document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
    document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onUp);
  },[height,onResize]);
  return (
    <div style={{height:expanded?"100%":height,flexShrink:0,display:"flex",flexDirection:"column",overflow:"hidden",borderTop:"1px solid #21262d",boxShadow:"0 -1px 0 #f97316"}}>
      <div onMouseDown={handleDragStart} style={{height:5,flexShrink:0,cursor:"ns-resize",background:"transparent",position:"relative",zIndex:10,transition:"background 0.15s"}}
        onMouseEnter={e=>e.currentTarget.style.background="#f9731633"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",display:"flex",gap:3}}>
          {[0,1,2].map(i=><div key={i} style={{width:3,height:3,borderRadius:"50%",background:"#f97316aa"}}/>)}
        </div>
      </div>
      <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <DebugPanel activeFile={activeFile} onClose={onClose} onApplyEdit={onApplyEdit} onToggleExpand={onToggleExpand} expanded={expanded} autoAnalyze={autoAnalyze}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FRIDAY AI AGENT PANEL
// ═══════════════════════════════════════════════════════════════════════════════
function FridayPanel({activeFile,files,onApplyEdit,onCreateFile,onDeleteFile,convId,setConvId,fridayWidth,onFridayDragStart,editorRef}) {
  const [messages,setMessages]=useState([{
    role:"assistant",
    content:"Hi! I'm Friday — your AI coding agent.\n\nI can **read your files**, **edit code directly**, explain, debug, refactor, and create new files. I understand your whole project context.\n\nWhat would you like to work on?"
  }]);
  const [prompt,setPrompt]=useState("");
  const [loading,setLoading]=useState(false);
  const [agentMode,setAgentMode]=useState(true);
  const bottomRef=useRef(null);
  useEffect(()=>{bottomRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);

  useEffect(()=>{
    const ensureConv=async()=>{
      const t=localStorage.getItem("access_token");
      if(!t||convId) return;
      try {
        const res=await fetch(`${API}/conversation`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${t}`},body:JSON.stringify({title:"Friday IDE Agent"})});
        const data=await res.json();
        if(data.id) setConvId(data.id);
      } catch {}
    };
    ensureConv();
  },[convId,setConvId]);

  const buildProjectContext=useCallback(()=>{
    const tree=files.map(f=>f.path).join("\n");
    const openCtx=activeFile
      ?`\n\n## Currently open file: ${activeFile.path}\n\`\`\`${getLanguage(activeFile.name)}\n${activeFile.content.slice(0,8000)}${activeFile.content.length>8000?"\n... (truncated)":""}\n\`\`\``
      :"\n\n[No file open]";
    return `## Project structure:\n${tree}${openCtx}`;
  },[files,activeFile]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FIX 2 — Apply code directly into Monaco without a React re-render cycle
  // ═══════════════════════════════════════════════════════════════════════════
  const handleApplyCode = useCallback((code) => {
    if (!activeFile) return;

    // Instant Monaco API apply — no flicker, no re-render needed first
    if (editorRef?.current) {
      const model = editorRef.current.getModel();
      if (model) {
        const fullRange = model.getFullModelRange();
        editorRef.current.executeEdits("friday-agent", [{
          range: fullRange,
          text: code,
          forceMoveMarkers: true,
        }]);
        editorRef.current.pushUndoStop();
      }
    }

    // Also keep React state in sync
    onApplyEdit(activeFile.path, code);

    setMessages(prev => [...prev, {
      role: "assistant",
      content: `✅ Applied to \`${activeFile.path.split("/").pop()}\``,
    }]);
  }, [activeFile, onApplyEdit, editorRef]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FIX 3 — Clean send: agent path vs chat path, no JSON double-wrapping
  // ═══════════════════════════════════════════════════════════════════════════
  const handleSend = async () => {
    if (!prompt.trim() || loading) return;
    const userMsg = prompt.trim();
    setPrompt("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const t = localStorage.getItem("access_token");
      const headers = { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };

      // Ensure we have a conversation id for /chat
      let activeConvId = convId;
      if (!activeConvId) {
        try {
          const r = await fetch(`${API}/conversation`, { method:"POST", headers, body: JSON.stringify({ title:"Friday IDE" }) });
          const d = await r.json();
          activeConvId = d.id;
          setConvId(d.id);
        } catch {}
      }

      const projectCtx = buildProjectContext();
      let raw = "";

      // ── Agent mode: dedicated /agent/edit endpoint ─────────────────────────
      if (agentMode && activeFile) {
        try {
          const res = await fetch(`${API}/agent/edit`, {
            method: "POST", headers,
            body: JSON.stringify({
              instruction: userMsg,
              current_file: activeFile.path,
              current_code: activeFile.content,
              context: projectCtx,
            }),
          });
          const data = await res.json();

          // Backend already gave us parsed fields — use them directly
          if (data.edited_code) {
            const parsed = {
              text: data.explanation || "Here are my changes:",
              actions: [{
                type: "edit",
                file: activeFile.path,
                code: data.edited_code,
                explanation: data.explanation,
              }],
            };
            setMessages(prev => [...prev, { role: "assistant", content: parsed.text, actions: parsed.actions }]);
            setLoading(false);
            return;
          }

          // Backend returned a prose response (explanation only)
          raw = data.response || data.explanation || data.message || JSON.stringify(data);
        } catch {
          // /agent/edit doesn't exist — fall through to /chat
          raw = "";
        }
      }

      // ── Chat mode (or agent/edit fallback) ────────────────────────────────
      if (!raw) {
        if (!activeConvId) {
          setMessages(prev => [...prev, { role:"assistant", content:"Please sign in to use Friday AI." }]);
          setLoading(false); return;
        }

        // Build system context. In agent mode, ask for JSON; in chat mode, prose.
        const systemNote = agentMode && activeFile
          ? `You are Friday, an expert AI coding agent.\n${projectCtx}\n\nWhen the user asks you to EDIT or FIX code, respond with ONLY valid JSON (no markdown fences):\n{"edited_code": "...complete file...", "explanation": "..."}\n\nFor questions or explanations, respond in plain markdown.`
          : `You are Friday, an expert AI coding assistant.\n${projectCtx}`;

        const res = await fetch(`${API}/chat`, {
          method: "POST", headers, credentials: "include",
          body: JSON.stringify({ conversation_id: activeConvId, message: `${systemNote}\n\nUser: ${userMsg}` }),
        });
        const data = await res.json();
        raw = data.response || "";
      }

      // ── Parse whatever raw string we got ─────────────────────────────────
      const parsed = parseAgentResponse(raw, activeFile);
      setMessages(prev => [...prev, { role:"assistant", content: parsed.text, actions: parsed.actions }]);

    } catch (e) {
      setMessages(prev => [...prev, { role:"assistant", content:"Failed to connect to backend." }]);
    }
    setLoading(false);
  };

  const handleApplyAction = useCallback((action) => {
    if (action.type === "edit" || action.type === "create") {
      if (!action.code) return;
      const existingFile = files.find(f => f.path === action.file || f.name === action.file);
      if (existingFile) {
        // Use Monaco API if it's the currently open file
        if (activeFile?.path === existingFile.path && editorRef?.current) {
          const model = editorRef.current.getModel();
          if (model) {
            editorRef.current.executeEdits("friday-agent", [{
              range: model.getFullModelRange(),
              text: action.code,
              forceMoveMarkers: true,
            }]);
            editorRef.current.pushUndoStop();
          }
        }
        onApplyEdit(existingFile.path, action.code);
      } else {
        onCreateFile(action.file, action.code);
      }
    } else if (action.type === "delete") {
      onDeleteFile({ path: action.file, name: action.file.split("/").pop(), isDir: false });
    }
  }, [files, activeFile, onApplyEdit, onCreateFile, onDeleteFile, editorRef]);

  // ── Render message content: code blocks + prose ───────────────────────────
  const renderMessageContent = useCallback((text) => {
    const blocks = [];
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    let lastIndex = 0, match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex)
        blocks.push({ type:"text", content: text.slice(lastIndex, match.index) });
      blocks.push({ type:"code", lang: match[1] || "plaintext", content: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length)
      blocks.push({ type:"text", content: text.slice(lastIndex) });

    return blocks.map((block, bi) =>
      block.type === "code"
        ? <CodeBlockMsg key={bi} lang={block.lang} code={block.content} onApply={handleApplyCode} activeFile={activeFile}/>
        : <InlineMarkdown key={bi} text={block.content}/>
    );
  }, [handleApplyCode, activeFile]);

  return (
    <div style={{display:"flex",height:"100%",background:"#0d1117",borderLeft:"1px solid #21262d",position:"relative"}}>
      {/* Drag handle */}
      <div onMouseDown={onFridayDragStart} style={{width:5,flexShrink:0,cursor:"ew-resize",background:"transparent",position:"absolute",left:0,top:0,bottom:0,zIndex:10}}
        onMouseEnter={e=>e.currentTarget.style.background="#1f6feb55"}
        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",gap:3}}>
          {[0,1,2].map(i=><div key={i} style={{width:3,height:3,borderRadius:"50%",background:"#374151"}}/>)}
        </div>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",paddingLeft:5}}>
        {/* Header */}
        <div style={{padding:"8px 14px",borderBottom:"1px solid #21262d",flexShrink:0,display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:"#22c55e"}}/>
            <span style={{fontSize:13,fontWeight:700,color:"#e6edf3"}}>Friday</span>
            <span style={{fontSize:10,color:"#4b5563",marginLeft:2}}>AI Agent</span>
          </div>

          <button onClick={()=>setAgentMode(v=>!v)}
            title={agentMode?"Agent mode: edits files directly":"Chat mode"}
            style={{padding:"2px 8px",background:agentMode?"rgba(99,102,241,0.15)":"transparent",border:`1px solid ${agentMode?"#6366f1":"#30363d"}`,color:agentMode?"#818cf8":"#6b7280",borderRadius:10,fontSize:10,cursor:"pointer",fontFamily:"inherit",fontWeight:agentMode?700:400}}>
            {agentMode?"⚡ Agent":"💬 Chat"}
          </button>

          {activeFile&&<span style={{marginLeft:"auto",fontSize:10,color:"#58a6ff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:140}}>{activeFile.name}</span>}
          <button onClick={()=>setMessages([{role:"assistant",content:"Chat cleared."}])}
            style={{padding:"2px 7px",background:"transparent",border:"1px solid #30363d",color:"#6b7280",borderRadius:4,fontSize:10,cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
        </div>

        {/* Messages */}
        <div style={{flex:1,overflowY:"auto",padding:"10px",display:"flex",flexDirection:"column",gap:8}}>
          {messages.map((msg,i)=>{
            const isUser=msg.role==="user";
            return (
              <div key={i}>
                {isUser ? (
                  <div style={{display:"flex",justifyContent:"flex-end"}}>
                    <div style={{maxWidth:"88%",padding:"8px 12px",borderRadius:"12px 12px 3px 12px",background:"#1d4ed8",fontSize:13,color:"#e6edf3",lineHeight:1.6,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>{msg.content}</div>
                  </div>
                ) : (
                  <div style={{display:"flex",justifyContent:"flex-start"}}>
                    <div style={{maxWidth:"100%",width:"100%"}}>
                      {/* Prose / code blocks */}
                      <div style={{padding:"8px 12px",borderRadius:"12px 12px 12px 3px",background:"#161b22",border:"1px solid #21262d",fontSize:13,color:"#e6edf3",lineHeight:1.6}}>
                        {renderMessageContent(msg.content || "")}
                      </div>
                      {/* Action cards (diff viewer + apply/reject) */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div style={{marginTop:6}}>
                          {msg.actions.map((action, ai) => (
                            <AgentActionCard key={ai} action={action} files={files}
                              onApply={handleApplyAction}
                              onReject={()=>{}}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <div style={{display:"flex",gap:5,padding:"4px 2px",alignItems:"center"}}>
              {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:"#4b5563",animation:"dotBounce 1.2s infinite",animationDelay:`${i*0.2}s`}}/>)}
              <span style={{fontSize:11,color:"#374151",marginLeft:4}}>Friday is thinking…</span>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div style={{padding:"8px 10px",borderTop:"1px solid #21262d",flexShrink:0}}>
          {agentMode && activeFile && (
            <div style={{fontSize:10,color:"#4b5563",marginBottom:5,display:"flex",alignItems:"center",gap:4}}>
              <span style={{color:"#6366f1"}}>⚡</span>
              Agent context: <span style={{color:"#58a6ff"}}>{activeFile.name}</span>
              <span style={{color:"#374151"}}>+ {files.length} files</span>
            </div>
          )}
          <div style={{display:"flex",gap:6,alignItems:"flex-end",background:"#161b22",borderRadius:10,border:"1px solid #30363d",padding:"7px 10px"}}>
            <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();}}}
              placeholder={agentMode&&activeFile?`Ask Friday to edit ${activeFile.name}…`:"Ask Friday anything…"}
              rows={2}
              style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#e6edf3",fontSize:12.5,fontFamily:"inherit",resize:"none",lineHeight:1.5}}
            />
            <button onClick={handleSend} disabled={loading||!prompt.trim()}
              style={{background:prompt.trim()?"#1d4ed8":"#21262d",border:"none",color:prompt.trim()?"#fff":"#374151",borderRadius:7,padding:"5px 10px",cursor:prompt.trim()?"pointer":"not-allowed",fontSize:14,flexShrink:0}}>➤</button>
          </div>
          <p style={{fontSize:10,color:"#374151",margin:"3px 0 0",textAlign:"center"}}>Enter to send · Shift+Enter for newline</p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════
const DEFAULT_FILE = {
  path:"main.py", name:"main.py", isDirty:false,
  content:'# Welcome to Friday IDE\n# Powered by LLaMA 3.3 70B via Groq\n\ndef greet(name: str) -> str:\n    """Return a greeting message."""\n    return f"Hello, {name}!"\n\nif __name__ == "__main__":\n    print(greet("World"))\n'
};

export default function IDEPage() {
  const {files:savedFiles,projectName:savedProject} = useMemo(()=>loadFilesFromStorage(),[]);

  const [files,setFiles]               = useState(savedFiles||[DEFAULT_FILE]);
  const [openFiles,setOpenFiles]       = useState([]);
  const [activeFile,setActiveFile]     = useState(null);
  const [saved,setSaved]               = useState(true);
  const [fridayOpen,setFridayOpen]     = useState(true);
  const [sqlOpen,setSqlOpen]           = useState(false);
  const [terminalOpen,setTerminalOpen] = useState(true);
  const [debugOpen,setDebugOpen]       = useState(false);
  const [termOutput,setTermOutput]     = useState([]);
  const [running,setRunning]           = useState(false);
  const [projectName,setProjectName]   = useState(savedProject||"FRIDAY_AI");
  const [dialog,setDialog]             = useState(null);
  const [convId,setConvId]             = useState(null);
  const [paletteOpen,setPaletteOpen]   = useState(false);

  const [termHeight,setTermHeight]       = useState(200);
  const [termExpanded,setTermExpanded]   = useState(false);
  const [debugHeight,setDebugHeight]     = useState(320);
  const [debugExpanded,setDebugExpanded] = useState(false);
  const [sqlWidth,setSqlWidth]           = useState(600);
  const [sqlExpanded,setSqlExpanded]     = useState(false);
  const [fridayWidth,setFridayWidth]     = useState(380);
  const [autoAnalyze,setAutoAnalyze]     = useState(0);

  const saveTimerRef = useRef(null);
  const persistTimer = useRef(null);
  // FIX 2: editorRef passed down to FridayPanel for direct Monaco apply
  const editorRef    = useRef(null);

  useEffect(()=>{
    clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(()=>saveFilesToStorage(files,projectName),800);
  },[files,projectName]);

  useEffect(()=>{
    const h=e=>{
      if((e.ctrlKey||e.metaKey)&&e.shiftKey&&e.key==="P"){e.preventDefault();setPaletteOpen(v=>!v);}
      if((e.ctrlKey||e.metaKey)&&e.key==="s"){e.preventDefault();setSaved(true);}
      if(e.key==="Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]);

  const handleSqlDragStart=useCallback((e)=>{
    e.preventDefault();const startX=e.clientX;const startW=sqlWidth;
    const onMove=(ev)=>setSqlWidth(Math.max(380,Math.min(1100,startW+(startX-ev.clientX))));
    const onUp=()=>{document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
    document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onUp);
  },[sqlWidth]);

  const handleFridayDragStart=useCallback((e)=>{
    e.preventDefault();const startX=e.clientX;const startW=fridayWidth;
    const onMove=(ev)=>setFridayWidth(Math.max(300,Math.min(700,startW+(startX-ev.clientX))));
    const onUp=()=>{document.removeEventListener("mousemove",onMove);document.removeEventListener("mouseup",onUp);};
    document.addEventListener("mousemove",onMove);document.addEventListener("mouseup",onUp);
  },[fridayWidth]);

  const handleOpenDebug=useCallback(()=>{setDebugOpen(true);setAutoAnalyze(n=>n+1);},[]);
  const handleToggleDebug=useCallback(()=>{if(debugOpen)setDebugOpen(false);else handleOpenDebug();},[debugOpen,handleOpenDebug]);

  const handleOpenFolder=useCallback(async()=>{
    if(!window.showDirectoryPicker){alert("Folder access requires Chrome or Edge.");return;}
    try {
      const dirHandle=await window.showDirectoryPicker({mode:"readwrite"});
      setProjectName(dirHandle.name.toUpperCase());
      const loaded=[];
      async function readDir(handle,prefix=""){
        for await(const [name,entry] of handle.entries()){
          if(name.startsWith(".")&&name!==".env") continue;
          if(["node_modules","__pycache__",".git","dist","build",".next","venv","env",".venv"].includes(name)) continue;
          const path=prefix?`${prefix}/${name}`:name;
          if(entry.kind==="directory"){await readDir(entry,path);}
          else{try{const file=await entry.getFile();if(file.size>500_000)continue;const text=await file.text();loaded.push({path,name,content:text,isDirty:false});}catch{}}
        }
      }
      await readDir(dirHandle);
      loaded.sort((a,b)=>a.path.localeCompare(b.path));
      setFiles(loaded);setOpenFiles([]);setActiveFile(null);
      setTermOutput([{type:"info",text:`📂 Opened: ${dirHandle.name} (${loaded.length} files)`}]);
    } catch(e){if(e.name!=="AbortError")console.error(e);}
  },[]);

  const handleSelectFile=useCallback((node)=>{
    const file=files.find(f=>f.path===node.path);
    if(!file) return;
    setActiveFile(file);
    setOpenFiles(prev=>prev.find(f=>f.path===file.path)?prev:[...prev,file]);
  },[files]);

  const handleEditorChange=useCallback((value)=>{
    if(!activeFile) return;
    setSaved(false);
    const updated={...activeFile,content:value??"",isDirty:true};
    setActiveFile(updated);
    setFiles(prev=>prev.map(f=>f.path===updated.path?updated:f));
    setOpenFiles(prev=>prev.map(f=>f.path===updated.path?updated:f));
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current=setTimeout(()=>{
      setSaved(true);
      setFiles(prev=>prev.map(f=>f.path===updated.path?{...f,isDirty:false}:f));
      setOpenFiles(prev=>prev.map(f=>f.path===updated.path?{...f,isDirty:false}:f));
    },1500);
  },[activeFile]);

  const handleCloseTab=useCallback((path)=>{
    setOpenFiles(prev=>{const rest=prev.filter(f=>f.path!==path);setActiveFile(cur=>cur?.path===path?(rest[rest.length-1]||null):cur);return rest;});
  },[]);

  const handleApplyEdit=useCallback((path,newCode)=>{
    const up=f=>({...f,content:newCode,isDirty:false});
    setFiles(prev=>prev.map(f=>f.path===path?up(f):f));
    setOpenFiles(prev=>prev.map(f=>f.path===path?up(f):f));
    setActiveFile(cur=>cur?.path===path?up(cur):cur);
    setSaved(true);
  },[]);

  const handleCreateFile=useCallback((path,content="")=>{
    const name=path.split("/").pop();
    if(files.find(f=>f.path===path)) return;
    const f={path,name,content,isDirty:false};
    setFiles(prev=>[...prev,f]);
    setOpenFiles(prev=>[...prev,f]);
    setActiveFile(f);
  },[files]);

  const handleRun=useCallback(async()=>{
    if(!activeFile||!isRunnable(activeFile.name)||running) return;
    const lang=getLanguage(activeFile.name);
    const langLabel=RUNNABLE_LANGS[lang]||getLangLabel(activeFile.name);
    setRunning(true);
    setTermOutput(prev=>[...prev,{type:"info",text:`$ run ${activeFile.name} (${langLabel})`}]);
    try {
      const res=await fetch(`${API}/run-code`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code:activeFile.content,language:lang,filename:activeFile.name})});
      const data=await res.json();
      if(data.output) setTermOutput(prev=>[...prev,{type:"out",text:data.output}]);
      if(data.error)  setTermOutput(prev=>[...prev,{type:"error",text:data.error}]);
    } catch {setTermOutput(prev=>[...prev,{type:"error",text:"Could not connect to backend."}]);}
    setRunning(false);
  },[activeFile,running]);

  const handleNewFile    =useCallback((p)=>setDialog({type:"newfile",  context:p}),[]);
  const handleNewFolder  =useCallback((p)=>setDialog({type:"newfolder",context:p}),[]);
  const handleRenameFile =useCallback((n)=>setDialog({type:"rename",   context:n}),[]);

  const confirmNewFile=useCallback((name)=>{
    const path=dialog.context?`${dialog.context}/${name}`:name;
    if(files.find(f=>f.path===path)){setDialog(null);return;}
    const f={path,name,content:"",isDirty:false};
    setFiles(prev=>[...prev,f]);setOpenFiles(prev=>[...prev,f]);setActiveFile(f);setDialog(null);
  },[dialog,files]);

  const confirmNewFolder=useCallback((name)=>{
    const path=dialog.context?`${dialog.context}/${name}/.gitkeep`:`${name}/.gitkeep`;
    setFiles(prev=>[...prev,{path,name:".gitkeep",content:"",isDirty:false}]);setDialog(null);
  },[dialog]);

  const confirmRename=useCallback((newName)=>{
    const node=dialog.context;const parts=node.path.split("/");parts[parts.length-1]=newName;const newPath=parts.join("/");
    setFiles(prev=>prev.map(f=>f.path===node.path?{...f,path:newPath,name:newName}:f));
    setOpenFiles(prev=>prev.map(f=>f.path===node.path?{...f,path:newPath,name:newName}:f));
    setActiveFile(cur=>cur?.path===node.path?{...cur,path:newPath,name:newName}:cur);
    setDialog(null);
  },[dialog]);

  const handleDeleteFile=useCallback((node)=>{
    if(node.isDir){
      setFiles(prev=>prev.filter(f=>!f.path.startsWith(node.path+"/")));
      setOpenFiles(prev=>{const rest=prev.filter(f=>!f.path.startsWith(node.path+"/"));setActiveFile(cur=>cur&&cur.path.startsWith(node.path+"/")?rest[rest.length-1]||null:cur);return rest;});
    } else {
      setFiles(prev=>prev.filter(f=>f.path!==node.path));
      setOpenFiles(prev=>{const rest=prev.filter(f=>f.path!==node.path);setActiveFile(cur=>cur?.path===node.path?rest[rest.length-1]||null:cur);return rest;});
    }
  },[]);

  return (
    <div style={{height:"100vh",display:"flex",flexDirection:"column",background:"#010409",overflow:"hidden",fontFamily:"'Segoe UI',system-ui,sans-serif"}}>

      {/* Top bar */}
      <div style={{height:40,background:"#010409",borderBottom:"1px solid #21262d",display:"flex",alignItems:"center",padding:"0 14px",gap:10,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          <div style={{width:14,height:14,borderRadius:"50%",background:"linear-gradient(135deg,#6366f1,#22c55e)"}}/>
          <span style={{fontSize:13,fontWeight:700,color:"#e6edf3"}}>Friday IDE</span>
        </div>
        <div style={{flex:1}}/>
        <button onClick={()=>setPaletteOpen(true)}
          style={{padding:"4px 10px",background:"#161b22",border:"1px solid #30363d",color:"#6b7280",borderRadius:6,fontSize:11,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#58a6ff";e.currentTarget.style.color="#e6edf3";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#30363d";e.currentTarget.style.color="#6b7280";}}>
          <span>⌘</span><span>Command Palette</span>
          <kbd style={{fontSize:9,background:"#0d1117",color:"#374151",padding:"1px 4px",borderRadius:3,fontFamily:"monospace"}}>Ctrl+Shift+P</kbd>
        </button>
        <button onClick={handleOpenFolder}
          style={{padding:"4px 10px",background:"#161b22",border:"1px solid #30363d",color:"#8b949e",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor="#58a6ff";e.currentTarget.style.color="#e6edf3";}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor="#30363d";e.currentTarget.style.color="#8b949e";}}>📂 Open Folder</button>
        {activeFile&&isDebuggable(activeFile.name)&&(
          <button onClick={handleToggleDebug}
            style={{padding:"4px 10px",background:debugOpen?"#7c2d1222":"transparent",border:`1px solid ${debugOpen?"#f97316":"#30363d"}`,color:debugOpen?"#f97316":"#8b949e",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:5}}>
            🐛 {debugOpen?"Hide Debug":"Debug"}
          </button>
        )}
        <button onClick={()=>setFridayOpen(v=>!v)}
          style={{padding:"4px 10px",background:fridayOpen?"rgba(99,102,241,0.1)":"transparent",border:`1px solid ${fridayOpen?"#6366f1":"#30363d"}`,color:fridayOpen?"#818cf8":"#8b949e",borderRadius:6,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
          {fridayOpen?"Hide Friday":"⚡ Friday AI"}
        </button>
      </div>

      {/* Main layout */}
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* File tree */}
        <div style={{width:220,minWidth:180,flexShrink:0,borderRight:"1px solid #21262d"}}>
          <FileTreePanel files={files} activeFile={activeFile} projectName={projectName}
            onSelectFile={handleSelectFile} onOpenFolder={handleOpenFolder}
            onNewFile={handleNewFile} onNewFolder={handleNewFolder}
            onDeleteFile={handleDeleteFile} onRenameFile={handleRenameFile}
          />
        </div>

        {/* Editor column */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>
          <EditorTabs openFiles={openFiles} activeFile={activeFile} onSelectTab={handleSelectFile} onCloseTab={handleCloseTab}/>
          <Breadcrumb activeFile={activeFile}/>

          <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{flex:(termExpanded||debugExpanded)?"0 0 0":1,minHeight:0,overflow:"hidden"}}>
              {activeFile ? (
                <Editor
                  key={activeFile.path}
                  height="100%"
                  language={getLanguage(activeFile.name)}
                  value={activeFile.content}
                  onChange={handleEditorChange}
                  theme="vs-dark"
                  onMount={editor=>{ editorRef.current = editor; }}
                  options={{
                    fontSize:13.5,fontFamily:"'Fira Code','Cascadia Code','Consolas',monospace",fontLigatures:true,
                    minimap:{enabled:true,scale:1},scrollBeyondLastLine:false,lineNumbers:"on",
                    renderLineHighlight:"all",cursorBlinking:"smooth",cursorStyle:"line",smoothScrolling:true,
                    padding:{top:14,bottom:14},automaticLayout:true,tabSize:2,wordWrap:"on",
                    bracketPairColorization:{enabled:true},guides:{bracketPairs:true,indentation:true},
                    suggest:{showKeywords:true,showSnippets:true},
                    quickSuggestions:{other:true,comments:true,strings:true},
                    formatOnPaste:true,formatOnType:true,
                    autoClosingBrackets:"always",autoClosingQuotes:"always",autoIndent:"full",
                    folding:true,occurrencesHighlight:true,selectionHighlight:true,
                    stickyScroll:{enabled:true},
                  }}
                />
              ) : (
                <div style={{height:"100%",display:"flex",alignItems:"center",justifyContent:"center",background:"#0d1117"}}>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:48,marginBottom:14}}>⚡</div>
                    <p style={{color:"#374151",fontSize:15,margin:"0 0 6px",fontWeight:600}}>Friday IDE</p>
                    <p style={{color:"#4b5563",fontSize:13,margin:"0 0 4px"}}>25+ languages · AI agent · Live code execution</p>
                    <p style={{color:"#374151",fontSize:11,margin:"0 0 16px"}}>Files are saved automatically across sessions</p>
                    <div style={{display:"flex",gap:8,justifyContent:"center"}}>
                      <button onClick={handleOpenFolder} style={{padding:"8px 16px",background:"#1d4ed8",border:"none",color:"#fff",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>📂 Open Folder</button>
                      <button onClick={()=>handleNewFile("")} style={{padding:"8px 16px",background:"#21262d",border:"1px solid #30363d",color:"#8b949e",borderRadius:8,cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>📄 New File</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {terminalOpen && (
              <div style={{height:termExpanded?"100%":termHeight,flexShrink:0,overflow:"hidden",minHeight:80}}>
                <TerminalPanel output={termOutput} onRun={handleRun} onClear={()=>setTermOutput([])}
                  activeFile={activeFile} running={running} height={termHeight} onResize={setTermHeight}
                  onToggle={()=>setTerminalOpen(false)} expanded={termExpanded} onToggleExpand={()=>setTermExpanded(v=>!v)}/>
              </div>
            )}

            {debugOpen && (
              <ResizableDebugPanel activeFile={activeFile} onClose={()=>setDebugOpen(false)}
                onApplyEdit={handleApplyEdit} height={debugHeight} onResize={setDebugHeight}
                expanded={debugExpanded} onToggleExpand={()=>setDebugExpanded(v=>!v)} autoAnalyze={autoAnalyze}/>
            )}
          </div>
        </div>

        {/* SQL IDE */}
        {sqlOpen && (
          <div style={{width:sqlExpanded?"calc(100vw - 220px)":sqlWidth,flexShrink:0,borderLeft:"1px solid #21262d",display:"flex",overflow:"hidden",position:"relative"}}>
            <div onMouseDown={handleSqlDragStart} style={{width:5,flexShrink:0,cursor:"ew-resize",background:"transparent",borderRight:"1px solid #21262d",position:"relative",zIndex:10}}
              onMouseEnter={e=>e.currentTarget.style.background="#1f6feb55"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <div style={{position:"absolute",left:"50%",top:"50%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",gap:3}}>
                {[0,1,2].map(i=><div key={i} style={{width:3,height:3,borderRadius:"50%",background:"#374151"}}/>)}
              </div>
            </div>
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
              <div style={{height:36,background:"#010409",borderBottom:"1px solid #21262d",display:"flex",alignItems:"center",padding:"0 12px",gap:8,flexShrink:0}}>
                <span style={{fontSize:13}}>🗄</span>
                <span style={{fontSize:12,fontWeight:700,color:"#22d3ee"}}>SQL IDE</span>
                <span style={{fontSize:10,color:"#374151"}}>SQLite · in-browser</span>
                <div style={{marginLeft:"auto",display:"flex",gap:5}}>
                  <button onClick={()=>setSqlExpanded(v=>!v)} style={{padding:"2px 8px",background:"transparent",border:"1px solid #21262d",color:"#475569",borderRadius:4,fontSize:12,cursor:"pointer",lineHeight:1}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#22d3ee";e.currentTarget.style.color="#22d3ee";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#21262d";e.currentTarget.style.color="#475569";}}>{sqlExpanded?"⊟":"⊞"}</button>
                  <button onClick={()=>{setSqlOpen(false);setSqlExpanded(false);}}
                    style={{padding:"2px 8px",background:"transparent",border:"1px solid #21262d",color:"#475569",borderRadius:4,fontSize:16,cursor:"pointer",lineHeight:1}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor="#f87171";e.currentTarget.style.color="#f87171";}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor="#21262d";e.currentTarget.style.color="#475569";}}>×</button>
                </div>
              </div>
              <div style={{flex:1,overflow:"hidden"}}><SQLPanel/></div>
            </div>
          </div>
        )}

        {/* Friday AI Agent panel — now receives editorRef */}
        {fridayOpen && (
          <div style={{width:fridayWidth,minWidth:280,flexShrink:0}}>
            <FridayPanel
              activeFile={activeFile} files={files}
              onApplyEdit={handleApplyEdit} onCreateFile={handleCreateFile} onDeleteFile={handleDeleteFile}
              convId={convId} setConvId={setConvId}
              fridayWidth={fridayWidth} onFridayDragStart={handleFridayDragStart}
              editorRef={editorRef}
            />
          </div>
        )}
      </div>

      <StatusBar activeFile={activeFile} saved={saved}
        terminalOpen={terminalOpen} onToggleTerminal={()=>setTerminalOpen(v=>!v)}
        debugOpen={debugOpen} onToggleDebug={handleToggleDebug}
        fileCount={files.length} sqlOpen={sqlOpen} onToggleSql={()=>setSqlOpen(v=>!v)}
      />

      {dialog?.type==="newfile"   &&<InputDialog title="New File"   placeholder="filename.py"        onConfirm={confirmNewFile}   onCancel={()=>setDialog(null)}/>}
      {dialog?.type==="newfolder" &&<InputDialog title="New Folder" placeholder="folder-name"        onConfirm={confirmNewFolder} onCancel={()=>setDialog(null)}/>}
      {dialog?.type==="rename"    &&<InputDialog title="Rename" placeholder={dialog.context.name} defaultValue={dialog.context.name} onConfirm={confirmRename} onCancel={()=>setDialog(null)}/>}

      {paletteOpen && (
        <CommandPalette
          onClose={()=>setPaletteOpen(false)}
          onNewFile={handleNewFile} onNewFolder={handleNewFolder}
          onOpenFolder={handleOpenFolder}
          onToggleTerminal={()=>setTerminalOpen(v=>!v)}
          onToggleDebug={handleToggleDebug}
          onToggleSql={()=>setSqlOpen(v=>!v)}
          onToggleFriday={()=>setFridayOpen(v=>!v)}
          activeFile={activeFile} onRun={handleRun}
        />
      )}

      <style>{`
        @keyframes dotBounce{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-5px);opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#21262d;border-radius:4px}
        ::-webkit-scrollbar-thumb:hover{background:#30363d}
      `}</style>
    </div>
  );
}