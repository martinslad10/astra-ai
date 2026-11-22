import { createDecipheriv } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Serverová konfigurace Supabase není dokončená.");
  return createClient(url, key, { auth: { persistSession: false } });
}

export function decryptIntegrationToken(value: string): string {
  const key = Buffer.from(process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY || "", "base64");
  if (key.length !== 32) throw new Error("Chybí platný šifrovací klíč integrací.");
  const [iv, tag, data] = value.split(".");
  if (!iv || !tag || !data) throw new Error("Uložený token má neplatný formát.");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(data, "base64url")), decipher.final()]).toString("utf8");
}

export async function getGoogleAccessToken(userId: string): Promise<{ token: string; email: string | null }> {
  const admin = createAdminClient();
  const { data: row, error } = await admin.from("user_integrations")
    .select("provider_account_email,access_token_encrypted,refresh_token_encrypted,token_expires_at,status")
    .eq("user_id", userId).eq("provider", "google").maybeSingle();
  if (error || !row || row.status !== "connected" || !row.access_token_encrypted) {
    throw new Error("Google účet není propojený. Otevři Propojené služby a nejprve ho připoj.");
  }

  const expiry = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  if (expiry > Date.now() + 120_000) {
    return { token: decryptIntegrationToken(row.access_token_encrypted), email: row.provider_account_email };
  }
  if (!row.refresh_token_encrypted) {
    await admin.from("user_integrations").update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("user_id", userId).eq("provider", "google");
    throw new Error("Přístup Google vypršel. Odpoj a znovu připoj Google účet.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth není na serveru nakonfigurované.");
  const refreshToken = decryptIntegrationToken(row.refresh_token_encrypted);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
    cache: "no-store",
  });
  const data = await response.json() as { access_token?: string; expires_in?: number };
  if (!response.ok || !data.access_token) {
    await admin.from("user_integrations").update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("user_id", userId).eq("provider", "google");
    throw new Error("Google přístup nelze obnovit. Znovu připoj svůj účet.");
  }
  const { createCipheriv, randomBytes } = await import("node:crypto");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(process.env.INTEGRATION_TOKEN_ENCRYPTION_KEY || "", "base64"), iv);
  const encrypted = Buffer.concat([cipher.update(data.access_token), cipher.final()]);
  const encryptedValue = [iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), encrypted.toString("base64url")].join(".");
  const { error: updateError } = await admin.from("user_integrations").update({
    access_token_encrypted: encryptedValue,
    token_expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
    status: "connected",
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId).eq("provider", "google");
  if (updateError) throw new Error("Obnovený Google token se nepodařilo uložit.");
  return { token: data.access_token, email: row.provider_account_email };
}
