import {
  Home, Map, MapPinned, BarChart2, Users, Wallet, Settings, Trash2, Shield,
  Plus, LogOut, Sun, Moon, Monitor, CalendarDays, Receipt, Backpack,
  StickyNote, MapPin, UserRound, Languages,
} from 'lucide-react';
import { format } from 'date-fns';
import { normalize } from '../../utils/fuzzy';
import { categoryLabelKey } from '../map/placeConfig';
import { categorizeTrip } from '../../utils/trip';
import { formatCurrencyShort } from '../../utils/currency';
import { countryFlag } from '../../utils/country';

// Pořadí skupin ve výsledcích, když mají stejné skóre. Obsah uživatele
// (výlety, místa, …) je nad navigací — tu má člověk v sidebaru.
export const GROUP_ORDER = [
  'trip', 'day', 'place', 'expense', 'packing', 'document', 'friend', 'page', 'action',
];

// Barva dlaždice s ikonou podle typu — výsledky jdou tak rozeznat
// periferním viděním, ne až přečtením řádku.
export const TYPE_STYLES = {
  trip:     'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
  day:      'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
  place:    'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  expense:  'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  packing:  'bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400',
  document: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400',
  friend:   'bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/10 dark:text-fuchsia-400',
  page:     'bg-gray-100 text-gray-600 dark:bg-white/[0.07] dark:text-gray-300',
  action:   'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
};

// Váhy prohledávaných polí: název rozhoduje, podtitul a klíčová slova
// jen pomáhají. Zvýrazňuje se pouze název.
const fieldsOf = ({ title, subtitle, keywords }) => [
  { norm: normalize(title), weight: 1, highlight: true },
  { norm: normalize(subtitle), weight: 0.55 },
  { norm: normalize(keywords), weight: 0.42 },
];

/** Doplní položce předpočítaná pole pro fuzzy hledání. */
const item = (data) => ({ ...data, fields: fieldsOf(data) });

const clean = (value) => String(value ?? '').trim();

// Den má vlastní řádek, jen když do něj někdo něco napsal: vlastní název,
// nebo plán. Prázdné dny se totiž ukládají s výplňovým názvem "Den 3" a
// často i s lokací dotaženou z importu — a ta bývá u všech dnů stejná, takže
// by paleta vracela devět k nerozeznání stejných řádků. Naplánovaný den se
// tu měří stejně jako v kartě připravenosti: podle vyplněného plánu.
const isBlankDay = (activity, index) => {
  const title = clean(activity?.title);
  const filler = !title || title === `Den ${index + 1}` || title === `Day ${index + 1}`;
  return filler && !clean(activity?.plan);
};

/**
 * Sestaví index pro Spotlight ze všeho, co má uživatel po ruce.
 *
 * Výlety chodí jako prop z dashboardu (jsou načtené tak jako tak), přátelé
 * a místa se dotahují až při prvním otevření palety — viz Spotlight.jsx.
 */
