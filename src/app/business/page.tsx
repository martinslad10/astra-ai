'use client';

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, RefreshCw, BriefcaseBusiness, Wallet, ListChecks, ShieldCheck, Pause, Play, Check, X, CircleAlert } from "lucide-react";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

type Workspace = { id: string; name: string; business_type: string; description: string; status: string; monthly_budget: number; autonomy_level: string; created_at: string };
type Approval = { id: string; workspace_id: string; title: string; action_type: string; risk_level: string; requested_at: string; status: string; payload?: { draft?: string; company_name?: string } };
type Lead = { id: string; workspace_id: string; company_name: string; website: string | null; status: string; notes: string; created_at: string };
type BusinessTask = { id: string; workspace_id: string; title: string; description: string; category: string; status: string; priority: string };
type Artifact = { id: string; workspace_id: string; title: string; artifact_type: string; content: string; status: string; created_at: string };
type FinanceEntry = { id: string; workspace_id: string; entry_type: string; category: string; description: string; amount: number; currency: string; occurred_at: string };
const types: Record<string,string> = { agency:"Digitální agentura", digital_products:"Digitální produkty", ecommerce:"E-commerce", services:"Služby", other:"Jiný podnik" };

export default function BusinessPage() {
  const client = getSupabaseBrowserClient();
  const [workspaces,setWorkspaces] = useState<Workspace[]>([]);
  const [approvals,setApprovals] = useState<Approval[]>([]);
  const [leads,setLeads] = useState<Lead[]>([]);
  const [tasks,setTasks] = useState<BusinessTask[]>([]);
  const [artifacts,setArtifacts] = useState<Artifact[]>([]);
  const [finance,setFinance] = useState<FinanceEntry[]>([]);
  const [financeType,setFinanceType] = useState("income");
  const [financeDescription,setFinanceDescription] = useState("");
  const [financeAmount,setFinanceAmount] = useState("");
  const [financeCategory,setFinanceCategory] = useState("sales");
  const [financeDate,setFinanceDate] = useState(new Date().toISOString().slice(0,10));
  const [selectedWorkspace,setSelectedWorkspace] = useState("");
  const [artifactType,setArtifactType] = useState("website_copy");
  const [accessToken,setAccessToken] = useState("");
  const [agentBusy,setAgentBusy] = useState("");
  const [agentMessage,setAgentMessage] = useState("");
  const [region,setRegion] = useState("Česká republika");
  const [deliveryGoal,setDeliveryGoal] = useState("");
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
  const selectedFinance = finance.filter(item=>!selectedWorkspace || item.workspace_id===selectedWorkspace);
  const totalIncome = selectedFinance.filter(item=>item.entry_type==="income").reduce((sum,item)=>sum+Number(item.amount),0);
  const totalExpense = selectedFinance.filter(item=>item.entry_type==="expense").reduce((sum,item)=>sum+Number(item.amount),0);

  const load = useCallback(async () => {
    if (!client) { setLoading(false); return; }
    setLoading(true); setError("");
    const { data: session } = await client.auth.getSession();
    setEmail(session.session?.user.email ?? "");
    setAccessToken(session.session?.access_token ?? "");
    if (!session.session?.user) { setLoading(false); return; }
    const [w,a] = await Promise.all([
      client.from("business_workspaces").select("id,name,business_type,description,status,monthly_budget,autonomy_level,created_at").order("created_at",{ascending:false}),
      client.from("business_approvals").select("id,workspace_id,title,action_type,risk_level,requested_at,status,payload").eq("status","pending").order("requested_at",{ascending:false})
    ]);
    if (w.error) setError(w.error.message);
    else setWorkspaces((w.data ?? []) as Workspace[]);
    if (a.error) setError(a.error.message);
    else setApprovals((a.data ?? []) as Approval[]);
    const ids = (w.data ?? []).map(item => item.id);
    if (ids.length) {
      const [l,t] = await Promise.all([
        client.from("business_leads").select("id,workspace_id,company_name,website,status,notes,created_at").in("workspace_id",ids).order("created_at",{ascending:false}).limit(100),
        client.from("business_tasks").select("id,workspace_id,title,description,category,status,priority").in("workspace_id",ids).order("created_at",{ascending:false}).limit(100)
      ]);
      if (l.error) setError(l.error.message); else setLeads((l.data ?? []) as Lead[]);
      if (t.error) setError(t.error.message); else setTasks((t.data ?? []) as BusinessTask[]);
      const { data: a2, error: a2Error } = await client.from("business_artifacts").select("id,workspace_id,title,artifact_type,content,status,created_at").in("workspace_id",ids).order("created_at",{ascending:false}).limit(50);
      if (a2Error) setError(a2Error.message); else setArtifacts((a2 ?? []) as Artifact[]);
      const { data: fin, error: finError } = await client.from("business_financial_entries").select("id,workspace_id,entry_type,category,description,amount,currency,occurred_at").in("workspace_id",ids).order("occurred_at",{ascending:false}).limit(200);
      if (finError) setError(finError.message); else setFinance((fin ?? []) as FinanceEntry[]);
      if (!selectedWorkspace || !ids.includes(selectedWorkspace)) setSelectedWorkspace(ids[0]);
    } else { setLeads([]); setTasks([]); setArtifacts([]); setFinance([]); setSelectedWorkspace(""); }
    setLoading(false);
  },[client,selectedWorkspace]);

  useEffect(()=>{ const run = async () => { await Promise.resolve(); await load(); }; void run(); },[load]);

  async function addFinanceEntry(e: FormEvent) {
    e.preventDefault();
    if (!client || !selectedWorkspace || !financeDescription.trim() || !(Number(financeAmount)>0)) return;
    const { data: session } = await client.auth.getSession();
    const userId = session.session?.user.id;
    if (!userId) { setError("Přihlas se znovu ke svému účtu."); return; }
    const { error: insertError } = await client.from("business_financial_entries").insert({
      workspace_id:selectedWorkspace,user_id:userId,entry_type:financeType,category:financeCategory,
      description:financeDescription.trim(),amount:Number(financeAmount),currency:"CZK",occurred_at:financeDate
    });
    if (insertError) setError(insertError.message);
    else { setFinanceDescription(""); setFinanceAmount(""); setNotice("Finanční položka byla uložena."); await load(); }
  }

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

  async function runAgent(action:"research_leads"|"delivery_plan"|"draft_outreach"|"create_deliverable"|"update_task",workspaceId:string,leadId?:string,extra:Record<string,string>={}) {
    if (!accessToken) { setError("Přihlas se znovu ke svému účtu."); return; }
    setAgentBusy(action+workspaceId+(leadId||"")); setAgentMessage(""); setError("");
    try {
      const response = await fetch("/api/business/agent", {
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:"Bearer "+accessToken},
        body:JSON.stringify({action,workspaceId,leadId,region,count:5,goal:deliveryGoal,...extra})
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Akce se nepodařila.");
      setAgentMessage(result.message || result.summary || (action==="delivery_plan" ? "Vytvořeno úkolů: "+result.created : action==="create_deliverable" ? "Výstup byl vytvořen." : "Hotovo."));
      if (result.draft) setAgentMessage("Návrh uložen ke schválení:\\n\\n"+result.draft);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI agent narazil na chybu.");
    } finally { setAgentBusy(""); }
  }

  async function updateTask(task:BusinessTask,status:string) { await runAgent("update_task",task.workspace_id,undefined,{taskId:task.id,status}); }

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
      <div className="business-form"><label>Podnik<select value={selectedWorkspace} onChange={e=>setSelectedWorkspace(e.target.value)}>{workspaces.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label><label>Typ výstupu<select value={artifactType} onChange={e=>setArtifactType(e.target.value)}><option value="website_copy">Texty a struktura webu</option><option value="marketing_campaign">Marketingová kampaň</option><option value="sales_proposal">Obchodní nabídka</option><option value="business_plan">Podnikatelský plán</option><option value="analysis">Analýza trhu a konkurence</option><option value="document">Dokument</option><option value="other">Jiný výstup</option></select></label><label>Co má AI skutečně vytvořit?<textarea value={deliveryGoal} onChange={e=>setDeliveryGoal(e.target.value)} placeholder="Např. kompletní strukturu a texty webu včetně SEO a kontaktních výzev."/></label><div className="business-form-footer"><span>AI vytvoří pracovní materiál a uloží jej jako koncept. Bez tvého pokynu nic nezveřejní.</span><button type="button" disabled={!selectedWorkspace||!!agentBusy||!deliveryGoal.trim()} onClick={()=>void runAgent("create_deliverable",selectedWorkspace,undefined,{artifactType})}>{agentBusy.startsWith("create_deliverable")?"Vytvářím…":"Vytvořit výstup"}</button></div></div>
      {tasks.length===0 ? <div className="business-empty compact"><strong>Žádné pracovní úkoly.</strong><span>Zadej výše zakázku a nech AI připravit plán realizace.</span></div> : <div className="business-approval-list">{tasks.map(task=><div className="business-approval" key={task.id}><div><strong>{task.title}</strong><small>{task.category} · {task.priority} · {task.status}</small><small>{task.description}</small></div><div><select aria-label={"Stav úkolu "+task.title} value={task.status} disabled={!!agentBusy} onChange={e=>void updateTask(task,e.target.value)}><option value="todo">K vyřízení</option><option value="in_progress">Rozpracováno</option><option value="blocked">Blokováno</option><option value="done">Hotovo</option></select></div></div>)}</div>}
      <div className="business-section-title"><div><h2>Vytvořené výstupy</h2><p>Webové texty, kampaně, nabídky, analýzy a dokumenty uložené jako koncepty.</p></div><span>{artifacts.length} výstupů</span></div>
      {artifacts.length===0 ? <div className="business-empty compact"><strong>Zatím žádné vytvořené výstupy.</strong><span>Vytvoř výše první pracovní materiál.</span></div> : <div className="business-artifacts">{artifacts.map(a=><details className="business-artifact" key={a.id}><summary><strong>{a.title}</strong><span>{a.artifact_type} · {a.status} · {new Date(a.created_at).toLocaleDateString("cs-CZ")}</span></summary><pre>{a.content}</pre><button type="button" onClick={()=>void navigator.clipboard.writeText(a.content)}>Zkopírovat obsah</button></details>)}</div>}
      <div className="business-section-title"><div><h2>Finance podniku</h2><p>Evidence příjmů a výdajů, cash flow a kontrola limitu. Částky zadáváš ručně.</p></div><span>{selectedFinance.length} položek</span></div>
      <form className="business-form" onSubmit={addFinanceEntry}>
        <label>Podnik<select value={selectedWorkspace} onChange={e=>setSelectedWorkspace(e.target.value)}>{workspaces.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
        <div className="business-form-grid"><label>Typ položky<select value={financeType} onChange={e=>setFinanceType(e.target.value)}><option value="income">Příjem</option><option value="expense">Výdaj</option></select></label><label>Kategorie<select value={financeCategory} onChange={e=>setFinanceCategory(e.target.value)}><option value="sales">Prodej</option><option value="services">Služby</option><option value="software">Software</option><option value="advertising">Reklama</option><option value="materials">Materiál</option><option value="fees">Poplatky</option><option value="taxes">Daně</option><option value="other">Ostatní</option></select></label></div>
        <div className="business-form-grid"><label>Popis<input value={financeDescription} onChange={e=>setFinanceDescription(e.target.value)} placeholder="Např. tvorba webu pro klienta" required maxLength={240}/></label><label>Částka (Kč)<input type="number" min="0.01" step="0.01" value={financeAmount} onChange={e=>setFinanceAmount(e.target.value)} required/></label></div>
        <label>Datum<input type="date" value={financeDate} onChange={e=>setFinanceDate(e.target.value)} required/></label>
        <div className="business-form-footer"><span>Nejde o bankovní propojení ani daňovou evidenci.</span><button type="submit" disabled={!selectedWorkspace||!(Number(financeAmount)>0)||!financeDescription.trim()}>Přidat položku</button></div>
      </form>
      <div className="business-stats"><div><Wallet/><span>Celkové příjmy</span><strong>{totalIncome.toLocaleString("cs-CZ")} Kč</strong></div><div><Wallet/><span>Celkové výdaje</span><strong>{totalExpense.toLocaleString("cs-CZ")} Kč</strong></div><div><ListChecks/><span>Rozdíl</span><strong>{(totalIncome-totalExpense).toLocaleString("cs-CZ")} Kč</strong></div></div>
      {selectedFinance.length===0 ? <div className="business-empty compact"><strong>Zatím žádné finanční položky.</strong><span>Zapiš první příjem nebo výdaj.</span></div> : <div className="business-approval-list">{selectedFinance.map(item=><div className="business-approval" key={item.id}><div><strong>{item.description}</strong><small>{item.entry_type==="income"?"Příjem":"Výdaj"} · {item.category} · {new Date(item.occurred_at).toLocaleDateString("cs-CZ")}</small></div><strong>{item.entry_type==="income"?"+":"−"}{Number(item.amount).toLocaleString("cs-CZ")} Kč</strong></div>)}</div>}
      <p className="business-footnote">Přehled počítá pouze ručně zadané položky. Bankovní transakce, automatické párování plateb, daňové výpočty a fakturace zatím nejsou připojené.</p>
      <div className="business-section-title approval-heading"><div><h2>Bezpečnostní schvalování</h2><p>Rizikové kroky musí projít tvým rozhodnutím.</p></div></div>
      {approvals.length===0 ? <div className="business-empty compact"><ShieldCheck size={23}/><strong>Žádné čekající požadavky.</strong><span>Jakmile AI připraví akci vyžadující souhlas, zobrazí se zde.</span></div> : <div className="business-approval-list">{approvals.map(a=><div className="business-approval" key={a.id}><div><span>{a.action_type.replaceAll("_"," ")} · riziko {a.risk_level}</span><strong>{a.title}</strong><small>{new Date(a.requested_at).toLocaleString("cs-CZ")}</small>{a.payload?.draft && <p style={{whiteSpace:"pre-wrap"}}>{a.payload.draft}</p>}</div><div><button onClick={()=>void decide(a.id,"approved")}><Check size={14}/> Schválit</button><button onClick={()=>void decide(a.id,"rejected")}><X size={14}/> Zamítnout</button></div></div>)}</div>}

      <div className="business-roadmap"><h2>Další rozvoj modulu</h2><div><span>01</span><p><strong>AI průzkum trhu a hledání příležitostí</strong><small>Legální zdroje, vyhodnocení poptávky a konkurence.</small></p><span className="roadmap-state">Další etapa</span></div><div><span>02</span><p><strong>CRM a obchodní pipeline</strong><small>Evidence leadů, kvalifikace, návrhy oslovení a follow-up.</small></p><span className="roadmap-state">Plánováno</span></div><div><span>03</span><p><strong>Výroba a dodání zakázek</strong><small>AI specialisté, kontrola kvality a předání klientovi.</small></p><span className="roadmap-state">Plánováno</span></div><div><span>04</span><p><strong>Finance a automatizace</strong><small>Fakturace, platby, rozpočty a auditní stopa.</small></p><span className="roadmap-state">Plánováno</span></div></div>
      <p className="business-footnote">AI umí vyhledávat firemní leady, připravovat oslovení, plánovat úkoly a vytvářet konkrétní pracovní výstupy uložené jako koncepty. Publikování, rozesílání, placené kampaně, fakturace a externí smluvní kroky vyžadují navazující integrace a samostatné schválení.</p>
    </section>
  </main>;
}
