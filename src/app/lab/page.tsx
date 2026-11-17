'use client';

import { FormEvent, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, FlaskConical, Lightbulb, Microscope, Code2, BriefcaseBusiness, Download, LoaderCircle, Sparkles, Send, Mic, Volume2, Square } from "lucide-react";

type Mode = "research" | "invention" | "engineering" | "business";
type Turn = { role: "user" | "assistant"; content: string };
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
  const [turns, setTurns] = useState<Turn[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);

  async function run(event: FormEvent) {
    event.preventDefault();
    const prompt = task.trim();
    if (!prompt || busy) return;
    const previousTurns = turns;
    const nextTurns: Turn[] = [...previousTurns, { role: "user", content: prompt }];
    setTurns(nextTurns);
    setTask("");
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, task: prompt, history: previousTurns.slice(-6).map(turn => ({ ...turn, content: turn.content.slice(0, 2200) })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Laboratoř úkol nedokončila.");
      const answer = data as Result;
      setResult(answer);
      setTurns([...nextTurns, { role: "assistant", content: answer.report }]);
      if (voiceMode) void speak(answer.report);
    } catch (err) {
      setTurns(previousTurns);
      setTask(prompt);
      setError(err instanceof Error ? err.message : "Laboratoř se nepodařilo spustit.");
    } finally {
      setBusy(false);
    }
  }

  async function speak(text: string) {
    try {
      const response = await fetch("/api/audio/speech", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text.slice(0, 8000) }) });
      if (!response.ok) { const data = await response.json(); throw new Error(data.error || "Hlas se nepodařilo vytvořit."); }
      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();
    } catch (e) { setError(e instanceof Error ? e.message : "Hlasový výstup se nezdařil."); }
  }

  async function toggleRecording() {
    if (recording) { recorderRef.current?.stop(); return; }
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") throw new Error("Prohlížeč nepodporuje nahrávání hlasu nebo nemá povolený mikrofon.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find(type => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        setRecording(false); stream.getTracks().forEach(track => track.stop());
        try {
          const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
          const form = new FormData(); form.append("file", blob, blob.type.includes("mp4") ? "voice.m4a" : "voice.webm");
          const response = await fetch("/api/audio/transcribe", { method: "POST", body: form });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Hlas se nepodařilo přepsat.");
          if (typeof data.text === "string" && data.text.trim()) {
            if (voiceMode) { setTask(data.text.trim()); setTimeout(() => { const form = document.querySelector<HTMLFormElement>(".image-form"); form?.requestSubmit(); }, 0); }
            else setTask(current => (current.trim() ? current + " " : "") + data.text.trim());
          }
        } catch (e) { setError(e instanceof Error ? e.message : "Přepis hlasu se nezdařil."); }
      };
      recorderRef.current = recorder; recorder.start(); setRecording(true); setError("");
    } catch (e) { setError(e instanceof Error ? e.message : "Mikrofon se nepodařilo spustit."); }
  }

  function download() {
    if (!turns.length) return;
    const markdown = "# ChatSLADAI – pracovní sezení laboratoře\n\n" +
      turns.map(turn => (turn.role === "user" ? "## Zadání uživatele" : "## Výstup laboratoře") + "\n\n" + turn.content).join("\n\n---\n\n");
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "chatsladai-laboratorni-sezeni.md";
    document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  }

  return <main className="image-page">
    <header className="image-header">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Zpět do ChatSLADAI</Link>
      <div className="brand-mark"><FlaskConical size={19}/></div>
      <strong>ChatSLADAI <span>/ Výzkumná laboratoř</span></strong>
    </header>
    <section className="image-content">
      <div className="eyebrow"><BrainCircuit size={14}/> ITERATIVNÍ VÝZKUM A TVORBA</div>
      <h1>Od nápadu<br/><span>k prototypu.</span></h1>
      <p className="image-intro">Laboratoř nejen vysvětluje. Navrhuje varianty, rozpracovává nápady, hledá slabiny a pomáhá je postupně vylepšovat. Po každé odpovědi můžeš pokračovat, klást otázky a měnit zadání – předchozí průběh zůstává v kontextu.</p>

      {turns.length === 0 && <div className="marketing-select-grid">
        {modes.map(({ id, title, description, Icon }) => <button key={id} type="button" className={mode === id ? "document-mode active" : "document-mode"} onClick={() => setMode(id)}>
          <Icon size={18}/><strong>{title}</strong><span>{description}</span>
        </button>)}
      </div>}
      {turns.length > 0 && <div className="lab-session-mode"><strong>Režim sezení:</strong> {modes.find(item => item.id === mode)?.title} <span>· Kontext předchozích odpovědí je aktivní</span></div>}

      <form className="image-form" onSubmit={run}>
        <label htmlFor="lab-task">{turns.length ? "Na co chceš navázat nebo co mám změnit?" : "Co chceš vyřešit, prozkoumat nebo vymyslet?"}</label>
        <textarea id="lab-task" value={task} onChange={e => setTask(e.target.value)} placeholder={turns.length ? "Například: Rozpracuj variantu 2, navrhni konkrétní prototyp a uprav ho tak, aby byl levnější…" : "Popiš cíl, omezení a požadovaný výsledek. Laboratoř může navrhnout více variant a rozpracovat nejlepší z nich."} rows={5} maxLength={12000} required/>
        <div className="image-form-footer"><span>{task.length}/12000 znaků</span><button type="button" onClick={() => setVoiceMode(v => !v)} className={voiceMode ? "tool-button voice-active" : "tool-button"}><Volume2 size={15}/> Hlasový režim</button><button type="button" onClick={() => void toggleRecording()} className={recording ? "tool-button voice-recording" : "tool-button"}>{recording ? <Square size={15}/> : <Mic size={15}/>} {recording ? "Zastavit" : "Mluvit"}</button><button type="submit" disabled={!task.trim() || busy}>{busy ? <><LoaderCircle className="spin" size={16}/> Pracuji…</> : <><Send size={16}/> {turns.length ? "Pokračovat v práci" : "Spustit laboratoř"}</>}</button></div>
      </form>

      {busy && <div className="image-placeholder" role="status"><LoaderCircle className="spin" size={26}/><span>Koordinátor plánuje, odborný tým tvoří a oponent kontroluje výsledek. Může to chvíli trvat…</span></div>}
      {error && <div className="image-error" role="alert">{error}</div>}
      {turns.length > 0 && <section className="image-result">
        <div className="image-result-footer"><strong>Pracovní sezení laboratoře</strong><button type="button" onClick={download}><Download size={16}/> Stáhnout celé sezení</button></div>
        {result && <div className="lab-workflow">
          <span>{result.workflow.coordinator ? "✓ Koordinátor" : "– Koordinátor"}</span>
          <span>{result.workflow.specialist ? "✓ Odborný tým" : "– Odborný tým"}</span>
          <span>{result.workflow.independentReview ? "✓ Kritická kontrola" : "! Kontrola nedokončena"}</span>
          <span>{result.workflow.optionalToolsAvailable ? "✓ Web / výpočty povoleny" : "! Bez webu / výpočtů"}</span>
        </div>}
        {result?.caveat && <p className="image-disclaimer">{result.caveat}</p>}
        <div className="lab-conversation">
          {turns.map((turn, index) => <article className={turn.role === "user" ? "lab-turn lab-turn-user" : "lab-turn"} key={index}>
            <strong>{turn.role === "user" ? "Tvoje zadání" : "ChatSLADAI – laboratoř"}</strong>
            <div className="lab-report">{turn.content}</div>{turn.role === "assistant" && <button type="button" className="speak-message" onClick={() => void speak(turn.content)}><Volume2 size={15}/> Přečíst nahlas</button>}
          </article>)}
        </div>
      </section>}
      <p className="image-disclaimer">Laboratoř vytváří návrhy a hypotézy, nikoli automaticky potvrzené vědecké objevy. Fyzické experimenty, klinické ověření, patentová rešerše a odborné schválení vyžadují další práci a odpovídající lidi či vybavení.</p>
    </section>
  </main>;
}
