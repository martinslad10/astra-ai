import Link from "next/link";

export default function NotFound() {
  return (
    <main className="memory-page">
      <section className="memory-content">
        <div className="eyebrow">MSDAI · 404</div>
        <h1>Tahle stránka<br/><span>tu není.</span></h1>
        <p className="image-intro">Odkaz může být chybný nebo stránka ještě není dostupná.</p>
        <Link href="/" className="back-link">← Zpět do MSDAI</Link>
      </section>
    </main>
  );
}
