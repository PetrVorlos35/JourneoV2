import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="dark min-h-screen bg-black text-[#f5f5f7] font-sans selection:bg-blue-500/30 pb-20">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 pt-32">
        <Link to="/" className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium mb-8 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Zpět na hlavní stránku
        </Link>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-8 text-white">Zásady ochrany osobních údajů</h1>
        <div className="space-y-6 text-gray-300 leading-relaxed">
          <p>Datum účinnosti: 1. ledna 2026</p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Jaké údaje shromažďujeme</h2>
          <p>
            Shromažďujeme údaje, které nám poskytnete při registraci (jméno, e-mail), a údaje o vašich cestách, které do aplikace sami vložíte (lokace, data, výdaje, poznámky, fotografie).
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Jak údaje využíváme</h2>
          <p>
            Získané údaje používáme výhradně k poskytování služeb aplikace Journeo, synchronizaci vašich zařízení a vylepšování uživatelského zážitku. Vaše cesty nejsou veřejné, pokud se je nerozhodnete sdílet s přáteli v rámci komunitních funkcí.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. Sdílení údajů s třetími stranami</h2>
          <p>
            Vaše osobní údaje neprodáváme žádným třetím stranám. Údaje mohou být sdíleny pouze s poskytovateli technické infrastruktury (např. hostingové služby, databáze), kteří jsou vázáni mlčenlivostí.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Vaše práva (GDPR)</h2>
          <p>
            Máte právo na přístup k vašim osobním údajům, jejich opravu, výmaz ("právo být zapomenut") a přenositelnost. Pro uplatnění těchto práv nás kontaktujte.
          </p>
          <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Kontakt</h2>
          <p>
            Pokud máte otázky ohledně těchto zásad, kontaktujte nás na e-mailu podpora@journeo.app.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
