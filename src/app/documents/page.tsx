'use client';

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileText, LoaderCircle, Sparkles, Upload } from "lucide-react";

export default function DocumentsPage() {
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [instructions, setInstructions] = useState("");
  const [title, setTitle] = useState("Nový dokument");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!next) return;
    if (!/\.docx$/i.test(next.name)) { setError("Nahraj dokument Microsoft Word ve formátu .docx."); return; }
    if (next.size > 5 * 1024 * 1024) { setError("Limit dokumentu je 5 MB."); return; }
    setFile(next); setError(""); setResult(""); setDownloadUrl("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !instructions.trim() || (mode === "edit" && !file)) return;
    setBusy(true); setError(""); setResult(""); setDownloadUrl("");
    try {
      let fileBase64 = "";
      if (mode === "edit" && file) {
        const buffer = await file.arrayBuffer();
        let binary = "";
        new Uint8Array(buffer).forEach(byte => { binary += String.fromCharCode(byte); });
        fileBase64 = btoa(binary);
      }
      const response = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, title: title.trim() || "Dokument", instructions: instructions.trim(), fileName: file?.name ?? "", fileBase64 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Dokument se nepodařilo připravit.");
      setResult(data.preview || "Dokument je připraven ke stažení.");
      const binary = atob(data.docxBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }));
      setDownloadUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dokument se nepodařilo připravit.");
    } finally { setBusy(false); }
  }

  return <main className="memory-page">
    <header className="image-header">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Zpět do MARTIVEXA</Link>
      <div className="brand-mark"><FileText size={19}/></div>
      <strong>MARTIVEXA <span>/ Word a dokumenty</span></strong>
    </header>
    <section className="memory-content">
      <div className="eyebrow"><FileText size={14}/> DOKUMENTOVÁ DÍLNA</div>
      <h1>Dokumenty<br/><span>připravené k práci.</span></h1>
      <p className="image-intro">Vytvářej nové soubory Microsoft Word (.docx) nebo nahraj existující dokument a nech si připravit upravenou verzi ke stažení. Původní soubor se nepřepisuje.</p>
      <div className="marketing-select-grid">
        <button type="button" className={mode === "create" ? "document-mode active" : "document-mode"} onClick={() => { setMode("create"); setFile(null); setResult(""); setDownloadUrl(""); setError(""); }}>Vytvořit dokument</button>
        <button type="button" className={mode === "edit" ? "document-mode active" : "document-mode"} onClick={() => { setMode("edit"); setResult(""); setDownloadUrl(""); setError(""); }}>Upravit existující DOCX</button>
      </div>
      <form className="memory-form" onSubmit={submit}>
        <label htmlFor="doc-title">Název dokumentu</label>
        <input id="doc-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} placeholder="Např. Nabídka služeb" />
        {mode === "edit" && <>
          <label>Soubor Word (.docx)</label>
          <button type="button" className="document-upload" onClick={() => inputRef.current?.click()}><Upload size={17}/> {file ? file.name : "Vybrat dokument z telefonu nebo počítače"}</button>
          <input ref={inputRef} className="hidden-file-input" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={chooseFile}/>
        </>}
        <label htmlFor="doc-instructions">{mode === "create" ? "Co má dokument obsahovat?" : "Jak chceš dokument upravit?"}</label>
        <textarea id="doc-instructions" value={instructions} onChange={e => setInstructions(e.target.value)} maxLength={6000} rows={7} required placeholder={mode === "create" ? "Např. vytvoř profesionální nabídku služeb, s nadpisy, úvodem, přehledem cen a závěrečnou výzvou…" : "Např. oprav pravopis, zkrať text, zachovej fakta a nadpisy a přeuspořádej obsah do přehledných částí…"}/>
        <div className="memory-form-footer"><span>{instructions.length}/6000 znaků</span><button type="submit" disabled={!instructions.trim() || busy || (mode === "edit" && !file)}>{busy ? <><LoaderCircle className="spin" size={16}/> Pracuji…</> : <><Sparkles size={16}/> {mode === "create" ? "Vytvořit DOCX" : "Upravit a vytvořit DOCX"}</>}</button></div>
      </form>
      {error && <p className="image-error" role="alert">{error}</p>}
      {busy && <div className="memory-empty"><LoaderCircle className="spin" size={24}/><span>MARTIVEXA připravuje dokument…</span></div>}
      {downloadUrl && <section className="marketing-result"><h2>Dokument je připraven</h2><p>{result}</p><a className="document-download" href={downloadUrl} download={(title.trim() || "dokument").replace(/[^\p{L}\p{N}_ -]/gu, "").trim().replace(/\s+/g, "-") + ".docx"}><Download size={16}/> Stáhnout soubor Word (.docx)</a></section>}
      <p className="image-disclaimer">Při úpravách pracuj s kopií dokumentu. Zkontroluj výstup, zejména čísla, právní texty, tabulky a důležité údaje. Zatím se negarantuje zachování složitého původního rozvržení, obrázků a všech tabulek.</p>
    </section>
  </main>;
}