export const buildItems = ({
  trips = [],
  places = [],
  friends = [],
  t,
  dateLocale,
  locale = 'cs',
  currency = 'CZK',
  isAdmin = false,
  actions = {},
}) => {
  const items = [];
  const fmt = (date) => {
    try {
      return format(new Date(date), 'd. M. yyyy', { locale: dateLocale });
    } catch {
      return '';
    }
  };

  // ── Stránky ──────────────────────────────────────────────
  const pages = [
    { icon: Home,      label: t('dashboardLayout.nav.overview'),   to: '/dashboard',            keywords: 'dashboard prehled home uvod overview' },
    { icon: Map,       label: t('dashboardLayout.nav.myTrips'),    to: '/dashboard/all-trips',  keywords: 'vylety cesty trips seznam all' },
    { icon: MapPinned, label: t('dashboardLayout.nav.map'),        to: '/dashboard/map',        keywords: 'mapa mista map places pins' },
    { icon: BarChart2, label: t('dashboardLayout.nav.statistics'), to: '/dashboard/statistics', keywords: 'statistiky grafy analytics prehledy' },
    { icon: Users,     label: t('dashboardLayout.nav.friends'),    to: '/dashboard/friends',    keywords: 'pratele kamaradi friends kontakty' },
    { icon: Wallet,    label: t('dashboardLayout.nav.budget'),     to: '/dashboard/budget',     keywords: 'vydaje rozpocet budget penize utraty' },
    { icon: Settings,  label: t('dashboardLayout.nav.settings'),   to: '/dashboard/settings',   keywords: 'nastaveni profil ucet mena jazyk settings' },
    { icon: Trash2,    label: t('spotlight.pages.trash'),          to: '/dashboard/trash',      keywords: 'kos smazane obnovit trash bin' },
    ...(isAdmin ? [{ icon: Shield, label: t('dashboardLayout.nav.admin'), to: '/admin', keywords: 'admin sprava panel users' }] : []),
  ];
  for (const page of pages) {
    items.push(item({
      id: `page:${page.to}`,
      type: 'page',
      icon: page.icon,
      title: page.label,
      subtitle: t('spotlight.groups.page'),
      keywords: page.keywords,
      to: page.to,
    }));
  }

  // ── Akce ─────────────────────────────────────────────────
  const actionDefs = [
    { id: 'create-trip', icon: Plus, label: t('dashboardLayout.nav.createTrip'), keywords: 'novy vylet pridat create new trip zalozit', run: actions.createTrip, shortcut: 'N' },
    { id: 'theme-light', icon: Sun, label: t('spotlight.actions.themeLight'), keywords: 'svetly rezim vzhled theme light svetlo', run: () => actions.setTheme?.('light') },
    { id: 'theme-dark', icon: Moon, label: t('spotlight.actions.themeDark'), keywords: 'tmavy rezim vzhled theme dark noc', run: () => actions.setTheme?.('dark') },
    { id: 'theme-system', icon: Monitor, label: t('spotlight.actions.themeSystem'), keywords: 'systemovy rezim vzhled theme system auto', run: () => actions.setTheme?.('system') },
    { id: 'language', icon: Languages, label: t('spotlight.actions.language'), keywords: 'jazyk cestina english language prepnout', run: actions.toggleLanguage },
    { id: 'logout', icon: LogOut, label: t('dashboardLayout.dialogs.logout.confirm'), keywords: 'odhlasit odhlaseni logout sign out konec', run: actions.logout },
  ];
  for (const action of actionDefs) {
    if (!action.run) continue;
    items.push(item({
      id: `action:${action.id}`,
      type: 'action',
      icon: action.icon,
      title: action.label,
      subtitle: t('spotlight.groups.action'),
      keywords: action.keywords,
      shortcut: action.shortcut,
      run: action.run,
    }));
  }

  // ── Výlety a všechno v nich ──────────────────────────────
  for (const trip of trips) {
    const range = `${fmt(trip.startDate)} – ${fmt(trip.endDate)}`;
    const phase = categorizeTrip(trip);

    items.push(item({
      id: `trip:${trip.id}`,
      type: 'trip',
      icon: Map,
      title: trip.title,
      subtitle: range,
      meta: t(`spotlight.phase.${phase}`),
      phase,
      keywords: `vylet trip cesta ${phase} ${trip.startDate} ${trip.endDate}`,
      to: `/dashboard/trip/${trip.id}?from=all`,
    }));

    (trip.activities || []).forEach((activity, index) => {
      if (isBlankDay(activity, index)) return;
      const label = clean(activity.title) || `${t('spotlight.day')} ${index + 1}`;
      items.push(item({
        id: `day:${trip.id}:${index}`,
        type: 'day',
        icon: CalendarDays,
        title: label,
        subtitle: [trip.title, clean(activity.location)].filter(Boolean).join(' · '),
        meta: `${t('spotlight.day')} ${index + 1}`,
        keywords: `${clean(activity.plan)} ${clean(activity.location)} program itinerar plan`,
        // ?day= je 1-based, ať odkaz odpovídá tomu, co je vidět v UI
        to: `/dashboard/trip/${trip.id}?day=${index + 1}`,
      }));
    });

    (trip.expenses || []).forEach((expense) => {
      const label = clean(expense.description);
      if (!label) return;
      items.push(item({
        id: `expense:${trip.id}:${expense.id}`,
        type: 'expense',
        icon: Receipt,
        title: label,
        subtitle: [trip.title, t(`budget.categories.${expense.category}`, expense.category)].filter(Boolean).join(' · '),
        meta: formatCurrencyShort(expense.amount, currency, locale),
        keywords: `vydaj utrata expense ${expense.category} ${expense.amount}`,
        to: `/dashboard/trip/${trip.id}?view=budget`,
      }));
    });

    (trip.packingList || []).forEach((entry) => {
      const label = clean(entry.text);
      if (!label) return;
      items.push(item({
        id: `packing:${trip.id}:${entry.id}`,
        type: 'packing',
        icon: Backpack,
        title: label,
        subtitle: trip.title,
        meta: entry.checked ? t('spotlight.packed') : null,
        keywords: 'baleni packing seznam zavazadlo vzit s sebou',
        to: `/dashboard/trip/${trip.id}?view=packing`,
      }));
    });

    (trip.documents || []).forEach((doc) => {
      const label = clean(doc.title);
      if (!label) return;
      items.push(item({
        id: `document:${trip.id}:${doc.id}`,
        type: 'document',
        icon: StickyNote,
        title: label,
        subtitle: trip.title,
        // Obsah poznámky je vyhledatelný, ale nezobrazuje se — jinak by
        // řádek přetekl a dlouhé dokumenty by přebily názvy.
        keywords: `poznamka dokument note ${clean(doc.content).slice(0, 400)}`,
        to: `/dashboard/trip/${trip.id}?view=documents`,
      }));
    });
  }

  // ── Místa na mapě ────────────────────────────────────────
  for (const place of places) {
    items.push(item({
      id: `place:${place.id}`,
      type: 'place',
      icon: MapPin,
      title: place.name,
      // Adresa má přednost před městem: špendlíky ze stejného města se často
      // jmenují stejně (šestkrát „Hossegor“) a jinak by šly rozeznat jen kliknutím.
      subtitle: [clean(place.address) || place.city, place.tripTitle, t(categoryLabelKey(place.category))]
        .filter(Boolean)
        .join(' · '),
      meta: place.dayIndex != null
        ? `${t('spotlight.day')} ${place.dayIndex + 1}`
        : (place.countryCode ? countryFlag(place.countryCode) : null),
      keywords: `misto place ${clean(place.address)} ${clean(place.note)} ${place.status} ${place.category}`,
      to: `/dashboard/map?place=${place.id}`,
    }));
  }

  // ── Přátelé ──────────────────────────────────────────────
  for (const friend of friends) {
    const name = [friend.first_name, friend.last_name].filter(Boolean).join(' ') || friend.email;
    items.push(item({
      id: `friend:${friend.id}`,
      type: 'friend',
      icon: UserRound,
      title: name,
      subtitle: clean(friend.bio) || friend.email,
      keywords: `pritel kamarad friend profil ${friend.email}`,
      to: `/dashboard/profile/${friend.id}`,
    }));
  }

  return items;
};

export default buildItems;
