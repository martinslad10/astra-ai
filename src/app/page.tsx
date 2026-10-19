'use client';

import { FormEvent, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "../lib/supabase-browser";
import { Activity, ArrowUp, BrainCircuit, Check, ChevronDown, Code2, Film, Image as ImageIcon, Menu, Megaphone, Paperclip, Plus, Sparkles, WandSparkles, UserRound, X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
const starters = [
  { icon: BrainCircuit, title: "Přemýšlej se mnou", text: "Pomoz mi rozebrat složitý problém krok za krokem." },
  { icon: Code2, title: "Vytvoř aplikaci", text: "Navrhni architekturu aplikace a rozepiš první implementační kroky." },
  { icon: ImageIcon, title: "Vizuální tvorba", text: "Připrav kreativní koncept pro realistický vizuál produktu." },
  { icon: Film, title: "Video a obsah", text: "Navrhni scénář krátkého videa pro sociální sítě." },
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [model, setModel] = useState("gpt-4.1-mini");
  const [cloudConversationId, setCloudConversationId] = useState<string | null>(null);
  const [cloudSyncNotice, setCloudSyncNotice] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    async function restoreHistory() {
      try {
        const saved = window.localStorage.getItem("astra-ai-chat-v1");
        if (saved && active) setMessages(JSON.parse(saved) as Message[]);
      } catch {
        // Ignore invalid local history.
      }
      setHydrated(true);

      const client = getSupabaseBrowserClient();
      if (!client) return;
      try {
        const { data: sessionData } = await client.auth.getSession();
        const user = sessionData.session?.user;
        if (!user || !active) return;
        const { data: rows, error: conversationError } = await client
          .from("conversations").select("id,title,updated_at")
          .eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1);
        if (conversationError) throw conversationError;
        const conversation = rows?.[0];
        if (!conversation || !active) return;
        const { data: cloudMessages, error: messageError } = await client
          .from("messages").select("role,content").eq("conversation_id", conversation.id)
          .eq("user_id", user.id).order("created_at", { ascending: true }).limit(100);
        if (messageError) throw messageError;
        if (active && cloudMessages?.length) {
          setCloudConversationId(conversation.id);
          setMessages(cloudMessages.filter((m): m is Message =>
            (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
          ));
          setCloudSyncNotice("Historie obnovena z cloudu.");
        }
      } catch {
        if (active) setCloudSyncNotice("Cloudovou historii se nepodařilo načíst. Lokální historie zůstává dostupná.");
      }
    }
    void restoreHistory();
    return () => { active = false; };
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
            item !== null && typeof item === "object" && "title" in item && "content" in item &&
            typeof (item as { title: unknown }).title === "string" &&
            typeof (item as { content: unknown }).content === "string"
          ).slice(0, 10).map(item => ({ title: item.title.slice(0, 120), content: item.content.slice(0, 1200) }));
        }
      } catch { /* Memory is optional; continue without it. */ }
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: next, memory, model }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Požadavek se nezdařil.");
      const assistantMessage = { role: "assistant" as const, content: data.reply };
      setMessages([...next, assistantMessage]);
      const client = getSupabaseBrowserClient();
      if (client) {
        try {
          const { data: sessionData } = await client.auth.getSession();
          const user = sessionData.session?.user;
          if (user) {
            let conversationId = cloudConversationId;
            if (!conversationId) {
              const title = content.slice(0, 80) || "Nová konverzace";
              const { data: created, error: createError } = await client
                .from("conversations").insert({ user_id: user.id, title }).select("id").single();
              if (createError) throw createError;
              conversationId = created.id;
              setCloudConversationId(conversationId);
            }
            const { error: saveError } = await client.from("messages").insert([
              { conversation_id: conversationId, user_id: user.id, role: "user", content },
              { conversation_id: conversationId, user_id: user.id, role: "assistant", content: data.reply },
            ]);
            if (saveError) throw saveError;
            await client.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId).eq("user_id", user.id);
            setCloudSyncNotice("Konverzace uložena do cloudu.");
          }
        } catch {
          setCloudSyncNotice("Odpověď je hotová, ale cloudové uložení se nezdařilo. Lokální historie zůstává dostupná.");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Něco se pokazilo. Zkus to znovu.");
    } finally { setBusy(false); textareaRef.current?.focus(); }
  }
  function onSubmit(e: FormEvent) { e.preventDefault(); void send(); }

  async function handleFile(file?: File) {
    if (!file) return;
    const name = file.name.toLowerCase();
    const textFile = /\.(txt|md|csv|json|html|xml|log)$/i.test(name);
    const documentFile = /\.(pdf|docx)$/i.test(name);
    if (!textFile && !documentFile) {
      setError("Podporované formáty jsou TXT, MD, CSV, JSON, HTML, XML, LOG, PDF a DOCX.");
      return;
    }
    if (file.size > (documentFile ? 5 * 1024 * 1024 : 15000)) {
      setError(documentFile ? "Dokument je příliš velký. Limit PDF/DOCX je 5 MB." : "Textový soubor je příliš velký. Limit je 15 kB.");
      return;
    }
    try {
      let text = "";
      if (documentFile) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/files/extract", { method: "POST", body: form });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Dokument se nepodařilo přečíst.");
        text = typeof data.text === "string" ? data.text : "";
      } else {
        text = await file.text();
      }
      if (!text.trim()) throw new Error("V souboru nebyl nalezen čitelný text.");
      setDraft(current => current + (current.trim() ? "\n\n" : "") + "[Obsah souboru: " + file.name + "]\n" + text.slice(0, 100000));
      setError("");
      textareaRef.current?.focus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Soubor se nepodařilo přečíst.");
    }
  }

  return <main className="app-shell">
    {sidebarOpen && <button aria-label="Zavřít menu" className="mobile-scrim" onClick={() => setSidebarOpen(false)} />}
    <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
      <div className="brand-row"><div className="brand-mark"><Sparkles size={20}/></div><span className="brand-name">astra<span>ai</span></span><button className="icon-button mobile-close" aria-label="Zavřít menu" onClick={() => setSidebarOpen(false)}><X size={18}/></button></div>
      <button className="new-chat" onClick={() => {setMessages([]);setError("");setSidebarOpen(false);try{window.localStorage.removeItem("astra-ai-chat-v1")}catch{/* Ignore unavailable storage. */}}}><Plus size={17}/> Nová konverzace <span>⌘ K</span></button>
      <div className="side-label">PRACOVNÍ PROSTOR</div>
      <button className="side-link active"><Sparkles size={17}/> Chat <span className="active-dot"/></button>
      <button className="side-link" onClick={() => { window.location.href = "/account"; }}><UserRound size={17}/> Účet / přihlášení</button>
      <button className="side-link" onClick={() => { window.location.href = "/memory"; }}><BrainCircuit size={17}/> Moje paměť</button>
      <button className="side-link" onClick={() => { window.location.href = "/code"; }}><Code2 size={17}/> Programování</button>
      <button className="side-link" onClick={() => { window.location.href = "/marketing"; }}><Megaphone size={17}/> Marketing</button>
      <button className="side-link" onClick={() => { window.location.href = "/images"; }}><ImageIcon size={17}/> Obrázky</button>
      <button className="side-link" onClick={() => { window.location.href = "/video"; }}><Film size={17}/> Video</button>
      <div className="sidebar-bottom"><div className="status-card"><span className="status-pulse"/><div><strong>Pracovní verze</strong><small>Vývoj právě začíná</small></div><Activity size={16}/></div><div className="profile-row"><div className="avatar">A</div><div><strong>Astra AI</strong><small>Osobní AI prostor</small></div><ChevronDown size={15}/></div></div>
    </aside>
    <section className="main-panel">
      <header className="topbar"><button className="icon-button menu-button" aria-label="Otevřít menu" onClick={() => setSidebarOpen(true)}><Menu size={20}/></button><div className="breadcrumb"><span>Pracovní prostor</span><span className="crumb-slash">/</span><strong>Chat</strong></div><div className="topbar-right"><span className="model-indicator"><span/> AI model</span><label className="model-select" aria-label="Vybrat AI model"><select value={model} onChange={e => setModel(e.target.value)}><option value="gpt-4.1-mini">Rychlý</option><option value="gpt-4.1">Pokročilý</option><option value="gpt-4o-mini">Úsporný</option></select><ChevronDown size={14}/></label></div></header>
      {cloudSyncNotice && <div className="cloud-sync-notice" role="status">{cloudSyncNotice}</div>}
      <div className={`conversation ${messages.length ? "conversation-active" : ""}`}>
        {messages.length === 0 ? <div className="welcome"><div className="eyebrow"><WandSparkles size={14}/> VÁŠ NOVÝ PRACOVNÍ PROSTOR</div><h1>Velké nápady začínají<br/><span>jednou otázkou.</span></h1><p className="welcome-subtitle">Přemýšlej, tvoř a stavěj. Jedno místo pro práci s AI — postupně vybavené nástroji, které potřebuješ.</p><div className="starter-grid">{starters.map(({icon:Icon,title,text}) => <button className="starter-card" key={title} onClick={() => void send(text)}><div className="starter-icon"><Icon size={18}/></div><strong>{title}</strong><span>{text}</span><ArrowUp className="starter-arrow" size={15}/></button>)}</div><div className="trust-line"><span><Check size={13}/> Samostatný projekt</span><span><Check size={13}/> Soukromí na prvním místě</span><span><Check size={13}/> Postupně rozšiřitelné</span></div></div> : <div className="message-list">{messages.map((m,i) => <div className={`message ${m.role}`} key={`${i}-${m.role}`}><div className="message-avatar">{m.role === "assistant" ? <Sparkles size={16}/> : "Ty"}</div><div className="message-content"><div className="message-role">{m.role === "assistant" ? "Astra AI" : "Ty"}</div><p>{m.content}</p></div></div>)}{busy && <div className="message assistant"><div className="message-avatar"><Sparkles size={16}/></div><div className="message-content"><div className="message-role">Astra AI</div><div className="typing"><span/><span/><span/></div></div></div>}<div ref={bottomRef}/></div>}
      </div>
      <div className="composer-area">{error && <div className="error-banner"><span>{error}</span><button aria-label="Zavřít upozornění" onClick={() => setError("")}><X size={15}/></button></div>}<form className="composer" onSubmit={onSubmit}><textarea ref={textareaRef} value={draft} onChange={e => setDraft(e.target.value)} placeholder="Na co dnes společně přijdeme?" rows={1} onKeyDown={e => {if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send()}}}/><div className="composer-footer"><div className="composer-tools"><button type="button" className="tool-button" onClick={() => fileInputRef.current?.click()}><Paperclip size={16}/><span>Připojit soubor</span></button><input ref={fileInputRef} className="hidden-file-input" type="file" accept=".txt,.md,.csv,.json,.html,.xml,.log,.pdf,.docx,text/plain,text/markdown,text/csv,application/json,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e => { void handleFile(e.target.files?.[0]); e.currentTarget.value = ""; }} /><span className="composer-note">Enter pro odeslání · Shift + Enter pro nový řádek</span></div><button className="send-button" type="submit" disabled={!draft.trim()||busy} aria-label="Odeslat zprávu">{busy ? <span className="send-spinner"/> : <ArrowUp size={18}/>}</button></div></form><p className="disclaimer">Astra AI se vyvíjí. Ověřuj důležité informace a nesdílej tajné údaje.</p></div>
    </section>
  </main>;
}
