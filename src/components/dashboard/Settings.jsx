import { Trash2, DollarSign, User, Save, Camera, Mountain, Palmtree, Compass, Map, Plane, Monitor, Sun, Moon, X, KeyRound, Eye, EyeOff, Check, Globe, Link as LinkIcon, Copy, ArrowRight, Landmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDialog } from '../ui/DialogModal';
import DashboardLanguageSwitcher from './DashboardLanguageSwitcher';
import CharCount from '../ui/CharCount';
import api from '../../services/api';

const Settings = ({ onClearData, onConvertCurrency }) => {
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const { user, updateProfile, changePassword } = useAuth();
  const { promptDialog, confirmDialog, ModalPortal } = useDialog();
  const { t } = useTranslation();

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    return strength;
  };

  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    avatar_url: user?.avatar_url || '',
    bio: user?.bio || '',
    bank_account: user?.bank_account || '',
  });
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [inviteToken, setInviteToken] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    api.friends.getInviteLink()
      .then(data => setInviteToken(data.token))
      .catch(err => console.error('Failed to load invite link:', err));
  }, []);

  const inviteUrl = inviteToken ? `${window.location.origin}/dashboard/add-friend/${inviteToken}` : null;

  const handleCopyInvite = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setLinkCopied(true);
    toast.success(t('friends.invite.linkCopied'));
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const [pwdForm, setPwdForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdError, setPwdError] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [showPwd, setShowPwd] = useState({ old: false, new: false, confirm: false });

  const handleProfileChange = (field, value) => {
    setProfileForm(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profileForm);
      setHasUnsavedChanges(false);
      toast.success(t('settings.profile.saveSuccess'));
    } catch (err) {
      toast.error(t('settings.profile.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handlePwdChange = (field, value) => {
    setPwdForm(prev => ({ ...prev, [field]: value }));
    setPwdError('');
  };

  const handlePwdSave = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError(t('settings.password.mismatch'));
      return;
    }
    const strength = getPasswordStrength(pwdForm.newPassword);
    if (strength < 3) {
      setPwdError(t('settings.password.weak'));
      return;
    }
    setSavingPwd(true);
    try {
      const res = await changePassword(pwdForm.oldPassword, pwdForm.newPassword);
      toast.success(res.message || t('auth.toasts.resetSuccess'));
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdError(err.message || t('auth.errors.resetError'));
    } finally {
      setSavingPwd(false);
    }
  };

  const handleClear = async () => {
    const requiredPhrase = t('settings.danger.requiredPhrase');
    const value = await promptDialog({
      title: t('settings.danger.confirmTitle'),
      message: t('settings.danger.confirmMessage'),
      inputLabel: t('settings.danger.confirmLabel'),
      placeholder: requiredPhrase,
      requiredPhrase,
      variant: 'danger',
      confirmLabel: t('settings.danger.confirmBtn')
    });

    if (value === requiredPhrase) {
      onClearData();
      toast.success(t('settings.danger.successMessage'));
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
    { id: 'light', label: t('settings.theme.light'), Icon: Sun },
    { id: 'dark', label: t('settings.theme.dark'), Icon: Moon },
    { id: 'system', label: t('settings.theme.system'), Icon: Monitor },
  ];

  const handleCurrencyChange = async (newCurr) => {
    if (newCurr === currency) return;
    const oldCurr = currency;

    const result = await confirmDialog({
      title: t('settings.currency.changeTitle'),
      message: t('settings.currency.changeMessage', { newCurr }),
      confirmLabel: t('settings.currency.yes'),
      cancelLabel: t('settings.currency.no'),
    });

    if (result === null) return;

    if (result === true) {
      // Conversion can fail (live rate unavailable) — only switch the
      // displayed currency once the amounts were actually recalculated.
      const converted = await onConvertCurrency(oldCurr, newCurr);
      if (!converted) return;
      setCurrency(newCurr);
      toast.success(t('settings.currency.recalculated', { currency: newCurr }));
    } else {
      setCurrency(newCurr);
      toast.success(t('settings.currency.symbolChanged', { currency: newCurr }));
    }
  };

  return (
    <div className="w-full space-y-12 pb-10">
      {ModalPortal}
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('settings.subtitle')}</p>
        <h1 className="text-2xl sm:text-4xl text-gray-900 dark:text-white tracking-tight font-bold" style={{ textWrap: 'balance' }}>{t('settings.title')}</h1>
      </div>

      <div className="space-y-8">

        {/* Profile Section */}
        <div className="glass-card p-5 sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <User size={20} strokeWidth={2} />
            </div>
            {t('settings.profile.title')}
          </h2>
          <form onSubmit={handleProfileSave} className="space-y-8">
            <div>
              <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-4 block">{t('settings.profile.avatarLabel')}</label>
              <div className="flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={() => handleProfileChange('avatar_url', '')}
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                    !profileForm.avatar_url
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  } cursor-pointer disabled:cursor-not-allowed`}
                  title={t('settings.profile.avatarDefault')}
                >
                  <X strokeWidth={2.5} size={20} />
                </button>
                {avatarPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleProfileChange('avatar_url', preset.id)}
                    className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 ${
                      profileForm.avatar_url === preset.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    } cursor-pointer disabled:cursor-not-allowed`}
                  >
                    <preset.Icon strokeWidth={2} size={24} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <label htmlFor="settings-first-name" className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{t('settings.profile.firstName')}</label>
                <input
                  id="settings-first-name"
                  type="text"
                  maxLength={100}
                  placeholder={t('settings.profile.firstNamePlaceholder')}
                  value={profileForm.first_name}
                  onChange={e => handleProfileChange('first_name', e.target.value)}
                  className="glass-input"
                />
                <div className="flex justify-end mt-1.5 pr-1">
                  <CharCount value={profileForm.first_name} max={100} />
                </div>
              </div>
              <div>
                <label htmlFor="settings-last-name" className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{t('settings.profile.lastName')}</label>
                <input
                  id="settings-last-name"
                  type="text"
                  maxLength={100}
                  placeholder={t('settings.profile.lastNamePlaceholder')}
                  value={profileForm.last_name}
                  onChange={e => handleProfileChange('last_name', e.target.value)}
                  className="glass-input"
                />
                <div className="flex justify-end mt-1.5 pr-1">
                  <CharCount value={profileForm.last_name} max={100} />
                </div>
              </div>
            </div>
            <div>
              <label htmlFor="settings-bio" className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{t('settings.profile.bio')}</label>
              <textarea
                id="settings-bio"
                placeholder={t('settings.profile.bioPlaceholder')}
                rows="3"
                maxLength={300}
                value={profileForm.bio}
                onChange={e => handleProfileChange('bio', e.target.value)}
                className="glass-input resize-none py-4"
              />
              <div className="flex justify-end mt-1.5 pr-1">
                <CharCount value={profileForm.bio} max={300} />
              </div>
            </div>
            <div>
              <label htmlFor="settings-bank-account" className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Landmark size={15} className="text-gray-400" strokeWidth={2} />
                {t('settings.profile.bankAccount')}
              </label>
              <input
                id="settings-bank-account"
                type="text"
                inputMode="text"
                maxLength={64}
                placeholder={t('settings.profile.bankAccountPlaceholder')}
                value={profileForm.bank_account}
                onChange={e => handleProfileChange('bank_account', e.target.value)}
                className="glass-input font-mono"
              />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5 pl-1">{t('settings.profile.bankAccountHint')}</p>
            </div>
            <div>
              <label className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{t('friends.invite.title')}</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl px-4 py-2.5 min-w-0">
                  <LinkIcon size={14} className="text-gray-400 shrink-0" strokeWidth={2.5} />
                  <span className="flex-1 text-[12px] text-gray-600 dark:text-white/60 font-mono truncate select-all">
                    {inviteUrl || '…'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyInvite}
                    disabled={!inviteUrl}
                    aria-label={t('friends.invite.copy')}
                    className="shrink-0 w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {linkCopied ? <Check size={14} strokeWidth={2.5} className="text-green-500 dark:text-green-400" /> : <Copy size={14} strokeWidth={2} />}
                  </button>
                </div>
                <Link
                  to="/dashboard/friends"
                  className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors px-1"
                >
                  {t('addFriendInvite.goToFriends')} <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
            <div>
              <label htmlFor="settings-email" className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{t('settings.profile.emailLabel')}</label>
              <input
                id="settings-email"
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
                className={`flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 text-white rounded-2xl font-bold transition-all duration-300 shadow-md active:scale-95 disabled:opacity-50 disabled:hover:scale-100 ${
                  hasUnsavedChanges
                    ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20 disabled:hover:bg-blue-600'
                } cursor-pointer disabled:cursor-not-allowed`}
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save size={18} strokeWidth={hasUnsavedChanges ? 2.5 : 2} className={hasUnsavedChanges ? 'animate-pulse' : ''} />
                )}
                {hasUnsavedChanges ? t('settings.profile.saveUnsaved') : t('settings.profile.save')}
              </button>
            </div>
          </form>
        </div>

        {/* Currency */}
        <div className="glass-card p-5 sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <DollarSign size={20} strokeWidth={2} />
            </div>
            {t('settings.currency.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
            {t('settings.currency.subtitle')}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {currencyOptions.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleCurrencyChange(id)}
                className={`flex items-center justify-center py-3 sm:py-4 px-2 rounded-2xl border-2 font-bold transition-colors duration-300 text-[13px] ${
                  currency === id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                } cursor-pointer disabled:cursor-not-allowed`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Appearance (Theme) Section */}
        <div className="glass-card p-5 sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Sun size={20} strokeWidth={2} className="dark:hidden" />
              <Moon size={20} strokeWidth={2} className="hidden dark:block" />
            </div>
            {t('settings.appearance.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
            {t('settings.appearance.subtitle')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {themeOptions.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex flex-row sm:flex-col items-center justify-start sm:justify-center p-4 rounded-2xl border-2 transition-all duration-300 ${
                  theme === id
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-transparent bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/10'
                } cursor-pointer disabled:cursor-not-allowed`}
              >
                <Icon size={24} strokeWidth={2} className="mr-4 sm:mr-0 sm:mb-2" />
                <span className="font-bold text-[13px]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Language Section */}
        <div className="glass-card p-5 sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <Globe size={20} strokeWidth={2} />
            </div>
            {t('settings.language.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
            {t('settings.language.subtitle')}
          </p>
          <DashboardLanguageSwitcher />
        </div>

        {/* Change Password Section */}
        <div className="glass-card p-5 sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
              <KeyRound size={20} strokeWidth={2} />
            </div>
            {t('settings.password.title')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-8">
            {t('settings.password.subtitle')}
          </p>

          {pwdError && (
            <div role="alert" className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold">
              {pwdError}
            </div>
          )}

          <form onSubmit={handlePwdSave} className="space-y-6 max-w-md">
            <div>
              <label htmlFor="settings-old-password" className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{t('settings.password.current')}</label>
              <div className="relative">
                <input
                  id="settings-old-password"
                  type={showPwd.old ? 'text' : 'password'}
                  required
                  value={pwdForm.oldPassword}
                  onChange={e => handlePwdChange('oldPassword', e.target.value)}
                  className="glass-input pr-14 md:pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => ({ ...p, old: !p.old }))}
                  aria-label={showPwd.old ? t('auth.password.hide') : t('auth.password.show')}
                  className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-3 md:p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  {showPwd.old ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="settings-new-password" className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{t('settings.password.new')}</label>
              <div className="relative">
                <input
                  id="settings-new-password"
                  type={showPwd.new ? 'text' : 'password'}
                  required
                  value={pwdForm.newPassword}
                  onChange={e => handlePwdChange('newPassword', e.target.value)}
                  className="glass-input pr-14 md:pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => ({ ...p, new: !p.new }))}
                  aria-label={showPwd.new ? t('auth.password.hide') : t('auth.password.show')}
                  className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-3 md:p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  {showPwd.new ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                </button>
              </div>

              {pwdForm.newPassword.length > 0 && (
                <div className="mt-2.5 space-y-2">
                  <div className="flex gap-1.5">
                    {[1, 2, 3].map((segment) => {
                      const strength = getPasswordStrength(pwdForm.newPassword);
                      let bgClass = 'bg-black/10 dark:bg-white/10';
                      if (strength >= segment) {
                        if (strength === 1) bgClass = 'bg-red-500';
                        else if (strength === 2) bgClass = 'bg-yellow-500';
                        else bgClass = 'bg-green-500';
                      }
                      return (
                        <div
                          key={segment}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${bgClass}`}
                        />
                      );
                    })}
                  </div>
                  <div className="space-y-1.5 px-1">
                    {[
                      { label: t('settings.password.req.length'), met: pwdForm.newPassword.length >= 8 },
                      { label: t('settings.password.req.uppercase'), met: /[A-Z]/.test(pwdForm.newPassword) },
                      { label: t('settings.password.req.digit'), met: /[0-9]/.test(pwdForm.newPassword) },
                    ].map((req, i) => (
                      <div key={i} className={`flex items-center gap-2 text-[11px] font-medium transition-colors duration-300 ${req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        <div className={`p-0.5 rounded-full ${req.met ? 'bg-green-100 dark:bg-green-500/20' : 'bg-transparent'}`}>
                          {req.met ? <Check size={10} strokeWidth={4} /> : <X size={10} strokeWidth={3} className="opacity-50" />}
                        </div>
                        <span>{req.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="settings-confirm-password" className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 mb-2 block">{t('settings.password.confirm')}</label>
              <div className="relative">
                <input
                  id="settings-confirm-password"
                  type={showPwd.confirm ? 'text' : 'password'}
                  required
                  value={pwdForm.confirmPassword}
                  onChange={e => handlePwdChange('confirmPassword', e.target.value)}
                  className="glass-input pr-14 md:pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(p => ({ ...p, confirm: !p.confirm }))}
                  aria-label={showPwd.confirm ? t('auth.password.hide') : t('auth.password.show')}
                  className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 p-3 md:p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  {showPwd.confirm ? <EyeOff size={16} strokeWidth={2.5} /> : <Eye size={16} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingPwd || !pwdForm.oldPassword || !pwdForm.newPassword || pwdForm.newPassword !== pwdForm.confirmPassword}
              className="w-full sm:w-auto px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold transition-all duration-300 shadow-md active:scale-95 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
              {savingPwd ? t('settings.password.submitting') : t('settings.password.submit')}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-[2rem] p-5 sm:p-8 md:p-10">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-center">
              <Trash2 size={20} strokeWidth={2} />
            </div>
            {t('settings.danger.title')}
          </h2>
          <p className="text-red-500/80 font-medium mb-8">
            {t('settings.danger.description')}
          </p>
          <button
            onClick={handleClear}
            className="w-full sm:w-auto px-6 py-3 border-2 border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-colors duration-300 shadow-sm shadow-red-500/10 active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            {t('settings.danger.button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
