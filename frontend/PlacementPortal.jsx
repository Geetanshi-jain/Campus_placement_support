import React, { useState, useEffect, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, ArrowLeft, Search, FileText, Users, Plus, ChevronDown, ChevronUp, Sparkles, Lock, MessageCircle, Send, Briefcase } from "lucide-react";

const FIELDS = [
  "company", "author_name", "batch", "date_submitted", "verdict",
  "overall_process_summary",
  "round_1_name", "round_1_topics",
  "round_2_name", "round_2_topics",
  "round_3_name", "round_3_topics",
  "round_4_name", "round_4_topics",
  "round_5_name", "round_5_topics",
  "additional_rounds", "tips_advice", "source_type"
];

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
  .font-display { font-family: 'Fraunces', serif; }
  .font-body { font-family: 'Inter', sans-serif; }
`;

// ---- Palette: Maroon + Beige ----
const C = {
  base: "#F3EBDC",
  card: "#FFFFFF",
  primary: "#6B1F2A",
  accent: "#C99A3E",
  success: "#3F7D58",
  successBg: "#E6EFE9",
  danger: "#B5533C",
  dangerBg: "#F5E3DE",
  neutralFg: "#8A7A4A",
  neutralBg: "#EFE7D6",
  text: "#3A2E22",
  textSoft: "#7A6E5A",
  border: "#E5D9C0",
  tipsBg: "#FBF3E3",
  tipsFg: "#5B4520",
};

function uid() { return "sub_" + Math.random().toString(36).slice(2, 10); }

function emptyForm() {
  const f = {};
  FIELDS.forEach((k) => (f[k] = ""));
  f.source_type = "student_submission";
  f.date_submitted = new Date().toISOString().slice(0, 10);
  return f;
}

async function callClaude(messages, system, useWebSearch) {
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    system,
    messages,
  };
  if (useWebSearch) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  const text = (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return text || "Sorry, I couldn't generate a response.";
}

export default function PlacementPortal() {
  const [view, setView] = useState("landing"); // landing | admin | student | chat
  const [studentView, setStudentView] = useState("menu"); // menu | share | chat | hrprep | match
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => { loadExperiences(); }, []);

  async function loadExperiences() {
    setLoading(true);
    try {
      const res = await window.storage.get("placement_experiences", true);
      setExperiences(res ? JSON.parse(res.value) : []);
    } catch (e) { setExperiences([]); }
    setLoading(false);
  }

  async function saveExperiences(list) {
    setExperiences(list);
    try {
      await window.storage.set("placement_experiences", JSON.stringify(list), true);
    } catch (e) { console.error("Storage error", e); }
  }

  function handleExcelUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploadStatus({ type: "loading", msg: "Reading file..." });
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const mapped = rows.map((r) => {
          const obj = { submission_id: r.submission_id ? String(r.submission_id) : uid() };
          FIELDS.forEach((k) => (obj[k] = r[k] !== undefined ? String(r[k]) : ""));
          if (!obj.source_type) obj.source_type = "pcell_upload";
          return obj;
        });
        const merged = [...experiences];
        let added = 0, updated = 0;
        mapped.forEach((m) => {
          const idx = merged.findIndex((x) => x.submission_id === m.submission_id);
          if (idx >= 0) { merged[idx] = m; updated++; } else { merged.push(m); added++; }
        });
        await saveExperiences(merged);
        setUploadStatus({ type: "success", msg: `Done — ${added} added, ${updated} updated.` });
      } catch (err) {
        setUploadStatus({ type: "error", msg: "Could not read this file. Check the column headers match the template." });
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  return (
    <div className="min-h-screen font-body" style={{ background: C.base, color: C.text }}>
      <style>{FONT_STYLE}</style>

      {view === "landing" && (
        <Landing
          onAdmin={() => setView("admin")}
          onStudent={() => { setView("student"); setStudentView("menu"); }}
          onChat={() => setView("chat")}
        />
      )}

      {view === "chat" && (
        <div className="max-w-2xl mx-auto px-6 py-10">
          <BackButton onClick={() => setView("landing")} />
          <Chatbot experiences={experiences} />
        </div>
      )}

      {view === "admin" && (
        <AdminPanel
          authed={adminAuthed} pwInput={pwInput} setPwInput={setPwInput}
          onAuth={() => setAdminAuthed(pwInput === "pcell2026")}
          onBack={() => setView("landing")} onUpload={handleExcelUpload}
          uploadStatus={uploadStatus} count={experiences.length} fileInputRef={fileInputRef}
        />
      )}

      {view === "student" && (
        <StudentPanel
          studentView={studentView} setStudentView={setStudentView}
          experiences={experiences} loading={loading}
          onBack={() => setView("landing")}
          onSubmit={async (form) => {
            const entry = { ...form, submission_id: uid() };
            await saveExperiences([entry, ...experiences]);
          }}
        />
      )}
    </div>
  );
}

// ---------- LANDING ----------
function Landing({ onAdmin, onStudent, onChat }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16">
      <div className="mb-14 text-center">
        <div className="inline-flex items-center gap-3 mb-5">
          <LogoMark />
          <span className="font-display text-xl tracking-wide" style={{ color: C.primary }}>IIPS Placement Cell</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight" style={{ color: C.primary }}>
          Welcome to the IIPS Campus<br className="hidden md:block" /> Placement Knowledge Hub
        </h1>
        <p className="mt-4 text-base md:text-lg max-w-xl mx-auto" style={{ color: C.textSoft }}>
          Feel free to connect and talk with anyone — ask a question, share what you learned, or prep for your next round.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 w-full max-w-4xl">
        <LedgerCard label="Talk now" title="Start Talking" desc="Chat with the knowledge hub — ask anything about placements, instantly." icon={<MessageCircle size={20} />} onClick={onChat} />
        <LedgerCard label="Cell Office" title="Admin Login" desc="Upload the master placement sheet. Records update instantly." icon={<Lock size={20} />} onClick={onAdmin} />
        <LedgerCard label="Student Desk" title="Student Login" desc="Share your interview experience or prep for your HR round." icon={<Users size={20} />} onClick={onStudent} />
      </div>
    </div>
  );
}

function LedgerCard({ label, title, desc, icon, onClick }) {
  return (
    <button onClick={onClick} className="group relative text-left rounded-sm p-7 transition-all duration-200 hover:-translate-y-1"
      style={{ background: C.card, border: `1px solid ${C.border}`, boxShadow: `0 1px 0 ${C.border}` }}>
      <div className="absolute -top-3 left-7 px-3 py-1 text-xs tracking-widest uppercase font-semibold" style={{ background: C.accent, color: C.primary }}>{label}</div>
      <div className="flex items-center gap-3 mt-3 mb-3" style={{ color: C.primary }}>{icon}<h2 className="font-display text-xl font-semibold">{title}</h2></div>
      <p style={{ color: C.textSoft }} className="text-sm leading-relaxed">{desc}</p>
      <div className="mt-5 text-sm font-semibold flex items-center gap-1" style={{ color: C.accent }}>Enter <span className="transition-transform group-hover:translate-x-1">→</span></div>
    </button>
  );
}

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
      <rect x="1" y="1" width="32" height="32" rx="3" stroke={C.primary} strokeWidth="1.5" />
      <path d="M8 22V12L17 8L26 12V22" stroke={C.primary} strokeWidth="1.5" />
      <path d="M8 22H26" stroke={C.accent} strokeWidth="2" />
      <circle cx="17" cy="16" r="2" fill={C.accent} />
    </svg>
  );
}

// ---------- ADMIN ----------
function AdminPanel({ authed, pwInput, setPwInput, onAuth, onBack, onUpload, uploadStatus, count, fileInputRef }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <BackButton onClick={onBack} />
      <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: C.primary }}>Admin Panel</h1>
      <p className="text-sm mb-8" style={{ color: C.textSoft }}>Upload the master sheet. New rows are added, existing submission_ids are updated.</p>

      {!authed ? (
        <div className="p-6 rounded-sm max-w-sm" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <label className="text-xs uppercase tracking-widest font-semibold" style={{ color: C.textSoft }}>Access code</label>
          <input type="password" value={pwInput} onChange={(e) => setPwInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && onAuth()}
            className="w-full mt-2 mb-4 px-3 py-2 border rounded-sm outline-none" style={{ borderColor: C.border }} placeholder="Enter code" />
          <button onClick={onAuth} className="w-full py-2 rounded-sm font-semibold text-sm" style={{ background: C.primary, color: C.base }}>Unlock</button>
          <p className="text-xs mt-3" style={{ color: C.neutralFg }}>Demo code: pcell2026 — swap for real auth before going live.</p>
        </div>
      ) : (
        <div className="p-6 rounded-sm" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <p className="text-sm mb-4" style={{ color: C.textSoft }}>Current records: <span className="font-semibold" style={{ color: C.primary }}>{count}</span></p>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={onUpload} className="hidden" id="excel-upload" />
          <label htmlFor="excel-upload" className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-sm py-10 cursor-pointer" style={{ borderColor: C.accent }}>
            <Upload size={26} style={{ color: C.accent }} />
            <span className="text-sm font-semibold" style={{ color: C.primary }}>Click to upload .xlsx / .csv</span>
            <span className="text-xs" style={{ color: C.textSoft }}>Columns must match: submission_id, company, author_name, batch...</span>
          </label>
          {uploadStatus && (
            <div className="mt-4 text-sm px-3 py-2 rounded-sm" style={{ background: uploadStatus.type === "error" ? C.dangerBg : C.successBg, color: uploadStatus.type === "error" ? C.danger : C.success }}>
              {uploadStatus.msg}
            </div>
          )}
          <details className="mt-6 text-sm">
            <summary className="cursor-pointer font-semibold" style={{ color: C.primary }}>Expected columns</summary>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: C.textSoft }}>{FIELDS.join(", ")}</p>
          </details>
        </div>
      )}
    </div>
  );
}

// ---------- STUDENT ----------
function StudentPanel({ studentView, setStudentView, experiences, loading, onBack, onSubmit }) {
  if (studentView === "menu") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-12">
        <BackButton onClick={onBack} />
        <h1 className="font-display text-3xl font-semibold mb-8" style={{ color: C.primary }}>Student Desk</h1>
        <div className="grid gap-4">
          <MenuRow icon={<Plus size={18} />} title="Share your interview experience" desc="Add your rounds, questions, and verdict to the record for juniors." onClick={() => setStudentView("share")} />
          <MenuRow icon={<MessageCircle size={18} />} title="Ask anything" desc="Chat about past companies, months, verdicts, and process." onClick={() => setStudentView("chat")} />
          <MenuRow icon={<Briefcase size={18} />} title="Must Know for HR" desc="Pick a company — get CEO, CTO, tech stack, and what HR usually probes." onClick={() => setStudentView("hrprep")} />
          <MenuRow icon={<Sparkles size={18} />} title="Check my resume fit" desc="See which past rounds and topics line up with your profile." onClick={() => setStudentView("match")} />
        </div>
      </div>
    );
  }
  if (studentView === "share") return <ShareForm onBack={() => setStudentView("menu")} onSubmit={onSubmit} />;
  if (studentView === "chat") return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <BackButton onClick={() => setStudentView("menu")} />
      <Chatbot experiences={experiences} />
    </div>
  );
  if (studentView === "hrprep") return <HRPrep onBack={() => setStudentView("menu")} />;
  if (studentView === "match") return <ResumeMatch experiences={experiences} onBack={() => setStudentView("menu")} />;
  return null;
}

function MenuRow({ icon, title, desc, onClick }) {
  return (
    <button onClick={onClick} className="flex items-start gap-4 text-left p-5 rounded-sm hover:-translate-y-0.5 transition-transform" style={{ background: C.card, border: `1px solid ${C.border}` }}>
      <div className="mt-0.5" style={{ color: C.accent }}>{icon}</div>
      <div><h3 className="font-semibold text-sm" style={{ color: C.primary }}>{title}</h3><p className="text-xs mt-1" style={{ color: C.textSoft }}>{desc}</p></div>
    </button>
  );
}

function BackButton({ onClick }) {
  return <button onClick={onClick} className="flex items-center gap-1 text-sm mb-6 font-semibold" style={{ color: C.textSoft }}><ArrowLeft size={15} /> Back</button>;
}

// ---- Chatbot ----
function Chatbot({ experiences }) {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! Ask me anything about past placements — which companies came, when, how many got selected, what the process looked like, or tips from seniors." }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || sending) return;
    const userMsg = { role: "user", content: input };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);

    const dataset = experiences.map((e) => ({
      company: e.company, batch: e.batch, date: e.date_submitted, verdict: e.verdict,
      summary: e.overall_process_summary, tips: e.tips_advice,
    }));
    const system = `You are the IIPS Placement Cell knowledge assistant. Answer student questions using ONLY the interview experience records below. Be concise and specific (which company, when, how many selected, what rounds looked like). If the answer isn't in the records, say so honestly and suggest checking with the placement cell directly. Do not make up companies or numbers.

