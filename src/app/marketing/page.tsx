'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, Sparkles, LoaderCircle, Copy } from "lucide-react";

export default function MarketingPage() {
  const [business, setBusiness] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [goal, setGoal] = useState("Získat nové zákazníky");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!business.trim() || busy) return;
    setBusy(true); setError(""); setResult("");
    try {
      const response = await fetch("/api/marketing", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business, audience, platform, goal }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Požadavek se nezdařil.");
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Marketingový návrh se nepodařilo vytvořit.");
    } finally { setBusy(false); }
  }

  return <main className="memory-page">
    <header className="image-header">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Zpět do Astra AI</Link>
      <div className="brand-mark"><Megaphone size={19}/></div>
      <strong>Astra AI <span>/ Marketing</span></strong>
    </header>
    <section className="memory-content">
      <div className="eyebrow"><Megaphone size={14}/> MARKETINGOVÁ DÍLNA</div>
      <h1>Od nápadu<br/><span>k zákazníkům.</span></h1>
      <p className="image-intro">Vytvoř si konkrétní návrhy příspěvků, krátkých videí, výzvy k akci a týdenní plán obsahu. Vše můžeš před zveřejněním upravit.</p>
      <form className="memory-form" onSubmit={generate}>
        <label htmlFor="marketing-business">Co nabízíš?</label>
        <textarea id="marketing-business" value={business} onChange={e => setBusiness(e.target.value)} maxLength={5000} rows={5} placeholder="Popiš produkt/službu, cenu, výhody a místo působení…" required />
        <label htmlFor="marketing-audience">Cíloví zákazníci (volitelné)</label>
        <input id="marketing-audience" value={audience} onChange={e => setAudience(e.target.value)} maxLength={500} placeholder="Např. lokální zákazníci, věk, potřeby…" />
        <div className="marketing-select-grid">
          <div><label htmlFor="marketing-platform">Platforma</label><select id="marketing-platform" value={platform} onChange={e => setPlatform(e.target.value)}><option>Instagram</option><option>Facebook</option><option>TikTok</option><option>LinkedIn</option><option>YouTube Shorts</option></select></div>
          <div><label htmlFor="marketing-goal">Hlavní cíl</label><select id="marketing-goal" value={goal} onChange={e => setGoal(e.target.value)}><option>Získat nové zákazníky</option><option>Budovat povědomí</option><option>Prodat konkrétní produkt</option><option>Získat poptávky</option><option>Budovat komunitu</option></select></div>
        </div>
        <div className="memory-form-footer"><span>{business.length}/5000 znaků</span><button type="submit" disabled={!business.trim() || busy}>{busy ? <><LoaderCircle className="spin" size={16}/> Připravuji…</> : <><Sparkles size={16}/> Vytvořit marketingový plán</>}</button></div>
      </form>
      {error && <p className="image-error" role="alert">{error}</p>}
      {busy && <div className="memory-empty"><LoaderCircle className="spin" size={24}/><span>Astra připravuje návrhy…</span></div>}
      {result && <section className="marketing-result"><div className="marketing-result-head"><h2>Tvůj marketingový návrh</h2><button type="button" onClick={() => { void navigator.clipboard.writeText(result); }}><Copy size={14}/> Kopírovat</button></div><pre>{result}</pre></section>}
      <p className="image-disclaimer">Návrhy jsou vytvořené AI a před zveřejněním je zkontroluj. Astra nic automaticky nepublikuje. Použití vyžaduje nastavený API klíč a může být zpoplatněno.</p>
    </section>
  </main>;
}
