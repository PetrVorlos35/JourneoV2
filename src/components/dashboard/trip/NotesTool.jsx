import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, Globe, Plus, StickyNote, Trash2 } from 'lucide-react';

const isUrl = (s) => /^https?:\/\//i.test(s.trim());
const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
};

const DeleteButton = ({ onClick, label }) => (
  <button
    onClick={onClick}
    aria-label={label}
    className="w-9 h-9 shrink-0 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-danger-wash opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100 transition-all cursor-pointer"
  >
    <Trash2 size={16} strokeWidth={2} />
  </button>
);

const NotesTool = ({ documents, isViewer, onAdd, onDelete }) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const links = documents.filter((d) => isUrl(d.content));
  const notes = documents.filter((d) => !isUrl(d.content));
  const deleteLabel = t('tripDetail.documents.delete.title');

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onAdd(title.trim(), content.trim());
    setTitle('');
    setContent('');
  };

  const fieldClass = 'w-full px-4 rounded-2xl bg-white dark:bg-white/5 border border-default text-base sm:text-[15px] font-medium text-primary placeholder:text-gray-500 focus:outline-none focus:border-blue-500/40 focus:ring-2 focus:ring-blue-500/20 transition-colors';

  return (
    <div className="max-w-2xl">
      {!isViewer && (
        <form onSubmit={submit} className="mb-8 p-3 sm:p-4 rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] space-y-2">
          <label htmlFor="doc-title" className="sr-only">{t('tripDetail.notebook.composerTitle')}</label>
          <input
            id="doc-title"
            value={title}
            maxLength={255}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('tripDetail.notebook.composerTitle')}
            className={`${fieldClass} h-12`}
          />
          <label htmlFor="doc-content" className="sr-only">{t('tripDetail.notebook.composerContent')}</label>
          <textarea
            id="doc-content"
            value={content}
            maxLength={2000}
            rows={2}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('tripDetail.notebook.composerContent')}
            className={`${fieldClass} py-3 resize-y min-h-[3rem]`}
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!title.trim() || !content.trim()}
              className="h-11 px-5 flex items-center gap-2 rounded-2xl bg-accent text-white text-[14px] font-semibold hover:bg-accent-hover disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-white/5 dark:disabled:text-gray-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <Plus size={17} strokeWidth={2.5} /> {t('tripDetail.notebook.add')}
            </button>
          </div>
        </form>
      )}

      {documents.length === 0 && (
        <p className="py-10 text-center text-[15px] font-medium text-muted max-w-sm mx-auto">
          {t('tripDetail.notebook.notesEmpty')}
        </p>
      )}

      {links.length > 0 && (
        <section className="mb-8">
          <h3 className="text-[13px] font-semibold text-muted mb-1">
            {t('tripDetail.notebook.links')} <span className="tabular-nums">· {links.length}</span>
          </h3>
          <ul>
            {links.map((doc) => (
              <li key={doc.id} className="group flex items-center gap-2 border-b border-gray-100 dark:border-white/[0.06] last:border-b-0">
                <a
                  href={doc.content.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 flex items-center gap-3.5 py-3 -ml-2 pl-2 pr-2 rounded-2xl hover:bg-field transition-colors"
                >
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-active text-accent flex items-center justify-center">
                    <Globe size={18} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-primary truncate">{doc.title}</span>
                    <span className="block text-[13px] font-medium text-muted truncate">{hostOf(doc.content.trim())}</span>
                  </span>
                  <ArrowUpRight size={18} strokeWidth={2} className="shrink-0 text-gray-300 group-hover:text-accent dark:text-gray-600 transition-colors" aria-hidden="true" />
                </a>
                {!isViewer && <DeleteButton onClick={() => onDelete(doc.id)} label={deleteLabel} />}
              </li>
            ))}
          </ul>
        </section>
      )}

      {notes.length > 0 && (
        <section>
          <h3 className="text-[13px] font-semibold text-muted mb-1">
            {t('tripDetail.notebook.notes')} <span className="tabular-nums">· {notes.length}</span>
          </h3>
          <ul>
            {notes.map((doc) => (
              <li key={doc.id} className="group flex items-start gap-3.5 py-3.5 border-b border-gray-100 dark:border-white/[0.06] last:border-b-0">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <StickyNote size={18} strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-[15px] font-semibold text-primary">{doc.title}</p>
                  <p className="mt-0.5 text-[14px] leading-relaxed text-secondary whitespace-pre-wrap break-words">{doc.content}</p>
                </div>
                {!isViewer && <DeleteButton onClick={() => onDelete(doc.id)} label={deleteLabel} />}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default NotesTool;
