import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { rateLimit } from "../../../../lib/rate-limit";

export const runtime = "nodejs";

type Action = "research_leads" | "delivery_plan" | "draft_outreach";

function parseJson(text: string): any {
  const cleaned = text.trim().replace(/^\`\`\`(?:json)?\s*/i, "").replace(/\s*\`\`\`$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("AI nevrátila platný strukturovaný výstup.");
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function POST(request: Request) {
  const limit = await rateLimit(request, "business-agent", 5);
  if (!limit.allowed) return NextResponse.json({ error: "Příliš mnoho požadavků. Zkus to znovu za chvíli." }, { status: 429 });

  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
    if (!token) return NextResponse.json({ error: "Přihlas se znovu. Chybí přístupový token." }, { status: 401 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const apiKey = process.env.OPENAI_API_KEY;
    if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: "Chybí konfigurace Supabase." }, { status: 503 });
    if (!apiKey) return NextResponse.json({ error: "Chybí OPENAI_API_KEY na serveru." }, { status: 503 });

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: "Bearer " + token } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return NextResponse.json({ error: "Přihlášení vypršelo. Přihlas se znovu." }, { status: 401 });
    const user = authData.user;

    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > 20000) return NextResponse.json({ error: "Požadavek je příliš dlouhý." }, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Neplatný JSON." }, { status: 400 }); }
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Neplatný požadavek." }, { status: 400 });
    const input = body as Record<string, unknown>;
    const action = input.action as Action;
    const workspaceId = typeof input.workspaceId === "string" ? input.workspaceId : "";
    if (!workspaceId || !["research_leads", "delivery_plan", "draft_outreach"].includes(action)) {
      return NextResponse.json({ error: "Chybí platná akce nebo podnik." }, { status: 400 });
    }

    const { data: workspace, error: workspaceError } = await supabase
      .from("business_workspaces")
      .select("id,name,business_type,description,status,monthly_budget")
      .eq("id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (workspaceError) throw workspaceError;
    if (!workspace) return NextResponse.json({ error: "Podnik nebyl nalezen nebo k němu nemáš přístup." }, { status: 404 });
    if (workspace.status === "paused" || workspace.status === "archived") {
      return NextResponse.json({ error: "Tento podnik je pozastavený nebo archivovaný." }, { status: 409 });
    }

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

    if (action === "research_leads") {
      const region = typeof input.region === "string" ? input.region.slice(0, 120) : "Česká republika";
      const count = Math.max(3, Math.min(8, Number(input.count) || 5));
      const response = await openai.responses.create({
        model,
        instructions: "Jsi B2B výzkumník ChatSLADAI. Pracuj pouze s veřejně dostupnými firemními informacemi. Nevymýšlej firmy, weby, kontaktní osoby, e-maily ani zdroje. U každé firmy uveď ověřitelnou URL zdroje a konkrétní důvod shody. Pokud nelze údaje ověřit, vynech je. Nezískávej soukromé osobní kontakty a neposílej žádné zprávy. Vrať pouze validní JSON bez markdownu.",
        input: `Najdi až ${count} reálných potenciálních firemních klientů pro tento podnik.
Podnik: ${workspace.name}
Typ: ${workspace.business_type}
Nabídka a kontext: ${workspace.description}
Oblast: ${region}

Vybírej firmy, které mohou skutečně potřebovat tuto nabídku. Hledej veřejné firemní weby a stránky služeb/kontaktů. Výstupní JSON přesně:
{"summary":"stručné shrnutí výzkumu","leads":[{"company_name":"název firmy","website":"https://... nebo prázdné","source_url":"konkrétní veřejný zdroj","evidence":"co zdroj potvrzuje","fit_reason":"proč je firma vhodný potenciální klient"}]}
Neuváděj e-mail ani jméno člověka, pokud nejsou výslovně a jednoznačně zveřejněny v oficiálním firemním zdroji. Preferuj firemní kontaktní stránku. Pokud nemáš dost ověřených výsledků, vrať méně položek. Žádné domýšlení.`,
        tools: [{ type: "web_search_preview" }],
        max_output_tokens: 3000,
      });
      const parsed = parseJson(response.output_text || "");
      const candidates = Array.isArray(parsed.leads) ? parsed.leads.slice(0, count) : [];
      const valid = candidates.filter((lead: any) =>
        lead && typeof lead.company_name === "string" && lead.company_name.trim() &&
        typeof lead.source_url === "string" && /^https:\/\//i.test(lead.source_url)
      );
      let saved = 0;
      for (const lead of valid) {
        const website = typeof lead.website === "string" && /^https?:\/\//i.test(lead.website) ? lead.website : null;
        const { data: existing } = await supabase.from("business_leads").select("id")
          .eq("workspace_id", workspaceId).eq("user_id", user.id)
          .eq("company_name", lead.company_name.trim()).limit(1);
        if (existing?.length) continue;
        const notes = [
          "Důvod shody: " + String(lead.fit_reason || "Neurčeno").slice(0, 1000),
          "Ověřené podklady: " + String(lead.evidence || "Neurčeno").slice(0, 1500),
          "Zdroj: " + lead.source_url,
        ].join("\n");
        const { error } = await supabase.from("business_leads").insert({
          workspace_id: workspaceId, user_id: user.id,
          company_name: lead.company_name.trim().slice(0, 200),
          website, source: String(lead.source_url).slice(0, 500),
          status: "new", notes,
        });
        if (!error) saved++;
      }
      return NextResponse.json({ ok: true, action, summary: String(parsed.summary || "Výzkum dokončen."), found: valid.length, saved, message: valid.length ? "Potenciální klienti byli uloženi do CRM. Žádný nebyl automaticky osloven." : "Nepodařilo se najít dostatečně ověřené výsledky; databáze nebyla doplněna neověřenými kontakty." });
    }

    if (action === "delivery_plan") {
      const goal = typeof input.goal === "string" ? input.goal.slice(0, 3000) : "";
      if (!goal.trim()) return NextResponse.json({ error: "Popiš zakázku nebo cíl, který má podnik dodat." }, { status: 400 });
      const response = await openai.responses.create({
        model,
        instructions: "Jsi projektový vedoucí digitální agentury. Rozděl práci na konkrétní ověřitelné úkoly. Nevydávej plán za hotovou práci. Vrať pouze validní JSON bez markdownu.",
        input: `Podnik: ${workspace.name}\nNabídka: ${workspace.description}\nZakázka/cíl: ${goal}\n\nVrať JSON {"summary":"stručný plán","tasks":[{"title":"konkrétní úkol","description":"výstup a kritérium dokončení","category":"research|sales|delivery|marketing|finance|operations","priority":"low|normal|high|urgent"}]}. Vytvoř 3 až 10 úkolů v logickém pořadí.`,
        max_output_tokens: 2200,
      });
      const parsed = parseJson(response.output_text || "");
      const tasks = Array.isArray(parsed.tasks) ? parsed.tasks.slice(0, 10) : [];
      const rows = tasks.filter((task: any) => task && typeof task.title === "string" && task.title.trim()).map((task: any) => ({
        workspace_id: workspaceId, user_id: user.id,
        title: task.title.slice(0, 240),
        description: String(task.description || "").slice(0, 3000),
        category: ["research","sales","delivery","marketing","finance","operations"].includes(task.category) ? task.category : "operations",
        priority: ["low","normal","high","urgent"].includes(task.priority) ? task.priority : "normal",
        status: "todo", created_by: "ai",
      }));
      if (rows.length) {
        const { error } = await supabase.from("business_tasks").insert(rows);
        if (error) throw error;
      }
      return NextResponse.json({ ok: true, action, created: rows.length, summary: String(parsed.summary || "Plán úkolů byl vytvořen.") });
    }

    const leadId = typeof input.leadId === "string" ? input.leadId : "";
    if (!leadId) return NextResponse.json({ error: "Chybí klient pro návrh oslovení." }, { status: 400 });
    const { data: lead, error: leadError } = await supabase.from("business_leads")
      .select("id,company_name,website,notes,status").eq("id", leadId)
      .eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
    if (leadError) throw leadError;
    if (!lead) return NextResponse.json({ error: "Klient nebyl nalezen." }, { status: 404 });
    if (lead.status === "do_not_contact") return NextResponse.json({ error: "Tento kontakt je označen jako nekontaktovat." }, { status: 409 });

    const response = await openai.responses.create({
      model,
      instructions: "Jsi zkušený B2B obchodník. Vytvoř zdvořilý, stručný a transparentní první návrh obchodní zprávy v češtině. Nevymýšlej, že znáš osobu, její potřeby nebo předchozí komunikaci. Neodesílej zprávu. Vrať pouze text návrhu.",
      input: `Podnik: ${workspace.name}\nNabídka: ${workspace.description}\nPotenciální klient: ${lead.company_name}\nWeb: ${lead.website || "není ověřen"}\nVeřejné podklady: ${lead.notes}\n\nPřiprav personalizovaný, ale věcný návrh prvního oslovení. Uveď předmět a text, bez falešných tvrzení.`,
      max_output_tokens: 1200,
    });
    const draft = response.output_text || "";
    if (!draft.trim()) throw new Error("AI nevytvořila návrh oslovení.");
    const { data: approval, error: approvalError } = await supabase.from("business_approvals").insert({
      workspace_id: workspaceId, user_id: user.id,
      action_type: "send_message", title: "Návrh oslovení: " + lead.company_name,
      risk_level: "medium", status: "pending",
      payload: { lead_id: lead.id, company_name: lead.company_name, draft, delivery: "manual_review_required" },
    }).select("id").single();
    if (approvalError) throw approvalError;
    return NextResponse.json({ ok: true, action, approvalId: approval.id, draft, message: "Návrh je uložen ke kontrole. Nic nebylo odesláno." });
  } catch (error) {
    console.error("ChatSLADAI business agent error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Podnikatelský agent narazil na chybu." }, { status: 500 });
  }
}
