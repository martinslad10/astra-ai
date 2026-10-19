'use client';

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Code2, Copy, Download, FileCode2, LoaderCircle, Sparkles, Trash2, Upload } from "lucide-react";

type SourceFile = { name: string; content: string };

const ALLOWED_SOURCE = /\.(ts|tsx|js|jsx|mjs|cjs|py|json|css|scss|html|md|mdx|sql|yml|yaml|toml|sh|txt)$/i;
const MAX_SOURCE_TOTAL = 20_000;

export default function CodePage() {
  const [task, setTask] = useState("");
  const [language, setLanguage] = useState("TypeScript / Next.js");
  const [context, setContext] = useState("");
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function addSourceFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (!selected.length) return;
    const accepted: SourceFile[] = [];
    let size = sourceFiles.reduce((sum, file) => sum + file.content.length, 0);
    try {
      for (const file of selected) {
        if (!ALLOWED_SOURCE.test(file.name)) {
          throw new Error(`Soubor ${file.name} nemá podporovaný textový formát.`);
        }
        if (file.size > 15_000) {
          throw new Error(`Soubor ${file.name} je příliš velký. Limit jednoho souboru je 15 kB.`);
        }
        const content = await file.text();
        if (size + content.length > MAX_SOURCE_TOTAL) {
          throw new Error("Celkový limit nahraného kontextu projektu je 20 000 znaků.");
        }
        size += content.length;
        accepted.push({ name: file.name, content });
      }
      setSourceFiles(current => [...current, ...accepted].slice(0, 8));
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Soubory se nepodařilo načíst.");
    }
  }

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!task.trim() || busy) return;
    const filesContext = sourceFiles.map(file => `\n\n--- PROJECT FILE: ${file.name} ---\n${file.content}`).join("");
    const combinedContext = [context.trim(), filesContext].filter(Boolean).join("\n\n");
    if (combinedContext.length > 25_000) {
      setError("Kontext je příliš dlouhý. Odeber některé soubory nebo zkrať text.");
      return;
    }
    setBusy(true); setError(""); setResult(""); setCopied(false);
    try {
      const response = await fetch("/api/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim(), language, context: combinedContext }),
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

  function downloadResult() {
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "astra-ai-code-proposal.md";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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
      <p className="image-intro">Popiš funkci nebo chybu a přidej relevantní zdrojové soubory. Astra připraví návrh řešení, který si můžeš zkopírovat nebo stáhnout ke kontrole.</p>
      <form className="image-form" onSubmit={generate}>
        <label htmlFor="code-task">Co chceš vytvořit nebo opravit?</label>
        <textarea id="code-task" value={task} onChange={e => setTask(e.target.value)} placeholder="Například: Oprav validaci formuláře a zachovej stávající design…" rows={5} maxLength={6000} required/>
        <label htmlFor="code-language">Jazyk / technologie</label>
        <select id="code-language" value={language} onChange={e => setLanguage(e.target.value)}>
          <option>TypeScript / Next.js</option><option>React</option><option>JavaScript</option><option>Python</option><option>HTML / CSS</option><option>SQL</option><option>Jiné / navrhni vhodné</option>
        </select>
        <label htmlFor="code-context">Kontext projektu / chybová hláška</label>
        <textarea id="code-context" value={context} onChange={e => setContext(e.target.value)} placeholder="Vlož chybovou hlášku, požadavky nebo strukturu souborů…" rows={3} maxLength={5000}/>
        <div className="memory-cloud-actions">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={sourceFiles.length >= 8}><Upload size={16}/> Přidat zdrojové soubory</button>
          <input ref={fileInputRef} type="file" multiple hidden accept=".ts,.tsx,.js,.jsx,.mjs,.cjs,.py,.json,.css,.scss,.html,.md,.mdx,.sql,.yml,.yaml,.toml,.sh,.txt" onChange={e => void addSourceFiles(e)}/>
          <span className="image-disclaimer">{sourceFiles.length}/8 souborů · celkem max. 20 kB</span>
        </div>
        {sourceFiles.length > 0 && <div className="memory-list">{sourceFiles.map((file, index) => <article className="memory-note" key={file.name + index}><div className="memory-note-main"><h3><FileCode2 size={14} style={{display:"inline",verticalAlign:"-2px"}}/> {file.name}</h3><p>{file.content.length.toLocaleString("cs-CZ")} znaků</p></div><button type="button" className="memory-delete" aria-label={`Odebrat soubor ${file.name}`} onClick={() => setSourceFiles(current => current.filter((_, i) => i !== index))}><Trash2 size={16}/></button></article>)}</div>}
        <div className="image-form-footer"><span>{task.length}/6000 znaků</span><button type="submit" disabled={!task.trim()||busy}>{busy ? <><LoaderCircle className="spin" size={16}/> Připravuji…</> : <><Code2 size={16}/> Vygenerovat návrh</>}</button></div>
      </form>
      {error && <div className="image-error" role="alert">{error}</div>}
      {busy && <div className="image-placeholder"><LoaderCircle className="spin" size={26}/><span>Analyzuji zadání a kontext…</span></div>}
      {result && <section className="image-result code-result"><div className="image-result-footer"><strong>Návrh Astra AI</strong><div style={{display:"flex",gap:8}}><button type="button" onClick={() => void copyResult()}><Copy size={15}/> {copied ? "Zkopírováno" : "Kopírovat"}</button><button type="button" onClick={downloadResult}><Download size={15}/> Stáhnout .md</button></div></div><pre>{result}</pre></section>}
      <p className="image-disclaimer">Nahrané soubory se zpracovávají v prohlížeči a jejich text se odešle AI API jako kontext požadavku. Neodesílej tajné klíče, hesla ani osobní údaje. Tento nástroj zatím automaticky nemění soubory ani nespouští kód; návrh vždy zkontroluj a otestuj.</p>
    </section>
  </main>;
}
