import { Sun, Moon, Monitor, Eye, EyeOff, Check, Circle, AlertCircle, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDialog } from '../ui/DialogModal';
import UserAvatar from '../ui/UserAvatar';
import { Group, Row } from '../ui/GroupedList';
import { avatarPresets } from '../ui/avatarPresets';
import api from '../../services/api';

// Nastavení = pas (kdo jsem) + tiché skupiny řádků (vyrovnání, předvolby,
// účet). Profil se ukládá sám, stejně jako plán v zápisníku.

const PROFILE_SAVE_DELAY = 900;
const EASE_OUT = [0.16, 1, 0.3, 1];

const profileFromUser = (user) => ({
  first_name: user?.first_name || '',
  last_name: user?.last_name || '',
  avatar_url: user?.avatar_url || '',
  bio: user?.bio || '',
  bank_account: user?.bank_account || '',
});

const getPasswordChecks = (password) => [
  { key: 'length', met: password.length >= 8 },
  { key: 'uppercase', met: /[A-Z]/.test(password) },
  { key: 'digit', met: /[0-9]/.test(password) },
];

const SaveStatus = ({ state, onRetry, t }) => (
  <div role="status" aria-live="polite" className="min-h-6 text-[13px] font-semibold">
    {state === 'error' ? (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 text-danger hover:underline underline-offset-2 cursor-pointer"
      >
        <AlertCircle size={14} strokeWidth={2.5} aria-hidden="true" /> {t('settings.status.error')}
      </button>
    ) : state === 'pending' || state === 'saving' ? (
      <span className="inline-flex items-center gap-1.5 text-muted">
        <Loader2 size={13} strokeWidth={2.5} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
        {t('settings.status.saving')}
      </span>
    ) : state === 'saved' ? (
      <span className="inline-flex items-center gap-1.5 text-muted">
        <Check size={14} strokeWidth={2.5} className="text-success" aria-hidden="true" />
        {t('settings.status.saved')}
      </span>
    ) : null}
  </div>
);

// Počítadlo se ukáže až u limitu — „4 / 100“ u jména nikoho nezajímá.
const CharsLeft = ({ value, max, t }) => {
  const left = max - value.length;
  if (value.length < max * 0.8) return null;
  return (
    <p aria-live="polite" className={`mt-1 text-[12px] font-medium tabular-nums ${left <= max * 0.05 ? 'text-danger' : 'text-secondary'}`}>
      {t('settings.profile.charsLeft', { count: left })}
    </p>
  );
};

