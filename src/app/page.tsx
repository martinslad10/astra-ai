'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import { Activity, ArrowUp, BrainCircuit, Check, ChevronDown, Code2, Film, Image as ImageIcon, Menu, Megaphone, Paperclip, Plus, Sparkles, WandSparkles, X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
const starters = [
  { icon: BrainCircuit, title: "Přemýšlej se mnou", text: "Pomoz mi rozebrat složitý problém krok za krokem." },
  { icon: Code2, title: "Vytvoř aplikaci", text: "Navrhni architekturu aplikace a rozepiš první implementační kroky." },
  { icon: ImageIcon, title: "Vizuální tvorba", text: "Připrav kreativní koncept pro realistický vizuál produktu." },
  { icon: Film, title: "Video a obsah", text: "Navrhni scénář krátkého videa pro sociální sítě." },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("astra-ai-chat-v1");
      if (saved) setMessages(JSON.parse(saved) as Message[]);
    } catch {
      // Ignore invalid local history.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem("astra-ai-chat-v1", JSON.stringify(messages.slice(-100)));
    } catch {
      // Storage may be disabled or full.
    }
  }, [messages, hydrated]);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  async function send(text = draft) {
    const content = text.trim();
    if (!content || busy) return;
    const next: Message[] = [...messages, { role: "user", content }];
    setMessages(next); setDraft(""); setError(""); setBusy(true);
    try {
      let memory: { title: string; content: string }[] = [];
      try {
        const savedMemory = window.localStorage.getItem("astra-ai-memory-v1");
        const parsed: unknown = savedMemory ? JSON.parse(savedMemory) : [];
        if (Array.isArray(parsed)) {
          memory = parsed.filter((item): item is { title: string; content: string } =>
            item && typeof item.title === "string" && typeof item.content === "string"
          ).slice(0, 10).map(item => ({ title: item.title.slice(0, 120), content: item.content.slice(0, 1200) }));
        }
      } catch { /* Memory is optional; continue without it. */ }
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, memory }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Požadavek se nezdařil.");
      setMessages([...next, { role: "assistant", content: data.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Něco se pokazilo. Zkus to znovu.");
    } finally { setBusy(false); textareaRef.current?.focus(); }
  }
  function onSubmit(e: FormEvent) { e.preventDefault(); void send(); }

  async function handleFile(file?: File) {
    if (!file) return;
    const allowed = /\.(txt|md|csv|json|html|xml|log)$/i.test(file.name);
    if (!allowed) {
      setError("Zatím lze připojit textové soubory TXT, MD, CSV, JSON, HTML, XML nebo LOG. PDF a Word budou doplněny později.");
      return;
    }
    if (file.size > 15000) {
      setError("Soubor je příliš velký. Limit pro textový soubor je 15 kB.");
      return;
    }
    try {
      const text = await file.text();
      setDraft(current => current + (current.trim() ? "\n\n" : "") + "[Obsah souboru: " + file.name + "]\n" + text);
      setError("");
      textareaRef.current?.focus();
    } catch {
      setError("Soubor se nepodařilo přečíst.");
    }
  }

  return <main className="app-shell">
    {sidebarOpen && <button aria-label="Zavřít menu" className="mobile-scrim" onClick={() => setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="brand-row"><div className="brand-mark"><Sparkles size={20}/></div><span className="brand-name">astra<span>ai</span></span><button className="icon-button mobile-close" aria-label="Zavřít menu" onClick={() => setSidebarOpen(false)}><X size={18}/></button></div>
      <button className="new-chat" onClick={() => {setMessages([]);setError("");setSidebarOpen(false);try{window.localStorage.removeItem("astra-ai-chat-v1")}catch{/* Ignore unavailable storage. */}}}><Plus size={17}/> Nová konverzace <span>⌘ K</span></button>
      <div className="side-label">PRACOVNÍ PROSTOR</div>
      <button className="side-link active"><Sparkles size={17}/> Chat <span className="active-dot"/></button>
      <button className="side-link" onClick={() => { window.location.href = "/memory"; }}><BrainCircuit size={17}/> Moje paměť</button>
      <button className="side-link" onClick={() => setError("Plnohodnotný programovací agent s bezpečným spouštěním kódu ještě není připojen.")}><Code2 size={17}/> Programování <span className="soon">BRZY</span></button>
      <button className="side-link" onClick={() => { window.location.href = "/marketing"; }}><Megaphone size={17}/> Marketing</button>
      <button className="side-link" onClick={() => { window.location.href = "/images"; }}><ImageIcon size={17}/> Obrázky <span className="soon">BRZY</span></button>
      <button className="side-link" onClick={() => setError("Generování videí bude vyžadovat připojení video služby.")}><Film size={17}/> Video <span className="soon">BRZY</span></button>
      <div className="sidebar-bottom"><div className="status-card"><span className="status-pulse"/><div><strong>Pracovní verze</strong><small>Vývoj právě začíná</small></div><Activity size={16}/></div><div className="profile-row"><div className="avatar">A</div><div><strong>Astra AI</strong><small>Osobní AI prostor</small></div><ChevronDown size={15}/></div></div>
    </aside>
    <section className="main-panel">
      <header className="topbar"><button className="icon-button menu-button" aria-label="Otevřít menu" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button><div className="breadcrumb"><span>Pracovní prostor</span><span className="crumb-slash">/</span><strong>Chat</strong></div><div className="topbar-right"><span className="model-indicator"><span/> AI model</span><button className="model-select" onClick={() => setError("Výběr modelu bude dostupný po rozšíření konfigurace.")}>Výchozí <ChevronDown size={14}/></button></div></header>
      <div className={`conversation ${messages.length ? "conversation-active" : ""}`}>
        {messages.length === 0 ? <div className="welcome"><div className="eyebrow"><WandSparkles size={14}/> VÁŠ NOVÝ PRACOVNÍ PROSTOR</div><h1>Velké nápady začínají<br/><span>jednou otázkou.</span></h1><p className="welcome-subtitle">Přemýšlej, tvoř a stavěj. Jedno místo pro práci s AI — postupně vybavené nástroji, které potřebuješ.</p><div className="starter-grid">{starters.map(({icon:Icon,title,text}) => <button className="starter-card" key={title} onClick={() => void send(text)}><div className="starter-icon"><Icon size={18}/></div><strong>{title}</strong><span>{text}</span><ArrowUp className="starter-arrow" size={15}/></button>)}</div><div className="trust-line"><span><Check size={13}/> Samostatný projekt</span><span><Check size={13}/> Soukromí na prvním místě</span><span><Check size={13}/> Postupně rozšiřitelné</span></div></div> : <div className="message-list">{messages.map((m,i) => <div className={`message ${m.role}`} key={`${i}-${m.role}`}><div className="message-avatar">{m.role === "assistant" ? <Sparkles size={16}/> : "Ty"}</div><div className="message-content"><div className="message-role">{m.role === "assistant" ? "Astra AI" : "Ty"}</div><p>{m.content}</p></div></div>)}{busy && <div className="message assistant"><div className="message-avatar"><Sparkles size={16}/></div><div className="message-content"><div className="message-role">Astra AI</div><div className="typing"><span/><span/><span/></div></div></div>}<div ref={bottomRef}/></div>}
      </div>
      <div className="composer-area">{error && <div className="error-banner"><span>{error}</span><button aria-label="Zavřít upozornění" onClick={() => setError("")}><X size={15}/></button></div>}<form className="composer" onSubmit={onSubmit}><textarea ref={textareaRef} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Na co dnes společně přijdeme?" rows={1} onKeyDown={e => {if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send()}}}/><div className="composer-footer"><div className="composer-tools"><button type="button" className="tool-button" onClick={() => fileInputRef.current?.click()}><Paperclip size={16}/><span>Připojit textový soubor</span></button><input ref={fileInputRef} className="hidden-file-input" type="file" accept=".txt,.md,.csv,.json,.html,.xml,.log,text/plain,text/markdown,text/csv,application/json" onChange={e => { void handleFile(e.target.files?.[0]); e.currentTarget.value = ""; }} /><span className="composer-note">Enter pro odeslání · Shift + Enter pro nový řádek</span></div><button className="send-button" type="submit" disabled={!draft.trim()||busy} aria-label="Odeslat zprávu">{busy ? <span className="send-spinner"/> : <ArrowUp size={18}/>}</button></div></form><p className="disclaimer">Astra AI se vyvíjí. Ověřuj důležité informace a nesdílej tajné údaje.</p></div>
    </section>
  </main>;
}
