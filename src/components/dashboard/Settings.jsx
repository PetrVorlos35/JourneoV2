import { Trash2, DollarSign, User, Save, Camera, Mountain, Palmtree, Compass, Map, Plane, Monitor, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDialog } from '../ui/DialogModal';

const Settings = ({ onClearData, onConvertCurrency }) => {
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
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

  const themeOptions = [
    { id: 'light', label: 'Světlý', Icon: Sun },
    { id: 'dark', label: 'Tmavý', Icon: Moon },
    { id: 'system', label: 'Systémový', Icon: Monitor },
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
    
    if (result === null) return;

    setCurrency(newCurr);
    
    if (result === true) {
      onConvertCurrency(oldCurr, newCurr);
      toast.success(`Částky byly přepočítány do ${newCurr}`);
    } else {
      toast.success(`Symbol měny změněn na ${newCurr}`);
    }
  };

  return (
    <div className="w-full max-w-2xl space-y-12 pb-10">
      {ModalPortal}
      <div className="space-y-2">
        <p className="text-[12px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">Správa profilu</p>
        <h1 className="text-4xl text-gray-900 dark:text-white tracking-tight font-bold">Nastavení</h1>
      </div>

      <div className="space-y-8">
        
        {/* Appearance (Theme) Section */}
        <div className="glass-card p-8 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Sun size={20} strokeWidth={2} className="dark:hidden" />
              <Moon size={20} strokeWidth={2} className="hidden dark:block" />
            </div>
            Vzhled aplikace
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
            Vyberte si motiv, který vám nejvíce vyhovuje.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {themeOptions.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 ${
                  theme === id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <Icon size={32} strokeWidth={2} className="mb-3" />
                <span className="font-bold text-[13px] uppercase tracking-widest">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Section */}
        <div className="glass-card p-8 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <User size={20} strokeWidth={2} />
            </div>
            Můj profil
          </h2>
          <form onSubmit={handleProfileSave} className="space-y-8">
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4 block">Vyberte si avatar</label>
              <div className="flex flex-wrap gap-4">
                {avatarPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, avatar_url: preset.id })}
                    className={`relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                      profileForm.avatar_url === preset.id 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                        : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <preset.Icon strokeWidth={2} size={28} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Jméno</label>
                <input
                  type="text"
                  placeholder="např. Jan"
                  value={profileForm.first_name}
                  onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="glass-input"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Příjmení</label>
                <input
                  type="text"
                  placeholder="např. Novák"
                  value={profileForm.last_name}
                  onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="glass-input"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">Napište něco o sobě (Bio)</label>
              <textarea
                placeholder="např. Milovník hor a dobrodružství..."
                rows="3"
                value={profileForm.bio}
                onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="glass-input resize-none py-4"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 block">E-mail (nelze změnit)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="glass-input opacity-60 cursor-not-allowed"
              />
            </div>
            <div className="pt-6">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-colors duration-300 disabled:opacity-50 disabled:hover:bg-blue-600 shadow-md shadow-blue-500/20 active:scale-95"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} strokeWidth={2.5} />
                )}
                Uložit profil
              </button>
            </div>
          </form>
        </div>

        {/* Currency */}
        <div className="glass-card p-8 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <DollarSign size={20} strokeWidth={2} />
            </div>
            Měna rozpočtu
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
            Zvolte si výchozí měnu pro sledování výdajů na vašich cestách.
          </p>
          <div className="flex flex-wrap gap-4">
            {currencyOptions.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleCurrencyChange(id)}
                className={`px-8 py-4 rounded-2xl border-2 font-bold transition-colors duration-300 uppercase tracking-widest text-[12px] ${
                  currency === id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-[2rem] p-8 md:p-10">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
              <Trash2 size={20} strokeWidth={2} />
            </div>
            Nebezpečná zóna
          </h2>
          <p className="text-red-500/80 font-medium mb-8">
            Tato akce trvale smaže všechny vaše uložené výlety, dny i statistiky. Nelze ji vzít zpět.
          </p>
          <button
            onClick={handleClear}
            className="w-full sm:w-auto px-8 py-4 border-2 border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-colors duration-300 shadow-sm shadow-red-500/10 active:scale-95"
          >
            Smazat všechna data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
