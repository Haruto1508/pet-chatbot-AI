import React from 'react';

/**
 * Universal & Contextual Loading Skeletons for Vethic AI
 * Replaces jarring spinners with smooth, polished shimmer placeholders.
 */

// 1. Table Rows Skeleton (for Admin Users, Admin Clinics, Logs, Records)
export const TableRowsSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 6, cols = 5 }) => {
  return (
    <tbody className="divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={`skeleton-row-${rIdx}`} className="bg-white">
          <td className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-slate-200 rounded w-28" />
                <div className="h-2.5 bg-slate-100 rounded w-40" />
              </div>
            </div>
          </td>
          <td className="p-4">
            <div className="h-5 bg-slate-200 rounded-full w-16" />
          </td>
          <td className="p-4">
            <div className="h-5 bg-slate-100 rounded-full w-20" />
          </td>
          <td className="p-4">
            <div className="h-3 bg-slate-100 rounded w-24" />
          </td>
          <td className="p-4 text-right">
            <div className="flex items-center justify-end gap-2">
              <div className="h-7 w-16 bg-slate-100 rounded-lg" />
              <div className="h-7 w-20 bg-slate-100 rounded-lg" />
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
};

// 2. Dashboard Stat Cards Skeleton (KPI Metrics)
export const DashboardCardsSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div key={`stat-skel-${idx}`} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-3 bg-slate-200 rounded w-24" />
            <div className="w-8 h-8 rounded-xl bg-slate-100" />
          </div>
          <div className="h-7 bg-slate-200 rounded w-20" />
          <div className="flex items-center gap-2 pt-1">
            <div className="h-3 bg-slate-100 rounded w-16" />
            <div className="h-3 bg-slate-100 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 3. Admin Full Page Skeleton (Header + 4 KPIs + Content Table / Chart)
export const AdminPageSkeleton: React.FC<{ title?: string }> = ({ title = 'Đang tải dữ liệu quản trị...' }) => {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded-lg w-64" />
          <div className="h-3 bg-slate-100 rounded w-80" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 bg-slate-100 rounded-xl w-24" />
          <div className="h-9 bg-slate-100 rounded-xl w-32" />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <DashboardCardsSkeleton />

      {/* Main Content Area Placeholder */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="h-5 bg-slate-200 rounded w-36" />
          <div className="h-8 bg-slate-100 rounded-xl w-48" />
        </div>
        <div className="space-y-3 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`content-skel-${i}`} className="h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center px-4 gap-4">
              <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
              <div className="h-3.5 bg-slate-200 rounded w-1/4" />
              <div className="h-3 bg-slate-100 rounded w-1/3" />
              <div className="ml-auto h-4 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 4. User Chat Skeleton
export const UserChatSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#fcfcfc] animate-pulse p-4 space-y-4">
      {/* Chat Messages Placeholder */}
      <div className="flex-1 space-y-6 max-w-3xl mx-auto w-full pt-8">
        {/* Bot message */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 border border-emerald-200 shrink-0" />
          <div className="space-y-2 max-w-lg flex-1">
            <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
            <div className="h-4 bg-slate-200 rounded-lg w-5/6" />
            <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
          </div>
        </div>

        {/* User message */}
        <div className="flex items-start justify-end gap-3">
          <div className="space-y-2 max-w-md flex-1">
            <div className="h-4 bg-emerald-200/60 rounded-lg w-4/5 ml-auto" />
            <div className="h-4 bg-emerald-200/60 rounded-lg w-2/3 ml-auto" />
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
        </div>

        {/* Bot message 2 */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-2xl bg-emerald-100 border border-emerald-200 shrink-0" />
          <div className="space-y-2 max-w-lg flex-1">
            <div className="h-4 bg-slate-200 rounded-lg w-full" />
            <div className="h-4 bg-slate-200 rounded-lg w-4/5" />
          </div>
        </div>
      </div>

      {/* Input bar placeholder */}
      <div className="max-w-3xl mx-auto w-full pb-4">
        <div className="h-14 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center px-4 gap-3">
          <div className="h-5 bg-slate-200 rounded-full w-5" />
          <div className="h-4 bg-slate-100 rounded flex-1" />
          <div className="h-8 bg-slate-200 rounded-xl w-10" />
        </div>
      </div>
    </div>
  );
};

// 5. Generic Cards Grid Skeleton (for News, Clinics, Pets)
export const CardsGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`card-skel-${i}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="h-44 bg-slate-200 w-full" />
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-slate-100 rounded-full w-16" />
              <div className="h-3 bg-slate-100 rounded w-20" />
            </div>
            <div className="h-5 bg-slate-200 rounded w-4/5" />
            <div className="space-y-1.5">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-3/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 6. Logs List Skeleton (for AdminLogView)
export const LogsListSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={`log-skel-${i}`} className="bg-white rounded-xl border border-slate-200/80 p-3 flex items-center gap-3">
          <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0" />
          <div className="h-4 w-12 bg-slate-200 rounded-md shrink-0" />
          <div className="h-3.5 bg-slate-200 rounded flex-1 max-w-lg" />
          <div className="h-3 bg-slate-100 rounded w-16 shrink-0 ml-auto hidden sm:block" />
          <div className="h-3 bg-slate-100 rounded w-20 shrink-0" />
        </div>
      ))}
    </div>
  );
};

// 6. Universal Page Loader (Used as Suspense fallback in App.tsx)
export const UniversalPageLoader: React.FC<{ currentTab?: string }> = ({ currentTab = '' }) => {
  if (currentTab.startsWith('admin_') || currentTab.startsWith('admin')) {
    return <AdminPageSkeleton />;
  }
  if (currentTab === 'chat') {
    return <UserChatSkeleton />;
  }
  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-xl w-64 mb-6" />
      <CardsGridSkeleton count={6} />
    </div>
  );
};
