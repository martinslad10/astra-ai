'use client';

import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Download, Image as ImageIcon, LoaderCircle, Sparkles } from "lucide-react";

export default function ImagesPage() {
  const [prompt, setPrompt] = useState("");
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function generate(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim() || busy) return;
    setBusy(true); setError(""); setImage("");
    try {
      const response = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generování se nezdařilo.");
      setImage(data.image);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Obrázek se nepodařilo vytvořit.");
    } finally { setBusy(false); }
  }

  return <main className="image-page">
    <header className="image-header">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Zpět do MARTIVEXA</Link>
      <div className="brand-mark"><Sparkles size={19}/></div>
      <strong>MARTIVEXA <span> / Obrázky</span></strong>
    </header>
    <section className="image-content">
      <div className="eyebrow"><ImageIcon size={14}/> TVORBA OBRAZŮ</div>
      <h1>Proměň představu<br/><span>v obraz.</span></h1>
      <p className="image-intro">Popiš scénu, styl, světlo a kompozici. MARTIVEXA odešle zadání do připojeného obrazového modelu.</p>
      <form className="image-form" onSubmit={generate}>
        <label htmlFor="image-prompt">Popis obrázku</label>
        <textarea id="image-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Například: Fotorealistický futuristický ateliér v noci, měkké fialové světlo, filmová kompozice…" rows={5} maxLength={4000}/>
        <div className="image-form-footer"><span>{prompt.length}/4000 znaků</span><button type="submit" disabled={!prompt.trim()||busy}>{busy ? <><LoaderCircle className="spin" size={16}/> Generuji…</> : <><Sparkles size={16}/> Vygenerovat obrázek</>}</button></div>
      </form>
      {error && <div className="image-error" role="alert">{error}</div>}
      {busy && <div className="image-placeholder"><LoaderCircle className="spin" size={26}/><span>Obrazový model pracuje…</span></div>}
      {image && <div className="image-result"><Image src={image} alt={prompt || "Vygenerovaný obrázek"} width={1024} height={1024} unoptimized/><div className="image-result-footer"><span>Vygenerovaný obrázek</span><a href={image} download="martivexa-image.png"><Download size={16}/> Uložit obrázek</a></div></div>}
      <p className="image-disclaimer">Generování vyžaduje platný serverový OPENAI_API_KEY, dostupný model a příslušné oprávnění účtu. Použití může být zpoplatněno.</p>
    </section>
  </main>;
}
