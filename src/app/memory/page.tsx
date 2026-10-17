'use client';

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, Plus, Trash2, Save } from "lucide-react";

type MemoryNote = { id: string; title: string; content: string; updatedAt: string };
const STORAGE_KEY = "astra-ai-memory-v1";

export default function MemoryPage() {
  const [notes, setNotes] = useState<MemoryNote[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) setNotes(parsed.filter((n): n is MemoryNote =>
          n !== null && typeof n === "object" && "id" in n && "title" in n &&
          "content" in n && "updatedAt" in n &&
          typeof (n as MemoryNote).id === "string" && typeof (n as MemoryNote).title === "string" &&
          typeof (n as MemoryNote).content === "string" && typeof (n as MemoryNote).updatedAt === "string"
        ));
      }
    } catch { /* Ignore invalid local data. */ }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      setNotice("");
    } catch {
      setNotice("Paměť se nepodařilo uložit. V zařízení může být nedostatek místa.");
    }
  }, [notes, ready]);

  function addNote(event: FormEvent) {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanTitle || !cleanContent) return;
    if (cleanTitle.length > 120 || cleanContent.length > 8000) {
      setNotice("Název může mít maximálně 120 a obsah 8 000 znaků.");
      return;
    }
    setNotes(current => [{ id: crypto.randomUUID(), title: cleanTitle, content: cleanContent, updatedAt: new Date().toISOString() }, ...current].slice(0, 100));
    setTitle("");
    setContent("");
  }

  function removeNote(id: string) {
    setNotes(current => current.filter(note => note.id !== id));
  }

  return <main className="memory-page">
    <header className="image-header">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Zpět do Astra AI</Link>
      <div className="brand-mark"><BrainCircuit size={19}/></div>
      <strong>Astra AI <span>/ Moje paměť</span></strong>
    </header>
    <section className="memory-content">
      <div className="eyebrow"><BrainCircuit size={14}/> UŽIVATELSKY ŘÍZENÁ PAMĚŤ</div>
      <h1>Astra si zapamatuje<br/><span>to důležité.</span></h1>
      <p className="image-intro">Zapisuj si preference, cíle a informace, které chceš mít po ruce. Zatím se ukládají pouze v tomto prohlížeči a nejsou automaticky přidávány do odpovědí AI.</p>
      <form className="memory-form" onSubmit={addNote}>
        <label htmlFor="memory-title">Název poznámky</label>
        <input id="memory-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="Například: Moje dlouhodobé cíle" required />
        <label htmlFor="memory-content">Co si chceš uložit?</label>
        <textarea id="memory-content" value={content} onChange={e => setContent(e.target.value)} maxLength={8000} rows={5} placeholder="Napiš preference, cíle nebo další informace…" required />
        <div className="memory-form-footer"><span>{content.length}/8000 znaků</span><button type="submit" disabled={!title.trim() || !content.trim()}><Plus size={16}/> Uložit do paměti</button></div>
      </form>
      {notice && <p className="image-error" role="alert">{notice}</p>}
      <div className="memory-list-heading"><h2>Uložené poznámky</h2><span>{notes.length}/100</span></div>
      {notes.length === 0 ? <div className="memory-empty"><BrainCircuit size={24}/><strong>Zatím tu nic není</strong><span>První poznámku přidáš formulářem výše.</span></div> :
        <div className="memory-list">{notes.map(note => <article className="memory-note" key={note.id}><div className="memory-note-main"><h3>{note.title}</h3><p>{note.content}</p><time dateTime={note.updatedAt}>{new Date(note.updatedAt).toLocaleString("cs-CZ")}</time></div><button type="button" className="memory-delete" aria-label={`Smazat poznámku ${note.title}`} onClick={() => removeNote(note.id)}><Trash2 size={16}/></button></article>)}</div>}
      <p className="image-disclaimer"><Save size={13} style={{display:"inline",verticalAlign:"-2px"}}/> Poznámky jsou uloženy lokálně v prohlížeči. Smazáním dat webu nebo změnou zařízení se nemusí přenést. Nejde zatím o cloudovou paměť účtu.</p>
    </section>
  </main>;
}
