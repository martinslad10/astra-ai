import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Podmínky používání",
  description: "Podmínky používání služby ChatSLADAI.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return <main className="legal-page">
    <header className="legal-header"><Link href="/">← ChatSLADAI</Link><span>Právní informace</span></header>
    <article className="legal-content">
      <p className="legal-eyebrow">CHATSLADAI · PODMÍNKY SLUŽBY</p>
      <h1>Podmínky používání</h1>
      <p className="legal-updated">Pracovní znění – před veřejným spuštěním je nutné doplnit provozovatele, ceny, fakturační pravidla a kontaktní údaje.</p>
      <h2>1. Poskytovatel a přijetí podmínek</h2>
      <p>Službu ChatSLADAI provozuje <strong>[DOPLNIT CELÉ JMÉNO / OBCHODNÍ FIRMU]</strong>, IČO: <strong>[DOPLNIT]</strong>, se sídlem / místem podnikání <strong>[DOPLNIT ADRESU]</strong> (dále jen „Provozovatel“). Kontakt: <strong>[DOPLNIT E-MAIL]</strong>. Používáním služby potvrzujete, že jste se s těmito podmínkami seznámili.</p>
      <h2>2. Popis služby</h2>
      <p>ChatSLADAI je AI pracovní prostor, který může poskytovat konverzaci s AI, tvorbu a analýzu textu, programovací a kreativní nástroje, práci se soubory, paměť a propojení externích služeb. Dostupnost konkrétních funkcí se může měnit. Funkce, které nejsou v aplikaci výslovně aktivní, nejsou součástí poskytované služby.</p>
      <h2>3. Účet a zabezpečení</h2>
      <p>Pro některé funkce je nutné vytvořit účet. Uživatel odpovídá za správnost poskytnutých údajů, zabezpečení přihlašovacích prostředků a aktivitu provedenou prostřednictvím svého účtu. Při podezření na zneužití kontaktujte Provozovatele.</p>
      <h2>4. Pravidla používání</h2>
      <ul>
        <li>Službu používejte v souladu s právními předpisy a právy třetích osob.</li>
        <li>Nepokoušejte se obcházet zabezpečení, limity, přístupová oprávnění ani získávat data jiných uživatelů.</li>
        <li>Nevkládejte škodlivý kód, cizí osobní údaje bez oprávnění ani obsah, k jehož použití nemáte práva.</li>
        <li>Nepoužívejte výstupy AI jako jediný podklad pro zdravotní, právní, finanční nebo jiné závažné rozhodnutí bez odborného ověření.</li>
        <li>Nepoužívejte službu k podvodům, obtěžování, porušování soukromí nebo jinému protiprávnímu jednání.</li>
      </ul>
      <h2>5. Výstupy AI a odpovědnost uživatele</h2>
      <p>Výstupy generované AI mohou být nepřesné, neúplné, zastaralé nebo podobné výstupům vytvořeným pro jiné uživatele. Provozovatel nezaručuje jejich správnost, originalitu, vhodnost pro konkrétní účel ani dosažení obchodního či jiného výsledku. Uživatel je povinen výstupy před použitím zkontrolovat a ověřit, zejména pokud mohou mít právní, zdravotní, finanční, bezpečnostní nebo obchodní dopad.</p>
      <h2>6. Externí účty a oprávnění</h2>
      <p>Propojení Google nebo jiné externí služby je dobrovolné. Uživatel rozhoduje o propojení svého účtu a udělených oprávněních. Rozsah oprávnění a dostupné akce jsou zobrazeny v aplikaci. Uživatel může propojení odvolat. Dostupnost externích služeb závisí také na jejich provozovatelích a jejich podmínkách.</p>
      <h2>7. Obsah uživatele a soukromí</h2>
      <p>Uživatel si ponechává práva ke svému obsahu v rozsahu, v jakém mu náleží. Uděluje Provozovateli pouze oprávnění nezbytná k technickému zpracování obsahu a poskytování zvolených funkcí. Zpracování osobních údajů se řídí samostatnými <Link href="/privacy">Zásadami ochrany osobních údajů</Link>.</p>
      <h2>8. Dostupnost, limity a změny</h2>
      <p>Služba může podléhat limitům požadavků, velikosti souborů, dostupnosti modelů a kapacitě externích poskytovatelů. Provozovatel může službu aktualizovat, dočasně omezit z důvodu údržby, bezpečnosti nebo technické závady. Konkrétní garance dostupnosti jsou poskytovány pouze tehdy, pokud jsou výslovně sjednány.</p>
      <h2>9. Cena a platby</h2>
      <p>Aktuální cena, případné zkušební období, způsob platby, fakturace, automatické obnovování a podmínky ukončení placeného tarifu musí být zobrazeny uživateli před objednáním. Pokud aplikace žádnou placenou nabídku nezobrazuje, nevzniká tímto ustanovením povinnost platit. Konkrétní obchodní a spotřebitelské podmínky je nutné doplnit před spuštěním plateb.</p>
      <h2>10. Duševní vlastnictví</h2>
      <p>Označení, design, software a části služby náleží Provozovateli nebo jeho poskytovatelům a jsou chráněny právními předpisy. Uživatel nesmí bez oprávnění kopírovat, distribuovat, zpětně analyzovat nebo jinak zneužívat části služby, s výjimkou případů povolených zákonem.</p>
      <h2>11. Omezení a ukončení účtu</h2>
      <p>Provozovatel může přiměřeně omezit nebo pozastavit účet při porušení podmínek, bezpečnostním incidentu, zneužití služby nebo právní povinnosti. Uživatel může používání služby ukončit a požádat o odstranění účtu postupem uvedeným v aplikaci nebo kontaktováním podpory.</p>
      <h2>12. Reklamace a kontakt</h2>
      <p>Dotazy, stížnosti a reklamace zasílejte na <strong>[DOPLNIT KONTAKTNÍ E-MAIL A POSTUP]</strong>. Před veřejným spuštěním musí Provozovatel doplnit zákonné informace pro spotřebitele, včetně případných pravidel pro odstoupení od smlouvy a mimosoudního řešení sporů.</p>
      <h2>13. Závěrečná ustanovení</h2>
      <p>Tyto podmínky se řídí právem České republiky, s výhradou kogentních práv spotřebitele. Neplatnost jednotlivého ustanovení nemá vliv na platnost ostatních ustanovení. Aktuální znění je dostupné na této stránce.</p>
      <p className="legal-placeholder">PŘED ZVEŘEJNĚNÍM DOPLNIT: identitu a adresu provozovatele, IČO, kontaktní e-mail, ceník a fakturační pravidla, reklamační postup, spotřebitelská poučení a datum účinnosti. Text musí zkontrolovat právník podle skutečného obchodního modelu.</p>
      <Link href="/">Zpět do ChatSLADAI</Link>
    </article>
  </main>;
}