// Radio skupina jako segmentový přepínač; šipky přesouvají fokus,
// mezerník / Enter vybírá (výběr měny otevírá dialog, proto ne „select on focus“).
const Segmented = ({ labelledBy, value, options, onChange }) => {
  const refs = useRef([]);
  const handleKeyDown = (e, index) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    refs.current[(index + step + options.length) % options.length]?.focus();
  };
  return (
    <div
      role="radiogroup"
      aria-labelledby={labelledBy}
      className="grid grid-flow-col auto-cols-fr gap-1 p-1 rounded-soft bg-recess w-full sm:w-auto"
    >
      {options.map(({ id, label, Icon }, index) => {
        const checked = id === value;
        return (
          <button
            key={id}
            ref={(el) => { refs.current[index] = el; }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            onClick={() => onChange(id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={`inline-flex items-center justify-center gap-1.5 h-11 sm:h-9 px-3 rounded-control text-[14px] sm:text-[13px] font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
              checked
                ? 'bg-page dark:bg-white/[0.16] text-primary shadow-[0_1px_2px_rgba(17,24,39,0.08),0_2px_8px_-4px_rgba(17,24,39,0.12)]'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {Icon && <Icon size={15} strokeWidth={2.25} className="hidden sm:block shrink-0" aria-hidden="true" />}
            {label}
          </button>
        );
      })}
    </div>
  );
};

const fieldClass =
  'w-full rounded-control bg-page border border-default px-3.5 text-primary placeholder:text-placeholder transition-[background-color,border-color,box-shadow] duration-200 hover:border-strong focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/25';

const secondaryButtonClass =
  'inline-flex items-center justify-center w-full sm:w-auto h-11 sm:h-10 px-4 rounded-soft bg-subtle hover:bg-recess text-primary text-[14px] font-semibold transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60';

const PasswordField = ({ id, label, value, onChange, autoComplete, autoFocus, invalid, describedBy, t }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="block mb-1.5 text-[13px] font-semibold text-secondary">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={`${fieldClass} h-12 pr-12 bg-field focus:bg-page text-base sm:text-[15px] font-medium`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('auth.password.hide') : t('auth.password.show')}
          className="absolute right-0.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-control text-icon-muted hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
        >
          {visible ? <EyeOff size={16} strokeWidth={2.25} /> : <Eye size={16} strokeWidth={2.25} />}
        </button>
      </div>
    </div>
  );
};

const Settings = ({ onConvertCurrency }) => {
  const { currency, setCurrency } = useCurrency();
  const { theme, setTheme } = useTheme();
  const { user, updateProfile, changePassword, deleteAccount, logout } = useAuth();
  const navigate = useNavigate();
  const { promptDialog, confirmDialog, ModalPortal } = useDialog();
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const ids = { first: useId(), last: useId(), bio: useId(), bank: useId(), bankHint: useId(), avatar: useId(), currency: useId(), theme: useId(), language: useId(), pwdError: useId(), pwdReqs: useId() };

  // ── Profil s automatickým ukládáním ──────────────────────────
  const [profileForm, setProfileForm] = useState(() => profileFromUser(user));
  const [saveState, setSaveState] = useState('idle'); // idle | pending | saving | saved | error
  const formRef = useRef(profileForm);
  const dirtyRef = useRef(false);
  const timerRef = useRef(null);

  // Uživatel může dorazit až po prvním renderu — převezmi ho, dokud nikdo nepsal.
  useEffect(() => {
    if (dirtyRef.current) return;
    const next = profileFromUser(user);
    formRef.current = next;
    setProfileForm(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const flushSave = useCallback(async () => {
    clearTimeout(timerRef.current);
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    setSaveState('saving');
    try {
      await updateProfile(formRef.current);
      setSaveState(dirtyRef.current ? 'pending' : 'saved');
    } catch {
      dirtyRef.current = true;
      setSaveState('error');
      toast.error(t('settings.profile.saveError'), { id: 'settings-profile-save' });
    }
  }, [updateProfile, t]);

  // Rozepsané změny se uloží i při odchodu ze stránky.
  const flushRef = useRef(flushSave);
  flushRef.current = flushSave;
  useEffect(() => () => { flushRef.current(); }, []);

  const handleProfileChange = (field, value) => {
    const next = { ...formRef.current, [field]: value };
    formRef.current = next;
    setProfileForm(next);
    dirtyRef.current = true;
    setSaveState('pending');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => flushRef.current(), field === 'avatar_url' ? 0 : PROFILE_SAVE_DELAY);
  };

  const avatarOptions = [
    { id: '', Icon: null },
    ...Object.entries(avatarPresets).map(([id, Icon]) => ({ id, Icon })),
  ];
  const avatarRefs = useRef([]);
  const handleAvatarKeyDown = (e, index) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const nextIndex = (index + step + avatarOptions.length) % avatarOptions.length;
    avatarRefs.current[nextIndex]?.focus();
    handleProfileChange('avatar_url', avatarOptions[nextIndex].id);
  };
  const initials = (() => {
    const first = profileForm.first_name.trim();
    const last = profileForm.last_name.trim();
    if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
    if (first) return first[0].toUpperCase();
    return (user?.email || '??').slice(0, 2).toUpperCase();
  })();

  // ── Předvolby ────────────────────────────────────────────────
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

  const language = i18n.language?.slice(0, 2) || 'cs';
  const handleLanguageChange = async (code) => {
    if (code === language) return;
    i18n.changeLanguage(code);
    localStorage.setItem('journeo_lang', code);
    try {
      await api.settings.update({ language: code });
    } catch {
      // Language is already changed locally; DB sync is best-effort
    }
  };

  const currencyOptions = [
    { id: 'CZK', label: 'Kč' },
    { id: 'EUR', label: '€' },
    { id: 'USD', label: '$' },
    { id: 'GBP', label: '£' },
  ].map((o) => ({ ...o, label: `${o.id} ${o.label}` }));

  const themeOptions = [
    { id: 'light', label: t('settings.theme.light'), Icon: Sun },
    { id: 'dark', label: t('settings.theme.dark'), Icon: Moon },
    { id: 'system', label: t('settings.theme.system'), Icon: Monitor },
  ];

  const languageOptions = [
    { id: 'cs', label: t('settings.language.cs') },
    { id: 'en', label: t('settings.language.en') },
  ];

  // ── Heslo ────────────────────────────────────────────────────
  const emptyPwd = { oldPassword: '', newPassword: '', confirmPassword: '' };
  const [pwdOpen, setPwdOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState(emptyPwd);
  const [pwdError, setPwdError] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const pwdChecks = getPasswordChecks(pwdForm.newPassword);
  const pwdMismatch = pwdForm.confirmPassword.length > 0 && pwdForm.newPassword !== pwdForm.confirmPassword;

  const handlePwdChange = (field, value) => {
    setPwdForm((prev) => ({ ...prev, [field]: value }));
    setPwdError('');
  };

  const closePassword = () => {
    setPwdOpen(false);
    setPwdForm(emptyPwd);
    setPwdError('');
  };

  const handlePwdSave = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdError(t('settings.password.mismatch'));
      return;
    }
    if (!pwdChecks.every((c) => c.met)) {
      setPwdError(t('settings.password.weak'));
      return;
    }
    setSavingPwd(true);
    try {
      const res = await changePassword(pwdForm.oldPassword, pwdForm.newPassword);
      toast.success(res.message || t('auth.toasts.resetSuccess'));
      closePassword();
    } catch (err) {
      setPwdError(err.message || t('auth.errors.resetError'));
    } finally {
      setSavingPwd(false);
    }
  };

  // ── Účet ─────────────────────────────────────────────────────
  const handleLogout = async () => {
    await flushRef.current();
    const ok = await confirmDialog({
      title: t('dashboardLayout.dialogs.logout.title'),
      message: t('dashboardLayout.dialogs.logout.message'),
      variant: 'danger',
      confirmLabel: t('dashboardLayout.dialogs.logout.confirm'),
    });
    if (!ok) return;
    logout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    const value = await promptDialog({
      title: t('settings.delete.confirmTitle'),
      message: t('settings.delete.confirmMessage'),
      inputLabel: t('settings.delete.confirmLabel'),
      placeholder: user.email,
      requiredPhrase: user.email,
      variant: 'danger',
      confirmLabel: t('settings.delete.confirmBtn'),
    });

    if (value !== user.email) return;

    try {
      await deleteAccount(value);
      toast.success(t('settings.delete.successMessage'));
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err.message || t('settings.delete.error'));
    }
  };

  const previewUser = { ...user, ...profileForm };

  return (
    <div className="w-full max-w-6xl pb-16">
      {ModalPortal}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8 xl:gap-10 lg:items-start">
        <div className="lg:sticky lg:top-0 lg:z-10">
        <header className="flex items-end justify-between gap-4 mb-8 sm:mb-10">
          <h1 className="text-3xl sm:text-4xl text-primary tracking-tight font-bold" style={{ textWrap: 'balance' }}>
            {t('settings.title')}
          </h1>
          <SaveStatus state={saveState} onRetry={flushSave} t={t} />
        </header>
        {/* Pas — stejný blok jako v sidebaru, tady se do něj píše */}
        <section aria-labelledby="settings-passport" className="bg-passport border border-default rounded-page shadow-card p-5 sm:p-8">
          <div className="mb-6">
            <h2 id="settings-passport" className="text-[20px] font-bold tracking-tight text-primary">{t('settings.profile.title')}</h2>
            <p className="mt-0.5 text-[13px] font-medium text-muted">{t('settings.profile.description')}</p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-6 sm:gap-8 lg:gap-6">
            <div className="flex sm:block lg:flex justify-center lg:justify-start">
              <UserAvatar user={previewUser} size="xl" />
            </div>

            <div className="flex-1 min-w-0 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={ids.first} className="block mb-1 text-[12px] font-medium text-muted">{t('settings.profile.firstName')}</label>
                  <input
                    id={ids.first}
                    type="text"
                    maxLength={100}
                    autoComplete="given-name"
                    placeholder={t('settings.profile.firstNamePlaceholder')}
                    value={profileForm.first_name}
                    onChange={(e) => handleProfileChange('first_name', e.target.value)}
                    onBlur={flushSave}
                    className={`${fieldClass} h-12 text-[17px] font-bold tracking-tight`}
                  />
                  <CharsLeft value={profileForm.first_name} max={100} t={t} />
                </div>
                <div>
                  <label htmlFor={ids.last} className="block mb-1 text-[12px] font-medium text-muted">{t('settings.profile.lastName')}</label>
                  <input
                    id={ids.last}
                    type="text"
                    maxLength={100}
                    autoComplete="family-name"
                    placeholder={t('settings.profile.lastNamePlaceholder')}
                    value={profileForm.last_name}
                    onChange={(e) => handleProfileChange('last_name', e.target.value)}
                    onBlur={flushSave}
                    className={`${fieldClass} h-12 text-[17px] font-bold tracking-tight`}
                  />
                  <CharsLeft value={profileForm.last_name} max={100} t={t} />
                </div>
              </div>
              <div>
                <label htmlFor={ids.bio} className="block mb-1 text-[12px] font-medium text-muted">{t('settings.profile.bio')}</label>
                <textarea
                  id={ids.bio}
                  rows={2}
                  maxLength={300}
                  placeholder={t('settings.profile.bioPlaceholder')}
                  value={profileForm.bio}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  onBlur={flushSave}
                  className={`${fieldClass} py-3 resize-none text-base sm:text-[15px] font-medium leading-relaxed`}
                />
                <CharsLeft value={profileForm.bio} max={300} t={t} />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-dashed border-strong">
            <p id={ids.avatar} className="mb-3 text-[12px] font-medium text-muted">{t('settings.profile.avatarLabel')}</p>
            <div role="radiogroup" aria-labelledby={ids.avatar} className="flex flex-wrap gap-2.5">
              {avatarOptions.map(({ id, Icon }, index) => {
                const checked = profileForm.avatar_url === id;
                return (
                  <button
                    key={id || 'initials'}
                    ref={(el) => { avatarRefs.current[index] = el; }}
                    type="button"
                    role="radio"
                    aria-checked={checked}
                    aria-label={t(`settings.profile.avatars.${id || 'none'}`)}
                    title={t(`settings.profile.avatars.${id || 'none'}`)}
                    tabIndex={checked ? 0 : -1}
                    onClick={() => handleProfileChange('avatar_url', id)}
                    onKeyDown={(e) => handleAvatarKeyDown(e, index)}
                    className={`w-11 h-11 rounded-full border-2 flex items-center justify-center transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 ${
                      checked
                        ? 'border-focus bg-active text-active'
                        : 'border-default bg-page text-secondary hover:text-primary hover:border-strong'
                    }`}
                  >
                    {Icon
                      ? <Icon size={19} strokeWidth={2} aria-hidden="true" />
                      : <span className="text-[13px] font-bold" aria-hidden="true">{initials}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
        </div>

        <div className="space-y-10 lg:pt-20">
        <Group title={t('settings.settle.title')}>
          <Row
            title={t('settings.settle.bankAccount')}
            htmlFor={ids.bank}
            hint={t('settings.settle.bankAccountHint')}
            hintId={ids.bankHint}
          >
            <input
              id={ids.bank}
              type="text"
              inputMode="text"
              autoComplete="off"
              spellCheck={false}
              maxLength={64}
              placeholder={t('settings.settle.bankAccountPlaceholder')}
              aria-describedby={ids.bankHint}
              value={profileForm.bank_account}
              onChange={(e) => handleProfileChange('bank_account', e.target.value)}
              onBlur={flushSave}
              className={`${fieldClass} h-11 sm:w-72 bg-field focus:bg-page text-base sm:text-[15px] font-medium tabular-nums`}
            />
          </Row>
        </Group>

        <Group title={t('settings.preferences.title')}>
          <Row title={t('settings.currency.title')} titleId={ids.currency} hint={t('settings.currency.subtitle')}>
            <Segmented labelledBy={ids.currency} value={currency} options={currencyOptions} onChange={handleCurrencyChange} />
          </Row>
          <Row title={t('settings.appearance.title')} titleId={ids.theme} hint={t('settings.appearance.subtitle')}>
            <Segmented labelledBy={ids.theme} value={theme} options={themeOptions} onChange={setTheme} />
          </Row>
          <Row title={t('settings.language.title')} titleId={ids.language} hint={t('settings.language.subtitle')}>
            <Segmented labelledBy={ids.language} value={language} options={languageOptions} onChange={handleLanguageChange} />
          </Row>
        </Group>

        <Group title={t('settings.account.title')}>
          <Row title={t('settings.account.email')} hint={t('settings.account.emailHint')}>
            <p className="text-[15px] font-medium text-primary break-all sm:text-right">{user?.email}</p>
          </Row>

          <div>
            <Row title={t('settings.password.title')} hint={t('settings.password.subtitle')}>
              {!pwdOpen && (
                <button type="button" onClick={() => setPwdOpen(true)} aria-expanded={false} className={secondaryButtonClass}>
                  {t('settings.password.open')}
                </button>
              )}
            </Row>
            <AnimatePresence initial={false}>
              {pwdOpen && (
                <motion.div
                  key="password-form"
                  initial={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  animate={reduceMotion ? { opacity: 1 } : { height: 'auto', opacity: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0.12 : 0.32, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <form onSubmit={handlePwdSave} className="px-5 sm:px-6 pb-6 max-w-md space-y-4">
                    <PasswordField
                      id="settings-old-password"
                      label={t('settings.password.current')}
                      value={pwdForm.oldPassword}
                      onChange={(v) => handlePwdChange('oldPassword', v)}
                      autoComplete="current-password"
                      autoFocus
                      t={t}
                    />
                    <div>
                      <PasswordField
                        id="settings-new-password"
                        label={t('settings.password.new')}
                        value={pwdForm.newPassword}
                        onChange={(v) => handlePwdChange('newPassword', v)}
                        autoComplete="new-password"
                        describedBy={ids.pwdReqs}
                        t={t}
                      />
                      <ul id={ids.pwdReqs} aria-live="polite" className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                        {pwdChecks.map(({ key, met }) => (
                          <li key={key} className={`inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors duration-200 ${met ? 'text-success' : 'text-secondary'}`}>
                            {met
                              ? <Check size={13} strokeWidth={3} aria-hidden="true" />
                              : <Circle size={11} strokeWidth={2.5} aria-hidden="true" />}
                            {t(`settings.password.req.${key}`)}
                            <span className="sr-only">: {t(met ? 'settings.password.reqMet' : 'settings.password.reqUnmet')}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <PasswordField
                      id="settings-confirm-password"
                      label={t('settings.password.confirm')}
                      value={pwdForm.confirmPassword}
                      onChange={(v) => handlePwdChange('confirmPassword', v)}
                      autoComplete="new-password"
                      invalid={pwdMismatch || Boolean(pwdError)}
                      describedBy={pwdError || pwdMismatch ? ids.pwdError : undefined}
                      t={t}
                    />

                    {(pwdError || pwdMismatch) && (
                      <p id={ids.pwdError} role="alert" className="flex items-start gap-1.5 text-[13px] font-semibold text-danger">
                        <AlertCircle size={15} strokeWidth={2.5} className="mt-px shrink-0" aria-hidden="true" />
                        {pwdError || t('settings.password.mismatch')}
                      </p>
                    )}

                    <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                      <button
                        type="button"
                        onClick={closePassword}
                        className="h-11 px-4 rounded-soft text-[14px] font-semibold text-secondary hover:text-primary hover:bg-subtle transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                      >
                        {t('settings.password.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={savingPwd || !pwdForm.oldPassword || !pwdForm.newPassword || !pwdForm.confirmPassword}
                        className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-soft bg-accent hover:bg-accent-hover text-on-accent text-[14px] font-semibold shadow-glow transition-colors cursor-pointer disabled:bg-disabled disabled:text-disabled disabled:shadow-none disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2"
                      >
                        {savingPwd && <Loader2 size={15} strokeWidth={2.5} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
                        {savingPwd ? t('settings.password.submitting') : t('settings.password.submit')}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Row title={t('settings.account.logout')} hint={t('settings.account.logoutHint')}>
            <button type="button" onClick={handleLogout} className={secondaryButtonClass}>
              {t('settings.account.logout')}
            </button>
          </Row>

          <Row title={t('settings.delete.title')} hint={t('settings.delete.description')} align="start">
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="inline-flex items-center justify-center w-full sm:w-auto h-11 sm:h-10 px-4 rounded-soft border border-danger text-danger hover:bg-danger hover:text-on-accent text-[14px] font-semibold whitespace-nowrap transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
            >
              {t('settings.delete.button')}
            </button>
          </Row>
        </Group>
        </div>
      </div>
    </div>
  );
};

export default Settings;