Records (JSON):
${JSON.stringify(dataset).slice(0, 12000)}`;

    try {
      const apiMessages = next.map((m) => ({ role: m.role, content: m.content }));
      const reply = await callClaude(apiMessages, system, false);
      setMessages((cur) => [...cur, { role: "assistant", content: reply }]);
    } catch (e) {
      setMessages((cur) => [...cur, { role: "assistant", content: "Something went wrong reaching the assistant. Try again in a moment." }]);
    }
    setSending(false);
  }

  return (
    <div className="rounded-sm overflow-hidden flex flex-col" style={{ background: C.card, border: `1px solid ${C.border}`, height: "70vh" }}>
      <div className="px-5 py-4" style={{ background: C.primary, color: C.base }}>
        <p className="font-display text-lg font-semibold flex items-center gap-2"><MessageCircle size={18} /> Ask Anything</p>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className="max-w-[85%] px-3.5 py-2.5 rounded-sm text-sm whitespace-pre-wrap"
              style={m.role === "user" ? { background: C.accent, color: C.primary } : { background: C.neutralBg, color: C.text }}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && <div className="text-xs" style={{ color: C.textSoft }}>Typing...</div>}
        <div ref={endRef} />
      </div>
      <div className="p-3 flex gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="e.g. Which companies visited in March?" className="flex-1 px-3 py-2 border rounded-sm outline-none text-sm" style={{ borderColor: C.border }} />
        <button onClick={send} disabled={sending} className="px-4 rounded-sm flex items-center justify-center disabled:opacity-40" style={{ background: C.primary, color: C.base }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

// ---- Must Know for HR ----
function HRPrep({ onBack }) {
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  async function generate() {
    if (!company.trim()) return;
    setLoading(true);
    setResult("");
    const system = `You are an HR-round prep assistant for campus placement students. Given a company name, produce a compact briefing with these sections, using short bullet points:
