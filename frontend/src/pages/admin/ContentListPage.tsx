import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminListContent,
  adminTogglePublish,
  adminDeleteContent,
} from '@/api/admin/content';
import type { ContentListItem } from '@/types/content';

export default function ContentListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-content', search, page],
    queryFn: () => adminListContent({ search, page }),
  });

  const togglePublishMutation = useMutation({
    mutationFn: (id: string) => adminTogglePublish(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-content'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteContent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-content'] }),
  });

  function handleDelete(item: ContentListItem) {
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    deleteMutation.mutate(item.id);
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Content</h1>
          <p className="text-white/40 text-sm mt-1">Manage movies and series</p>
        </div>
        <Link
          to="/admin/content/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20"
        >
          <span className="text-lg leading-none">+</span>
          Add Content
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by title…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-white/25 transition-colors"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/[0.02] rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Table */}
      {data && (
        <>
          <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-white/[0.02]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="px-5 py-3.5 text-left text-[11px] font-medium text-white/40 uppercase tracking-wider">Title</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-medium text-white/40 uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-medium text-white/40 uppercase tracking-wider">Year</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-medium text-white/40 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-medium text-white/40 uppercase tracking-wider">Video</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-medium text-white/40 uppercase tracking-wider">Views</th>
                  <th className="px-5 py-3.5 text-right text-[11px] font-medium text-white/40 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <p className="text-white/30 text-sm">No content found</p>
                      <Link
                        to="/admin/content/new"
                        className="text-primary text-xs hover:underline mt-1 inline-block"
                      >
                        Create your first content →
                      </Link>
                    </td>
                  </tr>
                ) : (
                  data.items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`group hover:bg-white/[0.03] transition-colors ${
                        index < data.items.length - 1 ? 'border-b border-white/[0.04]' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          to={`/admin/content/${item.id}`}
                          className="text-white/90 font-medium hover:text-primary transition-colors"
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-white/[0.06] text-white/50 capitalize">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/40">{item.year ?? '—'}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                            item.is_published
                              ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.is_published ? 'bg-emerald-400' : 'bg-amber-400'
                          }`} />
                          {item.is_published ? 'Live' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] ${
                          item.video?.status === 'ready'
                            ? 'text-emerald-400'
                            : 'text-white/25'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.video?.status === 'ready'
                              ? 'bg-emerald-400'
                              : 'bg-white/20'
                          }`} />
                          {item.video?.status === 'ready' ? 'Ready' : 'None'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/40 tabular-nums">{item.view_count.toLocaleString()}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/admin/content/${item.id}`}
                            className="px-2.5 py-1 text-xs text-white/60 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => togglePublishMutation.mutate(item.id)}
                            disabled={togglePublishMutation.isPending || deleteMutation.isPending}
                            className="px-2.5 py-1 text-xs text-white/60 hover:text-white hover:bg-white/[0.06] rounded-md transition-colors disabled:opacity-30"
                          >
                            {item.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deleteMutation.isPending || togglePublishMutation.isPending}
                            className="px-2.5 py-1 text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors disabled:opacity-30"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.last_page > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-white/30 text-xs">
                Page {data.current_page} of {data.last_page} · {data.total} items
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={page === data.last_page}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
