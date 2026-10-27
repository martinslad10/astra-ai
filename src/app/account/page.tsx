'use client';

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Cloud, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

export default function AccountPage() {
  const [email, setEmail] = useState("");
  const [sessionEmail, setSessionEmail] = useState("");
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    setConfigured(Boolean(client));
    if (!client) return;
    void client.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) setError(sessionError.message);
      setSessionEmail(data.session?.user.email ?? "");
    });
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? "");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function signIn(event: FormEvent) {
    event.preventDefault();
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError("Cloud účet není nakonfigurovaný. Na Vercelu nastav NEXT_PUBLIC_SUPABASE_URL a NEXT_PUBLIC_SUPABASE_ANON_KEY.");
      return;
    }
    if (!email.trim()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const redirectTo = new URL("/account", window.location.origin).toString();
      const { error: authError } = await client.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (authError) throw authError;
      setNotice("Odeslali jsme přihlašovací odkaz na e-mail. Otevři ho na tomto zařízení a vrať se do MARTINAI.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Přihlášení se nepodařilo.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { error: signOutError } = await client.auth.signOut();
    if (signOutError) setError(signOutError.message);
    else { setSessionEmail(""); setNotice("Odhlášení proběhlo."); }
  }

  return <main className="memory-page">
    <header className="image-header">
      <Link href="/" className="back-link"><ArrowLeft size={17}/> Zpět do MARTINAI</Link>
      <div className="brand-mark"><UserRound size={19}/></div>
      <strong>MARTINAI <span>/ Účet</span></strong>
    </header>
    <section className="memory-content">
      <div className="eyebrow"><ShieldCheck size={14}/> ÚČET A SYNCHRONIZACE</div>
      <h1>Tvůj prostor,<br/><span>tvoje data.</span></h1>
      <p className="image-intro">Přihlášení e-mailovým odkazem připravuje základ pro bezpečné oddělení dat jednotlivých uživatelů a cloudovou synchronizaci mezi zařízeními.</p>
      {!configured ? <div className="image-error" role="status">Cloudové přihlášení zatím není nakonfigurované. Je potřeba vytvořit Supabase projekt, spustit migraci z repozitáře a přidat veřejnou URL a anon key do proměnných prostředí Vercelu. Tajný service-role klíč do prohlížeče nikdy nevkládej.</div> :
        sessionEmail ? <div className="memory-empty">
          <Cloud size={26}/><strong>Jsi přihlášený</strong><span>{sessionEmail}</span>
          <button type="button" onClick={() => void signOut()}><LogOut size={16}/> Odhlásit se</button>
        </div> :
        <form className="memory-form" onSubmit={signIn}>
          <label htmlFor="account-email">E-mail</label>
          <input id="account-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ty@priklad.cz" maxLength={254} required />
          <div className="memory-form-footer"><span>Pošleme ti bezpečný přihlašovací odkaz.</span><button type="submit" disabled={!email.trim() || busy}><Mail size={16}/>{busy ? " Odesílám…" : " Poslat přihlašovací odkaz"}</button></div>
        </form>}
      {notice && <p role="status" className="image-placeholder">{notice}</p>}
      {error && <p role="alert" className="image-error">{error}</p>}
      <p className="image-disclaimer">Přihlášení samo o sobě ještě nesynchronizuje staré lokální poznámky ani historii. Cloudové tabulky chrání pravidla RLS; před zpřístupněním synchronizace je nutné mít nasazenou databázovou migraci.</p>
    </section>
  </main>;
}
