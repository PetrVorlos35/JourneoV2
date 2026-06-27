import Skeleton from './Skeleton';

/* ============================================================
   Page-level skeletons. Each mirrors the real content layout
   so the transition into loaded state is seamless.
   ============================================================ */

/** Generic centered content skeleton — used for lazy-route Suspense fallbacks. */
export const ContentSkeleton = () => (
  <div className="w-full space-y-8 pb-10">
    <Skeleton className="h-9 w-48" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-[2rem]" />
      ))}
    </div>
  </div>
);

/** A single trip card skeleton, matching TripsOverview cards. */
const TripCardSkeleton = () => (
  <div className="glass-card p-6 sm:p-8 flex flex-col min-h-[200px] sm:min-h-[220px]">
    <div className="flex justify-between items-start mb-6">
      <Skeleton className="w-12 h-12 rounded-[1rem]" />
      <Skeleton className="w-10 h-10" rounded="rounded-full" />
    </div>
    <Skeleton className="h-7 w-3/4 mb-3" />
    <Skeleton className="h-4 w-1/2 mb-8" />
    <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-100 dark:border-white/10">
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-3.5 w-16" />
    </div>
  </div>
);

/** Dashboard home / trips overview skeleton. */
export const TripsOverviewSkeleton = () => (
  <div className="space-y-6 sm:space-y-10 w-full pb-10">
    <Skeleton className="h-9 sm:h-10 w-56" />

    {/* Widgets */}
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <Skeleton className="md:col-span-6 lg:col-span-5 h-[160px] sm:h-[220px] rounded-[2rem]" />
      <Skeleton className="md:col-span-6 lg:col-span-4 h-[160px] sm:h-[220px] rounded-[2rem]" />
      <Skeleton className="md:col-span-12 lg:col-span-3 h-[100px] lg:h-[220px] rounded-[2rem]" />
    </div>

    {/* Filters */}
    <div className="flex flex-col sm:flex-row gap-4 mt-8">
      <Skeleton className="h-10 flex-1" />
      <Skeleton className="h-10 w-full sm:w-40" />
    </div>

    {/* Tabs */}
    <div className="flex gap-8 border-b border-gray-200 dark:border-white/10 pb-1">
      <Skeleton className="h-5 w-20 mb-3" />
      <Skeleton className="h-5 w-20 mb-3" />
      <Skeleton className="h-5 w-16 mb-3" />
    </div>

    {/* Cards */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <TripCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

/** All-trips list page skeleton. */
export const AllTripsSkeleton = () => (
  <div className="space-y-8 w-full pb-10">
    <Skeleton className="h-10 w-44" />
    <Skeleton className="h-20 rounded-2xl" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <TripCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

/** Settings page skeleton. */
export const SettingsSkeleton = () => (
  <div className="w-full space-y-12 pb-10">
    <div className="space-y-2">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-10 w-40" />
    </div>
    <div className="space-y-8">
      {/* Profile card */}
      <div className="glass-card p-8 md:p-10 space-y-8">
        <Skeleton className="h-7 w-44" />
        <div className="flex items-center gap-6">
          <Skeleton className="w-20 h-20" rounded="rounded-full" />
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-12 rounded-2xl" />
        </div>
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      {/* Preference cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="glass-card p-8 md:p-10 space-y-6">
          <Skeleton className="h-6 w-40" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, j) => (
              <Skeleton key={j} className="h-16 rounded-2xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Budget page skeleton. */
export const BudgetSkeleton = () => (
  <div className="space-y-6 w-full pb-10">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="h-12 w-48 rounded-2xl" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Skeleton className="h-40 rounded-[2rem] lg:col-span-1" />
      <Skeleton className="h-40 rounded-[2rem] lg:col-span-2" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-2xl" />
      ))}
    </div>
  </div>
);

/** Trip detail page skeleton. */
export const TripDetailSkeleton = () => (
  <div className="w-full space-y-8 pb-10">
    <Skeleton className="h-4 w-32" />
    <div className="space-y-3">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-48" />
    </div>
    {/* Tab bar */}
    <div className="flex gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-28 rounded-xl" />
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-[1.5rem]" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-[2rem]" />
        <Skeleton className="h-32 rounded-[2rem]" />
      </div>
    </div>
  </div>
);

/** Statistics page skeleton. */
export const StatisticsSkeleton = () => (
  <div className="w-full space-y-6 sm:space-y-10 pb-24 sm:pb-10">
    <Skeleton className="h-8 sm:h-10 w-44" />

    {/* Metric cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-[2rem] border border-gray-200/60 dark:border-white/[0.07] p-5 sm:p-6 flex items-center gap-4 sm:gap-5">
          <Skeleton className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-7 w-16" />
          </div>
        </div>
      ))}
    </div>

    {/* Financial card */}
    <div className="glass-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-xl" />
        <Skeleton className="h-3.5 w-32" />
      </div>
      <Skeleton className="h-12 sm:h-16 w-48" />
      <Skeleton className="h-3 w-full" rounded="rounded-full" />
      <div className="flex flex-wrap gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-24" />
        ))}
      </div>
    </div>

    {/* Highlight cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-card p-5 sm:p-6 flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="w-9 h-9 rounded-xl" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

/** Friends page skeleton. */
export const FriendsSkeleton = () => (
  <div className="space-y-10 w-full pb-10">
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-40" />
    </div>

    {/* Invite bar */}
    <Skeleton className="h-24 rounded-2xl" />

    {/* Search card */}
    <div className="glass-card p-6 rounded-[2rem] space-y-4">
      <Skeleton className="h-14 w-full rounded-2xl" />
    </div>

    {/* Tabs */}
    <div className="flex gap-8">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-5 w-24" />
    </div>

    {/* Friend rows */}
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 glass-card rounded-2xl">
          <Skeleton className="w-12 h-12" rounded="rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-10 w-24 rounded-xl" />
        </div>
      ))}
    </div>
  </div>
);

/** Friend profile skeleton. */
export const FriendProfileSkeleton = () => (
  <div className="space-y-10 w-full pb-10">
    <Skeleton className="h-4 w-32" />

    {/* Header */}
    <div className="glass-card p-8 sm:p-10 rounded-[2rem]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <Skeleton className="w-24 h-24" rounded="rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>

    {/* Trip cards */}
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-44 rounded-[2rem]" />
      ))}
    </div>
  </div>
);

/** Trip view skeleton (read-only / shared trip detail). */
export const TripViewSkeleton = () => (
  <div className="w-full space-y-8 pb-10">
    <Skeleton className="h-4 w-32" />
    <div className="space-y-3">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-4 w-48" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-[1.5rem]" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-40 rounded-[2rem]" />
        <Skeleton className="h-32 rounded-[2rem]" />
      </div>
    </div>
  </div>
);

/** Admin table skeleton (users / trips). `accent` tints nothing — kept neutral. */
export const AdminTableSkeleton = ({ rows = 8 }) => (
  <div className="space-y-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200/60 dark:border-white/[0.07]">
        <Skeleton className="w-10 h-10" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    ))}
  </div>
);

/** Admin dashboard skeleton (stat cards + content). */
export const AdminDashboardSkeleton = () => (
  <div className="space-y-8">
    <Skeleton className="h-9 w-48" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-28 rounded-2xl" />
      ))}
    </div>
    <Skeleton className="h-64 rounded-[2rem]" />
  </div>
);

/** Notification dropdown list skeleton. */
export const NotificationListSkeleton = () => (
  <div className="p-2 space-y-1">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3">
        <Skeleton className="w-9 h-9" rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/4" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
