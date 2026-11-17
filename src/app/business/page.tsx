'use client';

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw, BriefcaseBusiness, Wallet, ListChecks, ShieldCheck, Pause, Play, Check, X, CircleAlert } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

type Workspace = { id: string; name: string; business_type: string; description: string; status: string; monthly_budget: number; autonomy_level: string; created_at: string };
type Approval = { id: string; workspace_id: string; title: string; action_type: string; risk_level: string; requested_at: string; status: string; payload?: { draft?: string; company_name?: string } };
type Lead = { id: string; workspace_id: string; company_name: string; website: string | null; status: string; notes: string; created_at: string };
type BusinessTask = { id: string; workspace_id: string; title: string; description: string; category: string; status: string; priority: string };
const types: Record<string,string> = { agency:"Digitální agentura", digital_products:"Digitální produkty", ecommerce:"E-commerce", services:"Služby", other:"Jiný podnik" };

export default function BusinessPage() {
  const client = getSupabaseBrowserClient();
  const [workspaces,setWorkspaces] = useState<Workspace[]>([]);
  const [approvals,setApprovals] = useState<Approval[]>([]);\n  const [leads,setLeads] = useState<Lead[]>([]);\n  const [tasks,setTasks] = useState<BusinessTask[]>([]);\n  const [accessToken,setAccessToken] = useState("");\n  const [agentBusy,setAgentBusy] = useState("");\n  const [agentMessage,setAgentMessage] = useState("");\n  const [region,setRegion] = useState("Česká republika");\n  const [deliveryGoal,setDeliveryGoal] = useState("");
  const [loading,setLoading] = useState(true);
  const [email,setEmail] = useState("");
  const [showForm,setShowForm] = useState(false);
  const [name,setName] = useState("");
  const [kind,setKind] = useState("agency");
  const [description,setDescription] = useState("");
  const [budget,setBudget] = useState("0");
  const [notice,setNotice] = useState("");
  const [error,setError] = useState("");
  const [saving,setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!client) { setLoading(false); return; }
    setLoading(true); setError("");
    const { data: session } = await client.auth.getSession();
    setEmail(session.session?.user.email ?? "");
    if (!session.session?.user) { setLoading(false); return; }
    const [w,a] = await Promise.all([
      client.from("business_workspaces").select("id,name,business_type,description,status,monthly_budget,autonomy_level,created_at").order("created_at",{ascending:false}),
      client.from("business_approvals").select("id,workspace_id,title,action_type,risk_level,requested_at,status").eq("status","pending").order("requested_at",{ascending:false})
    ]);
    if (w.error) setError(w.error.message);
    else setWorkspaces((w.data ?? []) as Workspace[]);
    if (a.error) setError(a.error.message);
    else setApprovals((a.data ?? []) as Approval[]);
    setLoading(false);
  },[client]);

  useEffect(()=>{ void load(); },[load]);

  async function createWorkspace(e: FormEvent) {
    e.preventDefault();
    if (!client || !name.trim()) return;
    setSaving(true); setError(""); setNotice("");
    const { data: session } = await client.auth.getSession();
    const user = session.session?.user;
    if (!user) { setError("Nejprve se přihlas ke svému účtu."); setSaving(false); return; }
    const { error: insertError } = await client.from("business_workspaces").insert({
      user_id:user.id,name:name.trim(),business_type:kind,description:description.trim(),
      monthly_budget:Math.max(0,Number(budget)||0),status:"planning",autonomy_level:"approval"
    });
    if (insertError) setError(insertError.message);
    else { setName(""); setDescription(""); setBudget("0"); setShowForm(false); setNotice("Podnik byl vytvořen. Zatím je v režimu plánování a nic neutratí ani neosloví klienty."); await load(); }
    setSaving(false);
  }

  async function setWorkspaceStatus(id:string,status:string) {
    if (!client) return;
    const {error: updateError}=await client.from("business_workspaces").update({status,updated_at:new Date().toISOString()}).eq("id",id);
    if(updateError) setError(updateError.message); else await load();
  }

  async function runAgent(action:"research_leads"|"delivery_plan"|"draft_outreach",workspaceId:string,leadId?:string) {
    if (!accessToken) { setError("Přihlas se znovu ke svému účtu."); return; }
    setAgentBusy(action+workspaceId+(leadId||"")); setAgentMessage(""); setError("");
    try {
      const response = await fetch("/api/business/agent", {
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:"Bearer "+accessToken},
        body:JSON.stringify({action,workspaceId,leadId,region,count:5,goal:deliveryGoal})
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Akce se nepodařila.");
      setAgentMessage(result.message || result.summary || (action==="delivery_plan" ? "Vytvořeno úkolů: "+result.created : "Hotovo."));
      if (result.draft) setAgentMessage("Návrh uložen ke schválení:\\n\\n"+result.draft);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI agent narazil na chybu.");
    } finally { setAgentBusy(""); }
  }

  async function decide(id:string,status:"approved"|"rejected") {
    if(!client) return;
    const {data:session}=await client.auth.getSession();
    const {error:updateError}=await client.from("business_approvals").update({status,decided_at:new Date().toISOString()}).eq("id",id).eq("user_id",session.session?.user.id);
    if(updateError) setError(updateError.message); else {setNotice(status==="approved"?"Schválení zaznamenáno. Samotná akce se zatím automaticky neprovede.":"Požadavek byl zamítnut.");await load();}
  }

  return <main className="business-page">
    <header className="business-header"><Link href="/" className="business-back"><ArrowLeft size={16}/> Zpět do chatu</Link><div className="business-brand"><BriefcaseBusiness size={19}/> <strong>ChatSLADAI <span>Podnikání</span></strong></div><button className="business-refresh" onClick={()=>void load()}><RefreshCw size={14}/> Obnovit</button></header>
    <section className="business-content">
      <div className="business-hero"><div className="business-eyebrow">FUNKCE CHATSLADAI</div><h1>Správa podnikání<br/><span>na jednom místě.</span></h1><p>Rozšiř ChatSLADAI o podnikatelské projekty. Pro každý projekt může AI připravovat průzkum, obchodní příležitosti, práci a provozní úkoly. Ty si zachováváš kontrolu nad důležitými kroky.</p><div className="business-actions"><button onClick={()=>setShowForm(v=>!v)}><Plus size={16}/> Přidat podnik</button><span><ShieldCheck size={14}/> Bezpečnostní režim: schválení před akcí</span></div></div>

      {!client && <div className="business-alert"><CircleAlert size={18}/> Cloudový účet není nakonfigurovaný. Nejprve nastav Supabase a přihlášení.</div>}
      {client && !loading && !email && <div className="business-alert"><CircleAlert size={18}/> Pro správu podniků se nejprve <Link href="/account">přihlas ke svému účtu</Link>.</div>}
      {notice && <div className="business-notice">{notice}</div>}
      {error && <div className="business-alert"><CircleAlert size={18}/>{error}</div>}

      {showForm && <form className="business-form" onSubmit={createWorkspace}><div className="business-form-heading"><strong>Nový podnik</strong><button type="button" onClick={()=>setShowForm(false)} aria-label="Zavřít"><X size={16}/></button></div><label>Název podniku<input value={name} onChange={e=>setName(e.target.value)} placeholder="Např. Digitální agentura" required minLength={2} maxLength={120}/></label><div className="business-form-grid"><label>Typ podnikání<select value={kind} onChange={e=>setKind(e.target.value)}>{Object.entries(types).map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label><label>Měsíční rozpočet (Kč)<input type="number" min="0" step="100" value={budget} onChange={e=>setBudget(e.target.value)}/></label></div><label>Co bude podnik nabízet?<textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Popiš produkty, služby a cílové zákazníky…" maxLength={2000}/></label><div className="business-form-footer"><span>Nový podnik se vytvoří jako plánovací. AI zatím nic neodesílá ani neutrácí.</span><button type="submit" disabled={saving||name.trim().length<2}>{saving?"Ukládám…":"Vytvořit podnik"}</button></div></form>}

      <div className="business-stats"><div><BriefcaseBusiness/><span>Podniky</span><strong>{workspaces.length}</strong></div><div><Wallet/><span>Souhrnný měsíční limit</span><strong>{workspaces.reduce((n,w)=>n+Number(w.monthly_budget||0),0).toLocaleString("cs-CZ")} Kč</strong></div><div><ListChecks/><span>Čeká na schválení</span><strong>{approvals.length}</strong></div></div>

      <div className="business-section-title"><div><h2>Tvoje podniky</h2><p>Každý podnik má oddělený provoz a vlastní rozpočet.</p></div><span>{workspaces.length} celkem</span></div>
      {loading ? <div className="business-empty">Načítám podnikatelské portfolio…</div> : workspaces.length===0 ? <div className="business-empty"><BriefcaseBusiness size={28}/><strong>Zatím tu nemáš žádný podnik.</strong><span>Vytvoř první podnik a postupně mu přidáme AI tým, obchodní pipeline a automatizace.</span><button onClick={()=>setShowForm(true)}><Plus size={15}/> Vytvořit první podnik</button></div> :
        <div className="business-grid">{workspaces.map(w=><article className="business-card" key={w.id}><div className="business-card-top"><span className="business-type">{types[w.business_type]??w.business_type}</span><span className={"business-status "+w.status}>{w.status==="active"?"Aktivní":w.status==="paused"?"Pozastavený":w.status==="archived"?"Archivovaný":"Plánování"}</span></div><h3>{w.name}</h3><p>{w.description||"Popis podniku zatím nebyl doplněn."}</p><div className="business-card-meta"><span><Wallet size={14}/> Limit {Number(w.monthly_budget).toLocaleString("cs-CZ")} Kč / měsíc</span><span><ShieldCheck size={14}/> {w.autonomy_level==="approval"?"Schválení před akcí":"Autonomie s limity"}</span></div><div className="business-card-footer">{w.status==="active"?<button onClick={()=>void setWorkspaceStatus(w.id,"paused")}><Pause size={14}/> Pozastavit</button>:<button onClick={()=>void setWorkspaceStatus(w.id,"active")}><Play size={14}/> Aktivovat provoz</button>}<button disabled={!!agentBusy || w.status==="paused"} onClick={()=>void runAgent("research_leads",w.id)}>{agentBusy==="research_leads"+w.id?"Hledám…":"Najít klienty"}</button><span>Vytvořeno {new Date(w.created_at).toLocaleDateString("cs-CZ")}</span></div></article>)}</div>}

      {agentMessage && <div className="business-notice" style={{whiteSpace:"pre-wrap"}}>{agentMessage}</div>}
      <div className="business-section-title"><div><h2>Obchodní CRM</h2><p>AI vyhledává firmy z veřejných zdrojů. Výsledky kontroluj před oslovením.</p></div><span>{leads.length} potenciálních klientů</span></div>
      <div className="business-form">
        <label>Oblast hledání klientů<input value={region} onChange={e=>setRegion(e.target.value)} placeholder="Např. České Budějovice a okolí"/></label>
        <label>Zakázka nebo cíl k rozpracování<input value={deliveryGoal} onChange={e=>setDeliveryGoal(e.target.value)} placeholder="Např. vytvořit web a marketingovou kampaň pro salon"/></label>
        <div className="business-form-footer"><span>AI připraví úkoly a návrhy. Zprávy se bez tvého souhlasu neposílají.</span><button type="button" disabled={!workspaces.length||!!agentBusy||!deliveryGoal.trim()} onClick={()=>void runAgent("delivery_plan",workspaces[0].id)}>{agentBusy.startsWith("delivery_plan")?"Plánuji…":"Vytvořit plán práce"}</button></div>
      </div>
      {leads.length===0 ? <div className="business-empty compact"><strong>Zatím žádní potenciální klienti.</strong><span>U podniku klikni na „Najít klienty“ a AI prohledá veřejné firemní zdroje.</span></div> : <div className="business-approval-list">{leads.map(lead=><article className="business-approval" key={lead.id}><div><strong>{lead.company_name}</strong><small>{lead.website || "Web nebyl ověřen"} · {lead.status}</small><small>{lead.notes}</small></div><div><button disabled={!!agentBusy} onClick={()=>void runAgent("draft_outreach",lead.workspace_id,lead.id)}>{agentBusy.includes(lead.id)?"Připravuji…":"Připravit oslovení"}</button></div></article>)}</div>}
      <div className="business-section-title"><div><h2>Pracovní úkoly</h2><p>AI může připravit konkrétní kroky a kritéria dokončení.</p></div><span>{tasks.filter(t=>t.status!=="done").length} otevřených</span></div>
      {tasks.length===0 ? <div className="business-empty compact"><strong>Žádné pracovní úkoly.</strong><span>Zadej výše zakázku a nech AI připravit plán realizace.</span></div> : <div className="business-approval-list">{tasks.map(task=><div className="business-approval" key={task.id}><div><strong>{task.title}</strong><small>{task.category} · {task.priority} · {task.status}</small><small>{task.description}</small></div></div>)}</div>}
      <div className="business-section-title approval-heading"><div><h2>Bezpečnostní schvalování</h2><p>Rizikové kroky musí projít tvým rozhodnutím.</p></div></div>
      {approvals.length===0 ? <div className="business-empty compact"><ShieldCheck size={23}/><strong>Žádné čekající požadavky.</strong><span>Jakmile AI připraví akci vyžadující souhlas, zobrazí se zde.</span></div> : <div className="business-approval-list">{approvals.map(a=><div className="business-approval" key={a.id}><div><span>{a.action_type.replaceAll("_"," ")} · riziko {a.risk_level}</span><strong>{a.title}</strong><small>{new Date(a.requested_at).toLocaleString("cs-CZ")}</small></div><div><button onClick={()=>void decide(a.id,"approved")}><Check size={14}/> Schválit</button><button onClick={()=>void decide(a.id,"rejected")}><X size={14}/> Zamítnout</button></div></div>)}</div>}

      <div className="business-roadmap"><h2>Co se bude přidávat dál</h2><div><span>01</span><p><strong>AI průzkum trhu a hledání příležitostí</strong><small>Legální zdroje, vyhodnocení poptávky a konkurence.</small></p><span className="roadmap-state">Další etapa</span></div><div><span>02</span><p><strong>CRM a obchodní pipeline</strong><small>Evidence leadů, kvalifikace, návrhy oslovení a follow-up.</small></p><span className="roadmap-state">Plánováno</span></div><div><span>03</span><p><strong>Výroba a dodání zakázek</strong><small>AI specialisté, kontrola kvality a předání klientovi.</small></p><span className="roadmap-state">Plánováno</span></div><div><span>04</span><p><strong>Finance a automatizace</strong><small>Fakturace, platby, rozpočty a auditní stopa.</small></p><span className="roadmap-state">Plánováno</span></div></div>
      <p className="business-footnote">AI nyní umí vyhledat veřejně dohledatelné firmy, uložit ověřené kandidáty do CRM, navrhnout obchodní oslovení ke schválení a rozdělit zakázku na úkoly. Zprávy neposílá, smlouvy nepodepisuje, peníze neutratí a digitální zakázky zatím sama nevykonává bez dalšího propojení nástrojů a schvalování.</p>
    </section>
  </main>;
}
