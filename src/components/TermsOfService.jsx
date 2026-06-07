import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="dark min-h-screen bg-black text-[#f5f5f7] font-sans selection:bg-blue-500/30 pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-32">
        <Link to="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Zpět na hlavní stránku
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-8 text-white">Obchodní podmínky</h1>
        <div className="space-y-6 text-gray-300 leading-relaxed">
          <p>Datum účinnosti: 1. ledna 2026</p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Přijetí podmínek</h2>
          <p>
            Používáním aplikace Journeo ("Služba") souhlasíte s těmito Obchodními podmínkami. Pokud s nimi nesouhlasíte, nepoužívejte prosím tuto aplikaci.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Uživatelské účty</h2>
          <p>
            Při vytváření účtu musíte poskytnout přesné a úplné informace. Jste zodpovědní za zabezpečení svého hesla a za veškerou aktivitu, která se na vašem účtu odehrává.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Uživatelský obsah</h2>
          <p>
            Vlastníte veškerá práva k obsahu, který do Služby nahrajete (včetně fotografií a poznámek z cest). Nahráním obsahu nám udělujete nevýhradní licenci k zobrazení tohoto obsahu za účelem poskytování Služby. Nesmíte nahrávat nezákonný, urážlivý nebo škodlivý obsah.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Dostupnost Služby</h2>
          <p>
            Službu poskytujeme "tak jak je". Nezaručujeme, že bude vždy bez chyb, bezpečná nebo bez výpadků. Vyhrazujeme si právo Službu kdykoli pozastavit, upravit nebo ukončit.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Ukončení</h2>
          <p>
            Váš účet můžeme zrušit nebo pozastavit bez předchozího upozornění, pokud porušíte tyto Obchodní podmínky. Zrušením účtu budou vaše data smazána v souladu s našimi Zásadami ochrany osobních údajů.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Kontakt</h2>
          <p>
            Pro jakékoli dotazy ohledně těchto podmínek nás kontaktujte na podpora@journeo.app.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
