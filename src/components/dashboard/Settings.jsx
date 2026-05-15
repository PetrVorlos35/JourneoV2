import { Trash2, Moon, Sun, Monitor, DollarSign, User, Save, Camera, Mountain, Palmtree, Compass, Map, Plane } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useDialog } from '../ui/DialogModal';

const Settings = ({ onClearData, onConvertCurrency }) => {
  const { theme, setTheme } = useTheme();
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

  const themeOptions = [
    { id: 'dark', label: 'Tmavý', Icon: Moon },
    { id: 'light', label: 'Světlý', Icon: Sun },
    { id: 'system', label: 'Systém', Icon: Monitor },
  ];

  const avatarPresets = [
    { id: 'mountain', Icon: Mountain, color: 'bg-blue-500' },
    { id: 'beach', Icon: Palmtree, color: 'bg-orange-400' },
    { id: 'city', Icon: Compass, color: 'bg-purple-500' },
    { id: 'forest', Icon: Map, color: 'bg-green-500' },
    { id: 'travel', Icon: Plane, color: 'bg-indigo-500' },
    { id: 'photography', Icon: Camera, color: 'bg-pink-500' },
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
    <div className="w-full max-w-2xl">
      {ModalPortal}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Nastavení</h1>
        <p className="text-gray-500 dark:text-gray-400">Upravte si aplikaci podle sebe a spravujte svá data.</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <User size={24} className="text-blue-500" /> Můj profil
          </h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="mb-6">
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 block">Vyberte si avatar</label>
              <div className="flex flex-wrap gap-4">
                {avatarPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, avatar_url: preset.id })}
                    className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${preset.color} ${
                      profileForm.avatar_url === preset.id 
                        ? 'ring-4 ring-blue-500 ring-offset-4 dark:ring-offset-black scale-110' 
                        : 'opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <preset.Icon className="text-white" size={24} />
                    {profileForm.avatar_url === preset.id && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full border-2 border-white dark:border-black flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 block">Jméno</label>
                <input
                  type="text"
                  placeholder="např. Jan"
                  value={profileForm.first_name}
                  onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 block">Příjmení</label>
                <input
                  type="text"
                  placeholder="např. Novák"
                  value={profileForm.last_name}
                  onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 block">Napište něco o sobě (Bio)</label>
              <textarea
                placeholder="např. Milovník hor a dobrodružství..."
                rows="3"
                value={profileForm.bio}
                onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 block">E-mail (nelze změnit)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-3 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                Uložit změny
              </button>
            </div>
          </form>
        </div>

        {/* Theme */}
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Vzhled</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Vyberte barevný režim aplikace. Změna se projeví okamžitě.
          </p>
          <div className="flex gap-3">
            {themeOptions.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                  theme === id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'border-gray-50 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm'
                }`}
              >
                <Icon size={24} />
                <span className="font-bold text-xs uppercase tracking-wider">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Currency */}
        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-3xl p-6 shadow-sm">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <DollarSign size={20} className="text-gray-500 dark:text-gray-400" />
            Měna rozpočtu
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Zvolte si výchozí měnu pro sledování výdajů na vašich cestách.
          </p>
          <div className="flex flex-wrap gap-3">
            {currencyOptions.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleCurrencyChange(id)}
                className={`px-6 py-3 rounded-2xl border font-black transition-all ${
                  currency === id
                    ? 'border-green-500 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 shadow-sm'
                    : 'border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10 shadow-sm'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 rounded-3xl p-6">
          <h2 className="text-xl font-black text-red-600 dark:text-red-400 mb-2 flex items-center gap-2 uppercase tracking-tight">
            <Trash2 size={20} /> Nebezpečná zóna
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 font-medium">
            Tato akce trvale smaže všechny vaše uložené výlety, dny i statistiky. Nelze ji vzít zpět.
          </p>
          <button
            onClick={handleClear}
            className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 rounded-2xl font-black hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all shadow-sm"
          >
            Smazat všechna data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
