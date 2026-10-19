'use client';

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error("Astra AI root error:", error);
  }, [error]);

  return (
    <html lang="cs">
      <body style={{ margin: 0, minHeight: "100vh", background: "#080a0f", color: "#f3f5fb", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 680, margin: "0 auto", padding: "15vh 24px 48px" }}>
          <p style={{ color: "#aaa3ff", letterSpacing: 2, fontSize: 12 }}>ASTRA AI · CHYBA</p>
          <h1 style={{ fontSize: "clamp(32px, 7vw, 52px)", lineHeight: 1.1 }}>Aplikace se nepodařila načíst.</h1>
          <p style={{ color: "#aab1c2", lineHeight: 1.7 }}>Zkus stránku obnovit. Pokud problém přetrvá, vrať se později.</p>
          <button onClick={() => reset()} style={{ border: 0, borderRadius: 8, padding: "12px 16px", background: "#a9a1ff", color: "#11121b", fontWeight: 700, cursor: "pointer" }}>Zkusit znovu</button>
          {error.digest ? <p style={{ color: "#7e879a", fontSize: 12 }}>Kód chyby: {error.digest}</p> : null}
        </main>
      </body>
    </html>
  );
}
