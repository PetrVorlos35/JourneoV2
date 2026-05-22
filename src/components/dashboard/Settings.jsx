import { Trash2, DollarSign, User, Save, Camera, Mountain, Palmtree, Compass, Map, Plane } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../ui/DialogModal';

const Settings = ({ onClearData, onConvertCurrency }) => {
  const { currency, setCurrency } = useCurrency();
  const { user, updateProfile } = useAuth();
  const { promptDialog, confirmDialog, ModalPortal } = useDialog();

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    avatar_url: user?.avatar_url || '',
    bio: user?.bio || '',
  });
  const [saving, setSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profileForm);
      toast.success('Profil byl úspěšně uložen.');
    } catch (err) {
      toast.error('Nepodařilo se uložit profil.');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    const value = await promptDialog({
      title: 'Smazat všechna data?',
      message: 'Tato akce trvale smaže všechny výlety, dny i statistiky.',
      inputLabel: "Pro potvrzení napište 'SMAZAT VŠE'",
      placeholder: 'SMAZAT VŠE',
      requiredPhrase: 'SMAZAT VŠE',
      variant: 'danger',
      confirmLabel: 'Trvale smazat'
    });

    if (value === 'SMAZAT VŠE') {
      onClearData();
      toast.success("Všechna data byla úspěšně smazána.");
    }
  };

  const avatarPresets = [
    { id: 'mountain', Icon: Mountain },
    { id: 'beach', Icon: Palmtree },
    { id: 'city', Icon: Compass },
    { id: 'forest', Icon: Map },
    { id: 'travel', Icon: Plane },
    { id: 'photography', Icon: Camera },
  ];

  const currencyOptions = [
    { id: 'CZK', label: 'CZK (Kč)' },
    { id: 'EUR', label: 'EUR (€)' },
    { id: 'USD', label: 'USD ($)' },
    { id: 'GBP', label: 'GBP (£)' },
  ];

  const handleCurrencyChange = async (newCurr) => {
    if (newCurr === currency) return;
    const oldCurr = currency;
    
    const result = await confirmDialog({
      title: 'Změnit měnu?',
      message: `Přejete si přepočítat stávající výdaje do nové měny (${newCurr}) pomocí kurzu, nebo jen změnit symbol měny a nechat částky beze změny?`,
      confirmLabel: 'Ano, přepočítat',
      cancelLabel: 'Ne, jen symbol',
    });
    
    // result: true (Ano), false (Ne, jen symbol), null (Zavření křížkem/Esc/Kliknutí vedle)
    if (result === null) return;

    // Nastavíme novou měnu (pro obě potvrzovací možnosti)
    setCurrency(newCurr);
    
    if (result === true) {
      onConvertCurrency(oldCurr, newCurr);
      toast.success(`Částky byly přepočítány do ${newCurr}`);
    } else {
      toast.success(`Symbol měny změněn na ${newCurr}`);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-12">
      {ModalPortal}
      <div className="space-y-2">
        <p className="text-[11px] text-journeo-text-subtle uppercase tracking-widest font-medium">Správa profilu</p>
        <h1 className="font-serif text-4xl text-journeo-text tracking-tight">Nastavení</h1>
      </div>

      <div className="space-y-8">
        {/* Profile Section */}
        <div className="bg-transparent border border-journeo-border rounded-sm p-8 md:p-10">
          <h2 className="font-serif text-2xl text-journeo-text mb-8 flex items-center gap-3">
            <User size={24} className="text-journeo-accent" strokeWidth={1.5} /> Můj profil
          </h2>
          <form onSubmit={handleProfileSave} className="space-y-8">
            <div>
              <label className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-4 block">Vyberte si avatar</label>
              <div className="flex flex-wrap gap-4">
                {avatarPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, avatar_url: preset.id })}
                    className={`relative w-16 h-16 rounded-sm flex items-center justify-center transition-all duration-300 border ${
                      profileForm.avatar_url === preset.id 
                        ? 'border-journeo-accent bg-journeo-surface text-journeo-accent' 
                        : 'border-journeo-border-strong bg-transparent text-journeo-text-subtle hover:text-journeo-text hover:border-journeo-text-subtle'
                    }`}
                  >
                    <preset.Icon strokeWidth={1.5} size={28} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-2 block">Jméno</label>
                <input
                  type="text"
                  placeholder="např. Jan"
                  value={profileForm.first_name}
                  onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="w-full bg-transparent border-b border-journeo-border-strong px-0 py-3 text-journeo-text placeholder-journeo-text-subtle/30 focus:outline-none focus:border-journeo-accent transition-colors duration-300 font-serif text-xl"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-2 block">Příjmení</label>
                <input
                  type="text"
                  placeholder="např. Novák"
                  value={profileForm.last_name}
                  onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="w-full bg-transparent border-b border-journeo-border-strong px-0 py-3 text-journeo-text placeholder-journeo-text-subtle/30 focus:outline-none focus:border-journeo-accent transition-colors duration-300 font-serif text-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-2 block">Napište něco o sobě (Bio)</label>
              <textarea
                placeholder="např. Milovník hor a dobrodružství..."
                rows="3"
                value={profileForm.bio}
                onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full bg-transparent border-b border-journeo-border-strong px-0 py-3 text-journeo-text placeholder-journeo-text-subtle/30 focus:outline-none focus:border-journeo-accent transition-colors duration-300 resize-none font-light leading-relaxed"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-journeo-text-subtle uppercase tracking-widest mb-2 block">E-mail (nelze změnit)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-transparent border-b border-journeo-border/50 px-0 py-3 text-journeo-text-muted cursor-not-allowed font-serif text-xl italic"
              />
            </div>
            <div className="pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-3 px-8 py-4 bg-journeo-accent text-journeo-dark rounded-sm font-medium hover:bg-journeo-accent-hover transition-colors duration-300 disabled:opacity-50 disabled:hover:bg-journeo-accent"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-journeo-dark/20 border-t-journeo-dark rounded-full animate-spin" />
                ) : (
                  <Save size={18} strokeWidth={2} />
                )}
                Uložit profil
              </button>
            </div>
          </form>
        </div>

        {/* Currency */}
        <div className="bg-transparent border border-journeo-border rounded-sm p-8 md:p-10">
          <h2 className="font-serif text-2xl text-journeo-text mb-4 flex items-center gap-3">
            <DollarSign size={24} className="text-journeo-accent" strokeWidth={1.5} />
            Měna rozpočtu
          </h2>
          <p className="text-journeo-text-muted font-light mb-8">
            Zvolte si výchozí měnu pro sledování výdajů na vašich cestách.
          </p>
          <div className="flex flex-wrap gap-4">
            {currencyOptions.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleCurrencyChange(id)}
                className={`px-8 py-3.5 rounded-sm border font-medium transition-colors duration-300 uppercase tracking-widest text-[12px] ${
                  currency === id
                    ? 'border-journeo-accent bg-journeo-accent/10 text-journeo-accent'
                    : 'border-journeo-border-strong text-journeo-text-subtle hover:text-journeo-text hover:border-journeo-text-subtle'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-sm p-8 md:p-10">
          <h2 className="font-serif text-2xl text-red-400 mb-4 flex items-center gap-3">
            <Trash2 size={24} strokeWidth={1.5} /> Nebezpečná zóna
          </h2>
          <p className="text-red-400/80 font-light mb-8">
            Tato akce trvale smaže všechny vaše uložené výlety, dny i statistiky. Nelze ji vzít zpět.
          </p>
          <button
            onClick={handleClear}
            className="w-full sm:w-auto px-8 py-3.5 border border-red-500/30 text-red-400 rounded-sm font-medium hover:bg-red-500 hover:text-white transition-colors duration-300"
          >
            Smazat všechna data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
