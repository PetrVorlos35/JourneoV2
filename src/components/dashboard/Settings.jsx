import { Trash2, Moon, Sun, Monitor } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';

const Settings = ({ onClearData }) => {
  const { theme, setTheme } = useTheme();

  const handleClear = () => {
    const confirmText = window.prompt("Tato akce trvale smaže všechna data. Pro potvrzení napište 'SMAZAT VŠE':");
    if (confirmText === 'SMAZAT VŠE') {
      onClearData();
      toast.success("Všechna data byla úspěšně smazána.");
    } else if (confirmText !== null) {
      toast.error("Zadána nesprávná potvrzovací fráze.");
    }
  };

  const themeOptions = [
    { id: 'dark', label: 'Tmavý', Icon: Moon },
    { id: 'light', label: 'Světlý', Icon: Sun },
    { id: 'system', label: 'Systém', Icon: Monitor },
  ];

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Nastavení</h1>
        <p className="text-gray-500 dark:text-gray-400">Upravte si aplikaci podle sebe a spravujte svá data.</p>
      </div>

      <div className="space-y-6">
        {/* Theme */}
        <div className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Vzhled</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Vyberte barevný režim aplikace. Změna se projeví okamžitě.
          </p>
          <div className="flex gap-4">
            {themeOptions.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  theme === id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon size={24} />
                <span className="font-medium text-sm">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
            <Trash2 size={20} /> Nebezpečná zóna
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Tato akce trvale smaže všechny vaše uložené výlety, dny i statistiky. Nelze ji vzít zpět.
          </p>
          <button
            onClick={handleClear}
            className="w-full sm:w-auto px-6 py-3 bg-red-100 dark:bg-red-600/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/30 rounded-xl font-bold hover:bg-red-600 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-colors"
          >
            Smazat všechna data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
