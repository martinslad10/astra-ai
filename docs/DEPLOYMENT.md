# Nasazení Astra AI na Vercel

Astra AI je aplikace Next.js 15. Konfigurace `vercel.json` používá standardní Next.js build a evropský region Frankfurt (`fra1`). Samotné přidání konfigurace aplikaci ještě nenasazuje; nasazení vyžaduje přístup k účtu Vercel.

## 1. Připojení repozitáře

1. Přihlas se na [Vercel](https://vercel.com/).
2. Zvol **Add New → Project** a importuj `martinslad10/astra-ai` z GitHubu.
3. Ponech framework **Next.js**, root directory `./`, install command `npm install` a build command `npm run build`.
4. Nejprve použij Preview deployment. Produkci zapni až po ověření Preview.

## 2. Proměnné prostředí

Nastav je v **Project → Settings → Environment Variables**. Citlivé klíče nikdy nevkládej do repozitáře ani do proměnných s prefixem `NEXT_PUBLIC_`.

| Proměnná | Povinná | Účel |
| --- | --- | --- |
| `OPENAI_API_KEY` | Pro AI funkce ano | Serverový klíč OpenAI |
| `OPENAI_MODEL` | Ne | Model; výchozí `gpt-4.1-mini` |
| `REPLICATE_API_TOKEN` | Ne | Přístup k Replicate pro generování videa |
| `REPLICATE_VIDEO_MODEL` | Ne | Replicate model ve formátu `owner/model`; vstupní schéma modelu je nutné ověřit |
| `NEXT_PUBLIC_SUPABASE_URL` | Ne | URL Supabase projektu |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ne | Veřejný Supabase klíč; sám o sobě neaktivuje cloudovou paměť |
| `SUPABASE_SERVICE_ROLE_KEY` | Ne | Server-only klíč, zatím ho aplikace nepotřebuje a nesmí být vystaven klientovi |

Po přidání nebo změně proměnných spusť nový deployment.

## 3. Kontrola po nasazení

- Otevři hlavní stránku a všechny pracovní sekce: `/code`, `/marketing`, `/images`, `/video`, `/memory`.
- Otevři `/api/health`; odpověď ukazuje dostupnost konfigurace, nikoli ověřenou platnost klíčů.
- S platným klíčem ověř chat, webové vyhledávání a code interpreter. Ověř také limity, chybové hlášky a upload textových souborů/PDF/DOCX.
- Generování obrázků a videa testuj až po připojení příslušných služeb a ověř dostupnost modelů/účtování.
- Zkontroluj logy Vercel Functions a žádné tajné hodnoty neloguj.
- Před veřejným spuštěním vyřeš distribuované rate limiting, autentizaci a cloudovou paměť. Současný rate limiter je procesní a paměť zůstává lokálně v prohlížeči.

## Aktuální omezení

- Databázová migrace Supabase je pouze základ schématu; aplikace zatím nemá hotové přihlášení ani cloudovou synchronizaci.
- Programovací sekce generuje návrhy kódu, ale sama bezpečně neupravuje repozitář ani nespouští uživatelský kód.
- Video integrace závisí na konkrétním modelu Replicate a jeho vstupním schématu; před produkcí vyžaduje živý test.
- PDF skeny vyžadující OCR nejsou podporované.
- Build a živé integrace musí být ověřeny výsledkem CI a následným testem Preview; úspěšné vytvoření konfigurace není důkazem úspěšného nasazení.
