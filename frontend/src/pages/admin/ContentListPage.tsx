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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display tracking-widest uppercase text-white">Content</h1>
        <Link
          to="/admin/content/new"
          className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          Add Content
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by title…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full max-w-sm bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {isLoading && (
        <div className="text-muted-foreground text-sm">Loading…</div>
      )}

      {data && (
        <>
          <div className="rounded border border-border overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-card text-muted-foreground uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Video</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      No content found.
                    </td>
                  </tr>
                ) : (
                  data.items.map((item) => (
                    <tr key={item.id} className="bg-background hover:bg-card/50 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">
                        <Link
                          to={`/admin/content/${item.id}`}
                          className="hover:text-primary transition-colors"
                        >
                          {item.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">{item.type}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.year ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            item.is_published
                              ? 'bg-green-900/40 text-green-400'
                              : 'bg-yellow-900/40 text-yellow-400'
                          }`}
                        >
                          {item.is_published ? 'Published' : 'Draft'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${
                          item.video?.status === 'ready'
                            ? 'text-green-400'
                            : 'text-muted-foreground'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            item.video?.status === 'ready'
                              ? 'bg-green-400'
                              : 'bg-muted-foreground'
                          }`} />
                          {item.video?.status === 'ready' ? 'Ready' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{item.view_count.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/content/${item.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => togglePublishMutation.mutate(item.id)}
                            disabled={togglePublishMutation.isPending || deleteMutation.isPending}
                            className="text-xs text-muted-foreground hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {item.is_published ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deleteMutation.isPending || togglePublishMutation.isPending}
                            className="text-xs text-destructive hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
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

          {data.last_page > 1 && (
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded border border-border hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <span>
                Page {data.current_page} of {data.last_page}
              </span>
              <button
                disabled={page === data.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded border border-border hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
