import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getGoogleAccessToken } from "../../../../../../lib/google-integration-server";

export const runtime = "nodejs";

async function getUser(request: Request) {
  const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) return null;
  const client = createClient(url, key, { global: { headers: { Authorization: "Bearer " + token } }, auth: { persistSession: false } });
  const { data } = await client.auth.getUser(token);
  return data.user || null;
}

export async function GET(request: Request) {
  const user = await getUser(request);
  if (!user) return NextResponse.json({ error: "Přihlas se ke svému účtu ChatSLADAI." }, { status: 401 });
  const kind = new URL(request.url).searchParams.get("type");
  if (kind !== "emails" && kind !== "calendar") {
    return NextResponse.json({ error: "Parametr type musí být emails nebo calendar." }, { status: 400 });
  }
  try {
    const { token } = await getGoogleAccessToken(user.id);
    if (kind === "emails") {
      const listResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10", {
        headers: { Authorization: "Bearer " + token }, cache: "no-store",
      });
      const list = await listResponse.json() as { messages?: { id: string; threadId: string }[]; error?: { message?: string } };
      if (!listResponse.ok) throw new Error(list.error?.message || "Gmail zprávy se nepodařilo načíst.");
      const messages = await Promise.all((list.messages || []).slice(0, 10).map(async item => {
        const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/" + encodeURIComponent(item.id) + "?format=metadata&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date", {
          headers: { Authorization: "Bearer " + token }, cache: "no-store",
        });
        const message = await response.json() as { id: string; snippet?: string; internalDate?: string; payload?: { headers?: { name: string; value: string }[] } };
        if (!response.ok) return null;
        const headers = message.payload?.headers || [];
        const header = (name: string) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || "";
        return { id: message.id, from: header("From"), to: header("To"), subject: header("Subject"), date: header("Date"), snippet: message.snippet || "" };
      }));
      return NextResponse.json({ type: "emails", messages: messages.filter(Boolean) });
    }

    const now = new Date().toISOString();
    const calendarResponse = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=20&orderBy=startTime&singleEvents=true&timeMin=" + encodeURIComponent(now), {
      headers: { Authorization: "Bearer " + token }, cache: "no-store",
    });
    const calendar = await calendarResponse.json() as { items?: { id: string; summary?: string; description?: string; location?: string; htmlLink?: string; start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string }; status?: string }[]; error?: { message?: string } };
    if (!calendarResponse.ok) throw new Error(calendar.error?.message || "Události Kalendáře se nepodařilo načíst.");
    return NextResponse.json({
      type: "calendar",
      events: (calendar.items || []).map(event => ({
        id: event.id, title: event.summary || "Bez názvu", description: event.description || "",
        location: event.location || "", url: event.htmlLink || "",
        start: event.start?.dateTime || event.start?.date || "",
        end: event.end?.dateTime || event.end?.date || "",
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Načtení Google dat selhalo." }, { status: 502 });
  }
}
