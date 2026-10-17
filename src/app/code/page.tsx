'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Code2, Copy, LoaderCircle, Sparkles } from "lucide-react";

export default function CodePage() {
  const [task, setTask] = useState("");
  const [language, setLanguage] = useState("TypeScript / Next.js");
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!task.trim() || busy) return;
    setBusy(true); setError(""); setResult(""); setCopied(false);
    try {
      const response = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim(), language, context: context.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generování kódu se nezdařilo.");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kód se nepodařilo vygenerovat.");
    } finally { setBusy(false); }
  }

  async function copyResult() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
    } catch { setError("Kopírování se nepodařilo. Označ a zkopíruj text ručně."); }
  }

  return <main className="image-page">
    <header className="image-header">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Zpět do Astra AI</Link>
      <div className="brand-mark"><Sparkles size={19}/></div>
      <strong>Astra AI <span> / Programování</span></strong>
    </header>
    <section className="image-content">
      <div className="eyebrow"><Code2 size={14}/> PROGRAMOVACÍ ASISTENT</div>
      <h1>Od nápadu<br/><span>ke kódu.</span></h1>
      <p className="image-intro">Popiš funkci nebo chybu. Astra AI připraví návrh implementace a postup ověření.</p>
      <form className="image-form" onSubmit={generate}>
        <label htmlFor="code-task">Co chceš vytvořit nebo opravit?</label>
        <textarea id="code-task" value={task} onChange={e => setTask(e.target.value)} placeholder="Například: Vytvoř responzivní registrační formulář s validací a přístupnými chybovými hláškami…" rows={5} maxLength={6000} required/>
        <label htmlFor="code-language">Jazyk / technologie</label>
        <select id="code-language" value={language} onChange={e => setLanguage(e.target.value)}>
          <option>TypeScript / Next.js</option><option>React</option><option>JavaScript</option><option>Python</option><option>HTML / CSS</option><option>SQL</option><option>Jiné / navrhni vhodné</option>
        </select>
        <label htmlFor="code-context">Kontext projektu (nepovinné)</label>
        <textarea id="code-context" value={context} onChange={e => setContext(e.target.value)} placeholder="Vlož relevantní kód, chybovou hlášku nebo strukturu souborů…" rows={3} maxLength={5000}/>
        <div className="image-form-footer"><span>{task.length}/6000 znaků</span><button type="submit" disabled={!task.trim()||busy}>{busy ? <><LoaderCircle className="spin" size={16}/> Připravuji…</> : <><Code2 size={16}/> Vygenerovat kód</>}</button></div>
      </form>
      {error && <div className="image-error" role="alert">{error}</div>}
      {busy && <div className="image-placeholder"><LoaderCircle className="spin" size={26}/><span>Navrhuji implementaci…</span></div>}
      {result && <section className="image-result code-result"><div className="image-result-footer"><strong>Výstup Astra AI</strong><button type="button" onClick={() => void copyResult()}><Copy size={15}/> {copied ? "Zkopírováno" : "Kopírovat vše"}</button></div><pre>{result}</pre></section>}
      <p className="image-disclaimer">Tento nástroj generuje návrhy kódu, ale zatím neupravuje soubory v repozitáři a automaticky je nespouští. Před použitím kód zkontroluj a otestuj.</p>
    </section>
  </main>;
}
