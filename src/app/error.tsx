'use client';

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Avoid logging exception details to the browser console in public sessions.
    if (process.env.NODE_ENV === "development") console.error("MARTIVEXA page error:", error);
  }, [error]);

  return (
    <main className="memory-page">
      <section className="memory-content">
        <div className="eyebrow">MARTIVEXA · CHYBA</div>
        <h1>Něco se<br/><span>nepovedlo.</span></h1>
        <p className="image-intro">Stránku se nepodařilo načíst. Můžeš to zkusit znovu nebo se vrátit do pracovního prostoru.</p>
        <div className="memory-cloud-actions">
          <button type="button" onClick={() => reset()}>Zkusit znovu</button>
          <Link href="/" className="back-link">Zpět do MARTIVEXA</Link>
        </div>
        {error.digest ? <p className="image-disclaimer">Kód chyby: {error.digest}</p> : null}
      </section>
    </main>
  );
}
