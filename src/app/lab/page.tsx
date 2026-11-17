'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, FlaskConical, Lightbulb, Microscope, Code2, BriefcaseBusiness, Download, LoaderCircle, Sparkles } from "lucide-react";

type Mode = "research" | "invention" | "engineering" | "business";
type Result = {
  report: string;
  mode: Mode;
  workflow: { coordinator: boolean; specialist: boolean; independentReview: boolean; optionalToolsAvailable: boolean };
  caveat?: string | null;
};

const modes: { id: Mode; title: string; description: string; Icon: typeof Microscope }[] = [
  { id: "research", title: "Výzkum", description: "Rešerše, důkazy, studie a srovnání", Icon: Microscope },
  { id: "invention", title: "Vynálezy", description: "Nové koncepty, prototypy a testy", Icon: Lightbulb },
  { id: "engineering", title: "Inženýrství", description: "Architektura, algoritmy a technická řešení", Icon: Code2 },
  { id: "business", title: "Podnikání", description: "Produkty, trh, finance a strategie", Icon: BriefcaseBusiness },
];

export default function LabPage() {
  const [mode, setMode] = useState<Mode>("research");
  const [task, setTask] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(event: FormEvent) {
    event.preventDefault();
    if (!task.trim() || busy) return;
    setBusy(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, task: task.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Laboratoř úkol nedokončila.");
      setResult(data as Result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Laboratoř se nepodařilo spustit.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result) return;
    const blob = new Blob([result.report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "chatsladai-laboratorni-report.md";
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }

  return <main className="image-page">
    <header className="image-header">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Zpět do ChatSLADAI</Link>
      <div className="brand-mark"><FlaskConical size={19}/></div>
      <strong>ChatSLADAI <span>/ Výzkumná laboratoř</span></strong>
    </header>
    <section className="image-content">
      <div className="eyebrow"><BrainCircuit size={14}/> MULTI-AGENTNÍ PRACOVNÍ POSTUP</div>
      <h1>Od otázky<br/><span>k ověřitelnému řešení.</span></h1>
      <p className="image-intro">Laboratoř rozdělí úkol mezi koordinátora, odborný tým a nezávislého oponenta. Podle dostupnosti využije webové vyhledávání a výpočetní prostředí. Náročná analýza může spotřebovat více API kreditu.</p>

      <div className="marketing-select-grid">
        {modes.map(({ id, title, description, Icon }) => <button key={id} type="button" className={mode === id ? "document-mode active" : "document-mode"} onClick={() => setMode(id)}>
          <Icon size={18}/><strong>{title}</strong><span>{description}</span>
        </button>)}
      </div>

      <form className="image-form" onSubmit={run}>
        <label htmlFor="lab-task">Co chceš vyřešit, prozkoumat nebo vymyslet?</label>
        <textarea id="lab-task" value={task} onChange={e => setTask(e.target.value)} placeholder="Popiš cíl, co už víš, omezení, rozpočet nebo požadovaný výsledek. Čím přesnější zadání, tím lepší výstup." rows={7} maxLength={12000} required/>
        <div className="image-form-footer"><span>{task.length}/12000 znaků</span><button type="submit" disabled={!task.trim() || busy}>{busy ? <><LoaderCircle className="spin" size={16}/> Pracuji…</> : <><Sparkles size={16}/> Spustit výzkum</>}</button></div>
      </form>

      {busy && <div className="image-placeholder" role="status"><LoaderCircle className="spin" size={26}/><span>Koordinátor plánuje, odborný tým zpracovává zadání a oponent kontroluje výsledek. Může to chvíli trvat…</span></div>}
      {error && <div className="image-error" role="alert">{error}</div>}
      {result && <section className="image-result">
        <div className="image-result-footer"><strong>Výsledek laboratoře</strong><button type="button" onClick={download}><Download size={16}/> Stáhnout report</button></div>
        <div className="lab-workflow">
          <span>{result.workflow.coordinator ? "✓ Koordinátor" : "– Koordinátor"}</span>
          <span>{result.workflow.specialist ? "✓ Odborný tým" : "– Odborný tým"}</span>
          <span>{result.workflow.independentReview ? "✓ Kritická kontrola" : "! Kontrola nedokončena"}</span>
          <span>{result.workflow.optionalToolsAvailable ? "✓ Web / výpočty dostupné" : "! Bez webu / výpočtů"}</span>
        </div>
        {result.caveat && <p className="image-disclaimer">{result.caveat}</p>}
        <article className="lab-report">{result.report}</article>
      </section>}
      <p className="image-disclaimer">Laboratoř vytváří analýzy a návrhy, nikoli automaticky potvrzené vědecké objevy. Fyzické experimenty, klinické ověření, patentová rešerše a odborné schválení vyžadují další práci a odpovídající lidi či vybavení.</p>
    </section>
  </main>;
}
