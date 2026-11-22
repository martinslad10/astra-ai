import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Zásady ochrany osobních údajů",
  description: "Informace o zpracování osobních údajů a propojení externích služeb v ChatSLADAI.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return <main className="legal-page">
    <header className="legal-header"><Link href="/">← ChatSLADAI</Link><span>Právní informace</span></header>
    <article className="legal-content">
      <p className="legal-eyebrow">CHATSLADAI · OCHRANA SOUKROMÍ</p>
      <h1>Zásady ochrany osobních údajů</h1>
      <p className="legal-updated">Pracovní znění – před veřejným spuštěním je nutné doplnit identifikační a kontaktní údaje provozovatele a ověřit všechny používané služby.</p>
      <h2>1. Kdo je správcem údajů</h2>
      <p>Správcem osobních údajů je provozovatel služby ChatSLADAI: <strong>[DOPLNIT CELÉ JMÉNO / OBCHODNÍ FIRMU]</strong>, IČO: <strong>[DOPLNIT, JE-LI PŘIDĚLENO]</strong>, sídlo / místo podnikání: <strong>[DOPLNIT ÚPLNOU ADRESU]</strong>. Kontaktní e-mail pro dotazy k soukromí a uplatnění práv: <strong>[DOPLNIT KONTAKTNÍ E-MAIL]</strong>.</p>
      <h2>2. Jaké údaje zpracováváme</h2>
      <ul>
        <li>Údaje účtu, zejména e-mailová adresa a identifikátor účtu.</li>
        <li>Obsah konverzací, soubory a další obsah, který do služby vložíte.</li>
        <li>Uložené poznámky a nastavení, pokud využíváte funkce paměti.</li>
        <li>Technické a bezpečnostní údaje, například IP adresu, informace o zařízení, provozní záznamy a údaje nutné k ochraně před zneužitím.</li>
        <li>Údaje externích účtů, které výslovně propojíte, včetně e-mailové adresy Google a rozsahu udělených oprávnění.</li>
      </ul>
      <h2>3. Proč údaje používáme a právní základy</h2>
      <p>Údaje používáme k vytvoření a správě účtu, poskytování funkcí AI, ukládání historie a paměti, zabezpečení služby, řešení podpory a plnění právních povinností. Právním základem je podle konkrétního účelu plnění smlouvy, oprávněný zájem na bezpečném provozu a případně souhlas nebo zákonná povinnost.</p>
      <h2>4. Propojení Google – Gmail a Kalendář</h2>
      <p>Google účet propojujete dobrovolně a samostatně. ChatSLADAI žádá pouze o oprávnění ke čtení Gmailu a Kalendáře. V této verzi nelze prostřednictvím propojení odesílat e-maily, vytvářet ani měnit události. Přístupové tokeny jsou ukládány v šifrované podobě na serveru a propojení je přiřazeno k vašemu účtu ChatSLADAI. Přístup můžete odpojit v sekci Propojené služby; odpojení odstraní uložené přihlašovací tokeny z naší databáze. Oprávnění můžete odebrat také ve svém účtu Google.</p>
      <p>Data Google používáme pouze k funkcím, které si sami vyžádáte, a v souladu s Google API Services User Data Policy, včetně požadavků na Limited Use. Nepoužíváme obsah Gmailu ani Kalendáře k reklamě a neprodáváme jej. Před aktivací této funkce musí provozovatel ověřit aktuální technické toky, dobu uchování, přístup pracovníků a případné další zpracovatele.</p>
      <h2>5. Poskytovatelé a předávání údajů</h2>
      <p>Pro provoz služby mohou být využíváni poskytovatelé hostingu, databáze, AI modelů, bezpečnostních a analytických služeb. Konkrétní seznam poskytovatelů, jejich role, země zpracování a případné předávání mimo Evropský hospodářský prostor musí být doplněny podle skutečně aktivní konfigurace služby před zveřejněním těchto zásad.</p>
      <h2>6. Doba uchování</h2>
      <p>Údaje uchováváme jen po dobu potřebnou pro poskytování služby, zabezpečení, plnění zákonných povinností a řešení sporů. Konkrétní retenční lhůty pro účet, konverzace, soubory, provozní záznamy a zálohy musí být stanoveny a zveřejněny provozovatelem před veřejným spuštěním. Po zrušení účtu budou údaje odstraněny nebo anonymizovány, pokud jejich další uchování nevyžaduje zákon.</p>
      <h2>7. Vaše práva</h2>
      <p>Za podmínek GDPR máte právo požadovat přístup k údajům, opravu, výmaz, omezení zpracování, vznést námitku, získat přenositelné údaje a podat stížnost u Úřadu pro ochranu osobních údajů. Pokud je zpracování založeno na souhlasu, můžete jej kdykoli odvolat. Žádosti posílejte na výše uvedený kontaktní e-mail.</p>
      <h2>8. Bezpečnost</h2>
      <p>Používáme přiměřená technická a organizační opatření, například řízení přístupu, oddělení uživatelských dat, šifrování citlivých tokenů a zabezpečený přenos. Žádné opatření však nemůže zaručit absolutní bezpečnost. Neposílejte do služby hesla, platební údaje ani jiné tajné přístupové údaje.</p>
      <h2>9. Děti</h2>
      <p>Služba není určena dětem, které nedosáhly věku stanoveného příslušnými právními předpisy pro samostatné udělení souhlasu s digitální službou. Pokud zjistíme, že účet používá dítě v rozporu s právními předpisy, přijmeme odpovídající opatření.</p>
      <h2>10. Změny zásad</h2>
      <p>Zásady můžeme aktualizovat při změně služby nebo právních požadavků. Aktuální verze bude dostupná na této stránce s datem účinnosti.</p>
      <p className="legal-placeholder">PŘED ZVEŘEJNĚNÍM DOPLNIT: identitu a adresu provozovatele, kontaktní e-mail, seznam skutečných zpracovatelů, retenční lhůty, právní základy pro jednotlivé funkce a datum účinnosti.</p>
      <Link href="/">Zpět do ChatSLADAI</Link>
    </article>
  </main>;
}
