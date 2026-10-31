import { Component } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCw } from 'lucide-react';
import { reportClientError } from '../../utils/errorReporting';

// Po nasazení nové verze může starý tab chtít kousek JS, který už na serveru
// není. Jednou stránku obnovíme sami, místo abychom ukázali chybu.
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk \d+ failed/i;
const RELOAD_KEY = 'journeo_chunk_reload';

const Fallback = () => {
  const { t } = useTranslation();
  return (
    <div role="alert" className="min-h-[100dvh] flex items-center justify-center px-6 bg-desk">
      <div className="max-w-sm text-center">
        <h1 className="text-[28px] font-bold tracking-tight text-primary">{t('errorBoundary.title')}</h1>
        <p className="mt-3 text-[15px] font-medium text-secondary">{t('errorBoundary.description')}</p>
        <div className="mt-7 flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-accent hover:bg-accent-hover text-white font-semibold transition-colors cursor-pointer"
          >
            <RotateCw size={16} strokeWidth={2.5} aria-hidden="true" />
            {t('errorBoundary.reload')}
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-subtle hover:bg-recess text-primary font-semibold transition-colors"
          >
            {t('errorBoundary.home')}
          </a>
        </div>
      </div>
    </div>
  );
};

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (CHUNK_ERROR.test(error?.message || '')) {
      let reloaded = false;
      try { reloaded = sessionStorage.getItem(RELOAD_KEY) === '1'; } catch { /* ignore */ }
      if (!reloaded) {
        try { sessionStorage.setItem(RELOAD_KEY, '1'); } catch { /* ignore */ }
        window.location.reload();
        return;
      }
    }
    reportClientError(error, { componentStack: info?.componentStack });
  }

  render() {
    return this.state.hasError ? <Fallback /> : this.props.children;
  }
}
