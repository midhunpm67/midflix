import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminGetStats } from '@/api/admin/content';
import type { AdminStatsContentItem } from '@/types/content';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminGetStats,
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-white/[0.04] rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 bg-white/[0.04] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-white/[0.04] rounded-xl animate-pulse" />
          <div className="h-80 bg-white/[0.04] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const publishRate = stats.total_content > 0
    ? Math.round((stats.published / stats.total_content) * 100)
    : 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Dashboard</h1>
          <p className="text-white/40 text-sm mt-1">Platform overview and quick actions</p>
        </div>
        <Link
          to="/admin/content/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Content
        </Link>
      </div>

      {/* Primary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Content"
          value={stats.total_content}
          icon={<IconFilm />}
          color="primary"
        />
        <StatCard
          label="Published"
          value={stats.published}
          subtext={`${publishRate}% publish rate`}
          icon={<IconCheck />}
          color="emerald"
        />
        <StatCard
          label="Total Views"
          value={formatNumber(stats.total_views)}
          icon={<IconEye />}
          color="violet"
        />
        <StatCard
          label="Videos Ready"
          value={stats.videos_ready}
          subtext={`of ${stats.total_content} content`}
          icon={<IconPlay />}
          color="cyan"
        />
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStatCard label="Movies" value={stats.movies} icon={<IconMovie />} />
        <MiniStatCard label="Series" value={stats.series} icon={<IconTv />} />
        <MiniStatCard label="Seasons" value={stats.total_seasons} icon={<IconStack />} />
        <MiniStatCard label="Episodes" value={stats.total_episodes} icon={<IconEpisode />} />
      </div>

      {/* Content Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Content */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-white/90 text-sm font-semibold">Recently Added</h2>
            </div>
            <Link to="/admin/content" className="text-primary text-xs hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {stats.recent_content.length === 0 ? (
              <EmptyState message="No content yet" />
            ) : (
              stats.recent_content.map((item) => (
                <ContentRow key={item.slug} item={item} showStatus />
              ))
            )}
          </div>
        </div>

        {/* Top Viewed */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h2 className="text-white/90 text-sm font-semibold">Most Viewed</h2>
            </div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {stats.top_content.length === 0 ? (
              <EmptyState message="No views yet" />
            ) : (
              stats.top_content.map((item, index) => (
                <ContentRow key={item.slug} item={item} rank={index + 1} showViews />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
        <h2 className="text-white/90 text-sm font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction to="/admin/content/new" label="New Movie" icon={<IconMovie />} />
          <QuickAction to="/admin/content/new" label="New Series" icon={<IconTv />} />
          <QuickAction to="/admin/content" label="Manage Content" icon={<IconFilm />} />
          <QuickAction to="/" label="View Site" icon={<IconGlobe />} external />
        </div>
      </div>
    </div>
  );
}

/* ---------- Stat Cards ---------- */

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  color: 'primary' | 'emerald' | 'violet' | 'cyan';
}

const COLOR_MAP = {
  primary: { bg: 'bg-primary/10', text: 'text-primary', glow: 'shadow-primary/5' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', glow: 'shadow-emerald-500/5' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', glow: 'shadow-violet-500/5' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', glow: 'shadow-cyan-500/5' },
};

function StatCard({ label, value, subtext, icon, color }: StatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 shadow-lg ${c.glow} hover:bg-white/[0.04] transition-colors`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center`}>
          <span className={c.text}>{icon}</span>
        </div>
      </div>
      <div className="text-2xl font-bold text-white tracking-tight tabular-nums">{value}</div>
      <div className="text-white/40 text-xs mt-0.5">{label}</div>
      {subtext && <div className="text-white/25 text-[10px] mt-1">{subtext}</div>}
    </div>
  );
}

function MiniStatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-4 py-3.5 flex items-center gap-3.5 hover:bg-white/[0.04] transition-colors">
      <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center text-white/40">
        {icon}
      </div>
      <div>
        <div className="text-lg font-semibold text-white tabular-nums">{value}</div>
        <div className="text-white/35 text-[11px]">{label}</div>
      </div>
    </div>
  );
}

/* ---------- Content Row ---------- */

function ContentRow({
  item,
  rank,
  showStatus,
  showViews,
}: {
  item: AdminStatsContentItem;
  rank?: number;
  showStatus?: boolean;
  showViews?: boolean;
}) {
  return (
    <Link
      to={`/content/${item.slug}`}
      className="flex items-center gap-3.5 px-5 py-3 hover:bg-white/[0.03] transition-colors"
    >
      {rank != null && (
        <span className="text-white/20 text-xs font-semibold w-5 text-center tabular-nums">
          {rank}
        </span>
      )}
      <div className="w-9 h-12 rounded-md bg-white/[0.06] overflow-hidden flex-shrink-0">
        {item.poster_url ? (
          <img src={item.poster_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white/80 text-sm font-medium truncate">{item.title}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-medium text-white/30 uppercase">{item.type}</span>
          {showStatus && item.is_published != null && (
            <span className={`inline-flex items-center gap-1 text-[10px] ${
              item.is_published ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              <span className={`w-1 h-1 rounded-full ${
                item.is_published ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              {item.is_published ? 'Live' : 'Draft'}
            </span>
          )}
        </div>
      </div>
      {showViews && (
        <span className="text-white/30 text-xs tabular-nums flex-shrink-0">
          {formatNumber(item.view_count)} views
        </span>
      )}
    </Link>
  );
}

/* ---------- Quick Action ---------- */

function QuickAction({ to, label, icon, external }: { to: string; label: string; icon: React.ReactNode; external?: boolean }) {
  const cls = "flex items-center gap-3 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-sm text-white/60 hover:text-white/90";

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={cls}>
        <span className="text-white/30">{icon}</span>
        {label}
      </a>
    );
  }

  return (
    <Link to={to} className={cls}>
      <span className="text-white/30">{icon}</span>
      {label}
    </Link>
  );
}

/* ---------- Empty State ---------- */

function EmptyState({ message }: { message: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-white/25 text-sm">{message}</p>
      <Link to="/admin/content/new" className="text-primary text-xs hover:underline mt-2 inline-block">
        Add your first content
      </Link>
    </div>
  );
}

/* ---------- Helpers ---------- */

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/* ---------- Icons ---------- */

function IconFilm() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconEye() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconMovie() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function IconTv() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconStack() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function IconEpisode() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}