- Current CEO
- Current CTO (or top engineering leader)
- Core products / tech stack
- Mission, values, and culture points HR often references
- One recent notable development (last few months)
- 3 likely HR-round questions specific to this company
Keep it tight and skimmable. If you're not fully certain about a name, say so briefly rather than guessing confidently.`;
    try {
      const reply = await callClaude([{ role: "user", content: `Company: ${company}` }], system, true);
      setResult(reply);
    } catch (e) {
      setResult("Could not fetch this right now. Try again in a moment.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <BackButton onClick={onBack} />
      <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: C.primary }}>Must Know for HR</h1>
      <p className="text-sm mb-6" style={{ color: C.textSoft }}>Pick a company and get the CEO, CTO, tech stack, and culture points HR rounds usually touch on.</p>

      <div className="flex gap-2">
        <input value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={(e) => e.key === "Enter" && generate()}
          placeholder="e.g. TCS, Infosys, Amazon..." className="flex-1 px-3 py-2 border rounded-sm outline-none text-sm bg-white" style={{ borderColor: C.border }} />
        <button onClick={generate} disabled={loading || !company.trim()} className="px-5 py-2 rounded-sm text-sm font-semibold disabled:opacity-40" style={{ background: C.primary, color: C.base }}>
          {loading ? "Fetching..." : "Generate brief"}
        </button>
      </div>

      {result && (
        <div className="mt-6 p-5 rounded-sm text-sm whitespace-pre-wrap leading-relaxed" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text }}>
          {result}
        </div>
      )}
    </div>
  );
}

