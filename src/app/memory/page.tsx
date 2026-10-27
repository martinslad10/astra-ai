'use client';

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, Plus, Trash2, Save, Cloud, LogIn } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

type MemoryNote = { id: string; title: string; content: string; updatedAt: string };
type CloudMemoryRow = { id: string; title: string; content: string; updated_at: string };
const STORAGE_KEY = "astra-ai-memory-v1";

export default function MemoryPage() {
  const [notes, setNotes] = useState<MemoryNote[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [cloudBusy, setCloudBusy] = useState(false);

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
    setNotice("");
  }

  async function syncWithCloud() {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setNotice("Cloud není nastavený. V Supabase vytvoř projekt a do Vercelu přidej NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }

    setCloudBusy(true);
    setNotice("");
    try {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      const user = sessionData.session?.user;
      if (!user) {
        setNotice("Nejdřív se přihlas ke svému účtu. Pak se vrať sem a synchronizaci spusť znovu.");
        return;
      }

      const { data: remoteRows, error: readError } = await client
        .from("memory_notes")
        .select("id,title,content,updated_at")
        .order("updated_at", { ascending: false });
      if (readError) throw readError;

      const merged = new Map<string, MemoryNote>();
      for (const row of (remoteRows ?? []) as CloudMemoryRow[]) {
        merged.set(row.id, { id: row.id, title: row.title, content: row.content, updatedAt: row.updated_at });
      }
      for (const note of notes) merged.set(note.id, note);
      const mergedNotes = [...merged.values()]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 100);

      if (mergedNotes.length > 0) {
        const payload = mergedNotes.map(note => ({
          id: note.id,
          user_id: user.id,
          title: note.title,
          content: note.content,
          updated_at: note.updatedAt,
        }));
        const { error: writeError } = await client.from("memory_notes").upsert(payload, { onConflict: "id" });
        if (writeError) throw writeError;
      }

      const { data: finalRows, error: finalReadError } = await client
        .from("memory_notes")
        .select("id,title,content,updated_at")
        .order("updated_at", { ascending: false });
      if (finalReadError) throw finalReadError;
      const synced = ((finalRows ?? []) as CloudMemoryRow[]).map(row => ({
        id: row.id, title: row.title, content: row.content, updatedAt: row.updated_at,
      }));
      setNotes(synced.slice(0, 100));
      setNotice("Synchronizace dokončena. Poznámky z tohoto zařízení a cloudu byly sloučeny.");
    } catch (error) {
      const detail = error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : error instanceof Error ? error.message : String(error ?? "");
      const code = error && typeof error === "object" && "code" in error
        ? String((error as { code?: unknown }).code ?? "")
        : "";
      const description = [code, detail].filter(Boolean).join(": ") || "Podrobnosti chyby nejsou dostupné.";
      setNotice("Cloudovou paměť se nepodařilo synchronizovat. " + description);
    } finally {
      setCloudBusy(false);
    }
  }

  async function removeNote(id: string) {
    setNotes(current => current.filter(note => note.id !== id));
    const client = getSupabaseBrowserClient();
    if (!client) return;
    try {
      const { data } = await client.auth.getSession();
      if (!data.session?.user) return;
      const { error } = await client.from("memory_notes").delete().eq("id", id);
      if (error) setNotice("Poznámka byla odebrána z tohoto zařízení, ale její cloudové smazání se nepodařilo.");
    } catch {
      setNotice("Poznámka byla odebrána z tohoto zařízení; cloudové smazání se nepodařilo ověřit.");
    }
  }

  return <main className="memory-page">
    <header className="image-header">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Zpět do MARTIVEXA</Link>
      <div className="brand-mark"><BrainCircuit size={19}/></div>
      <strong>MARTIVEXA <span>/ Moje paměť</span></strong>
    </header>
    <section className="memory-content">
      <div className="eyebrow"><BrainCircuit size={14}/> UŽIVATELSKY ŘÍZENÁ PAMĚŤ</div>
      <h1>MARTIVEXA si zapamatuje<br/><span>to důležité.</span></h1>
      <p className="image-intro">Zapisuj si preference, cíle a informace, které chceš mít po ruce. Ve výchozím stavu se poznámky ukládají pouze v tomto prohlížeči. Synchronizace s cloudem je volitelná a vyžaduje účet MARTIVEXA a nakonfigurovaný Supabase.</p>
      <div className="memory-cloud-actions">
        <button type="button" onClick={syncWithCloud} disabled={cloudBusy || !ready}><Cloud size={16}/> {cloudBusy ? "Synchronizuji…" : "Synchronizovat s cloudem"}</button>
        <Link href="/account" className="back-link"><LogIn size={15}/> Účet / přihlášení</Link>
      </div>
      <form className="memory-form" onSubmit={addNote}>
        <label htmlFor="memory-title">Název poznámky</label>
        <input id="memory-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="Například: Moje dlouhodobé cíle" required />
        <label htmlFor="memory-content">Co si chceš uložit?</label>
        <textarea id="memory-content" value={content} onChange={e => setContent(e.target.value)} maxLength={8000} rows={5} placeholder="Napiš preference, cíle nebo další informace…" required />
        <div className="memory-form-footer"><span>{content.length}/8000 znaků</span><button type="submit" disabled={!title.trim() || !content.trim()}><Plus size={16}/> Uložit do paměti</button></div>
      </form>
      {notice && <p className="image-error" role="status">{notice}</p>}
      <div className="memory-list-heading"><h2>Uložené poznámky</h2><span>{notes.length}/100</span></div>
      {notes.length === 0 ? <div className="memory-empty"><BrainCircuit size={24}/><strong>Zatím tu nic není</strong><span>První poznámku přidáš formulářem výše.</span></div> :
        <div className="memory-list">{notes.map(note => <article className="memory-note" key={note.id}><div className="memory-note-main"><h3>{note.title}</h3><p>{note.content}</p><time dateTime={note.updatedAt}>{new Date(note.updatedAt).toLocaleString("cs-CZ")}</time></div><button type="button" className="memory-delete" aria-label={`Smazat poznámku ${note.title}`} onClick={() => removeNote(note.id)}><Trash2 size={16}/></button></article>)}</div>}
      <p className="image-disclaimer"><Save size={13} style={{display:"inline",verticalAlign:"-2px"}}/> Bez synchronizace zůstávají poznámky lokálně v prohlížeči. Lokální poznámky se posílají jako kontext do chatu; cloudové poznámky se zatím samostatně automaticky nenačítají. Synchronizace je slučuje s poznámkami tohoto zařízení a při přihlášení se pokusí smazání přenést také do cloudu.</p>
    </section>
  </main>;
}
