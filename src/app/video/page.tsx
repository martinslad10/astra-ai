'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Film, LoaderCircle, Sparkles, Download } from "lucide-react";

type VideoResponse = { id?: string; status?: string; output?: unknown; error?: unknown; errorMessage?: string };

function outputUrl(output: unknown): string {
  if (typeof output === "string" && /^https?:\/\//i.test(output)) return output;
  if (Array.isArray(output)) {
    const found = output.find(item => typeof item === "string" && /^https?:\/\//i.test(item));
    if (typeof found === "string") return found;
  }
  return "";
}

export default function VideoPage() {
  const [prompt, setPrompt] = useState("");
  const [status, setStatus] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || busy) return;
    setBusy(true); setError(""); setVideoUrl(""); setStatus("Spouštím generování…");
    try {
      const response = await fetch("/api/video", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompt.trim() }) });
      let data = await response.json() as VideoResponse;
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Generování se nezdařilo.");
      if (!data.id) {
        const url = outputUrl(data.output);
        if (url) { setVideoUrl(url); setStatus("Hotovo"); return; }
        throw new Error("Poskytovatel nevrátil ID generování ani odkaz na video.");
      }
      const id = data.id;
      for (let attempt = 0; attempt < 60; attempt++) {
        if (data.status === "succeeded") {
          const url = outputUrl(data.output);
          if (!url) throw new Error("Generování skončilo, ale poskytovatel nevrátil odkaz na video.");
          setVideoUrl(url); setStatus("Hotovo"); return;
        }
        if (data.status === "failed" || data.status === "canceled") throw new Error("Poskytovatel generování nedokončil. Zkontroluj model a jeho vstupní parametry.");
        setStatus(data.status === "starting" ? "Připravuji generování…" : "Video se vytváří…");
        await new Promise(resolve => setTimeout(resolve, 5000));
        const poll = await fetch("/api/video?id=" + encodeURIComponent(id), { cache: "no-store" });
        data = await poll.json() as VideoResponse;
        if (!poll.ok) throw new Error(typeof data.error === "string" ? data.error : "Stav generování se nepodařilo načíst.");
      }
      setStatus("Generování stále probíhá. Zkus to později znovu; ID úlohy: " + id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video se nepodařilo vytvořit.");
    } finally { setBusy(false); }
  }

  return <main className="image-page">
    <header className="image-header"><Link href="/" className="back-link"><ArrowLeft size={17}/> Zpět do Astra AI</Link><div className="brand-mark"><Sparkles size={19}/></div><strong>Astra AI <span>/ Video</span></strong></header>
    <section className="image-content">
      <div className="eyebrow"><Film size={14}/> GENEROVÁNÍ VIDEA</div>
      <h1>Dej nápadu<br/><span>pohyb.</span></h1>
      <p className="image-intro">Popiš scénu, pohyb kamery, světlo a náladu. Video se generuje přes externí službu Replicate; její model a účet musí být nastavené na serveru.</p>
      <form className="image-form" onSubmit={generate}>
        <label htmlFor="video-prompt">Popis videa</label>
        <textarea id="video-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Například: Filmový záběr sportovního auta na mokré silnici v noci, kamera plynule sleduje vůz, odlesky městských světel…" rows={5} maxLength={3000} required/>
        <div className="image-form-footer"><span>{prompt.length}/3000 znaků</span><button type="submit" disabled={!prompt.trim()||busy}>{busy ? <><LoaderCircle className="spin" size={16}/> Generuji…</> : <><Film size={16}/> Vytvořit video</>}</button></div>
      </form>
      {error && <div className="image-error" role="alert">{error}</div>}
      {status && <div className="image-placeholder" role="status"><LoaderCircle className={busy ? "spin" : ""} size={24}/><span>{status}</span></div>}
      {videoUrl && <div className="image-result"><video src={videoUrl} controls playsInline style={{display:"block",width:"100%"}}/><div className="image-result-footer"><span>Vygenerované video</span><a href={videoUrl} target="_blank" rel="noreferrer"><Download size={16}/> Otevřít / uložit</a></div></div>}
      <p className="image-disclaimer">Vyžaduje REPLICATE_API_TOKEN, REPLICATE_VIDEO_MODEL ve formátu owner/model a kredit u poskytovatele. Jednotlivé modely se liší podporovanými parametry; tato základní integrace posílá prompt. Použití může být zpoplatněno.</p>
    </section>
  </main>;
}