// ---- Share Form ----
function ShareForm({ onBack, onSubmit }) {
  const [form, setForm] = useState(emptyForm());
  const [saved, setSaved] = useState(false);
  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  async function handleSubmit() {
    if (!form.company || !form.author_name) return;
    await onSubmit(form);
    setSaved(true);
  }
  if (saved) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 text-center">
        <h2 className="font-display text-2xl font-semibold mb-2" style={{ color: C.primary }}>Added to the record.</h2>
        <p className="text-sm mb-6" style={{ color: C.textSoft }}>Thanks — this will help the next batch prepare.</p>
        <button onClick={onBack} className="px-5 py-2 rounded-sm text-sm font-semibold" style={{ background: C.primary, color: C.base }}>Back to menu</button>
      </div>
    );
  }
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <BackButton onClick={onBack} />
      <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: C.primary }}>Share Your Interview Experience</h1>
      <p className="text-sm mb-8" style={{ color: C.textSoft }}>Fill in what you remember. Rounds you didn't have can stay blank.</p>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Company *" value={form.company} onChange={(v) => set("company", v)} />
        <Field label="Your name *" value={form.author_name} onChange={(v) => set("author_name", v)} />
        <Field label="Batch" value={form.batch} onChange={(v) => set("batch", v)} placeholder="e.g. 2026" />
        <SelectField label="Verdict" value={form.verdict} onChange={(v) => set("verdict", v)} options={["Selected", "Rejected", "Withdrew", "In process"]} />
      </div>
      <TextArea label="Overall process summary" value={form.overall_process_summary} onChange={(v) => set("overall_process_summary", v)} rows={3} />
      {[1, 2, 3, 4, 5].map((n) => (
        <div key={n} className="mt-6 pt-4" style={{ borderTop: `1px solid ${C.border}` }}>
          <p className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: C.accent }}>Round {n}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Round name" value={form[`round_${n}_name`]} onChange={(v) => set(`round_${n}_name`, v)} placeholder="e.g. Technical, HR, GD" />
            <Field label="Topics / questions asked" value={form[`round_${n}_topics`]} onChange={(v) => set(`round_${n}_topics`, v)} />
          </div>
        </div>
      ))}
      <TextArea label="Any additional rounds" value={form.additional_rounds} onChange={(v) => set("additional_rounds", v)} rows={2} />
      <TextArea label="Tips & advice for juniors" value={form.tips_advice} onChange={(v) => set("tips_advice", v)} rows={3} />
      <button onClick={handleSubmit} className="mt-8 px-6 py-2.5 rounded-sm text-sm font-semibold" style={{ background: C.primary, color: C.base }}>Submit experience</button>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-xs font-semibold" style={{ color: C.textSoft }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 border rounded-sm outline-none text-sm bg-white" style={{ borderColor: C.border }} />
    </div>
  );
}
function SelectField({ label, value, onChange, options }) {
  return (
    <div>
      <label className="text-xs font-semibold" style={{ color: C.textSoft }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 border rounded-sm outline-none text-sm bg-white" style={{ borderColor: C.border }}>
        <option value="">Select</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
function TextArea({ label, value, onChange, rows }) {
  return (
    <div className="mt-4">
      <label className="text-xs font-semibold" style={{ color: C.textSoft }}>{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        className="w-full mt-1 px-3 py-2 border rounded-sm outline-none text-sm bg-white" style={{ borderColor: C.border }} />
    </div>
  );
}

function verdictColor(v) {
  const s = (v || "").toLowerCase();
  if (s === "selected") return { bg: C.successBg, fg: C.success };
  if (s === "rejected") return { bg: C.dangerBg, fg: C.danger };
  return { bg: C.neutralBg, fg: C.neutralFg };
}

// ---- Resume Match ----
function ResumeMatch({ experiences, onBack }) {
  const [company, setCompany] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [result, setResult] = useState(null);
  const companies = [...new Set(experiences.map((e) => e.company).filter(Boolean))];

  function analyze() {
    const rows = experiences.filter((e) => e.company === company);
    if (rows.length === 0) { setResult({ empty: true }); return; }
    const allTopics = rows.flatMap((r) => [1, 2, 3, 4, 5].map((n) => r[`round_${n}_topics`]).filter(Boolean)).join(" ").toLowerCase();
    const topicWords = new Set(allTopics.split(/[^a-z0-9+#.]+/).filter((w) => w.length > 2));
    const resumeWords = new Set(resumeText.toLowerCase().split(/[^a-z0-9+#.]+/).filter((w) => w.length > 2));
    const overlap = [...topicWords].filter((w) => resumeWords.has(w));
    const missing = [...topicWords].filter((w) => !resumeWords.has(w)).slice(0, 15);
    const score = topicWords.size ? Math.round((overlap.length / topicWords.size) * 100) : 0;
    setResult({ score, overlap: overlap.slice(0, 15), missing, rows: rows.length });
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <BackButton onClick={onBack} />
      <h1 className="font-display text-3xl font-semibold mb-1" style={{ color: C.primary }}>Check My Resume Fit</h1>
      <p className="text-sm mb-6" style={{ color: C.textSoft }}>Keyword match against past rounds for a company — a quick pointer, not a verdict.</p>
      <SelectField label="Company" value={company} onChange={setCompany} options={companies} />
      <TextArea label="Paste your resume text / key skills" value={resumeText} onChange={setResumeText} rows={6} />
      <button onClick={analyze} disabled={!company || !resumeText} className="mt-4 px-6 py-2.5 rounded-sm text-sm font-semibold disabled:opacity-40" style={{ background: C.primary, color: C.base }}>Check alignment</button>
      {result && result.empty && <p className="mt-6 text-sm" style={{ color: C.textSoft }}>No records for this company yet.</p>}
      {result && !result.empty && (
        <div className="mt-6 p-5 rounded-sm" style={{ background: C.card, border: `1px solid ${C.border}` }}>
          <p className="text-sm mb-1" style={{ color: C.textSoft }}>Based on {result.rows} submitted experience(s)</p>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="font-display text-4xl font-semibold" style={{ color: C.primary }}>{result.score}%</span>
            <span className="text-sm" style={{ color: C.textSoft }}>topic overlap</span>
          </div>
          {result.overlap.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-semibold mb-1" style={{ color: C.success }}>You already cover</p>
              <div className="flex flex-wrap gap-1.5">{result.overlap.map((w) => <span key={w} className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.successBg, color: C.success }}>{w}</span>)}</div>
            </div>
          )}
          {result.missing.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: C.danger }}>Worth brushing up</p>
              <div className="flex flex-wrap gap-1.5">{result.missing.map((w) => <span key={w} className="text-xs px-2 py-0.5 rounded-full" style={{ background: C.dangerBg, color: C.danger }}>{w}</span>)}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
