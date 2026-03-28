import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import ContentForm from '@/components/admin/ContentForm';
import SeasonManager from '@/components/admin/SeasonManager';
import {
  adminGetContent,
  adminCreateContent,
  adminUpdateContent,
} from '@/api/admin/content';
import type { CreateContentPayload } from '@/types/content';

export default function ContentEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: content, isLoading } = useQuery({
    queryKey: ['admin-content-detail', id],
    queryFn: () => adminGetContent(id!),
    enabled: !isNew,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateContentPayload) => adminCreateContent(payload),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      toast.success('Content created successfully');
      navigate(`/admin/content/${created.id}`);
    },
    onError: () => toast.error('Failed to create content'),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateContentPayload) => adminUpdateContent(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['admin-content-detail', id] });
      toast.success('Content updated successfully');
    },
    onError: () => toast.error('Failed to update content'),
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(data: CreateContentPayload) {
    if (isNew) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  }

  if (!isNew && isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4 max-w-[900px] mx-auto">
          <div className="h-8 w-48 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-white/[0.04] rounded animate-pulse" />
          <div className="h-40 bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#0e0e0e]/80 backdrop-blur-xl border-b border-[#1a1a1a] px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/content')}
            className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 flex items-center justify-center transition-colors"
          >
            ←
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_theme(colors.primary)]" />
            <h1 className="text-lg font-display tracking-wider text-white">
              MIDFLIX <span className="text-white/20">/</span> <span className="text-primary">{isNew ? 'NEW CONTENT' : 'EDIT'}</span>
            </h1>
          </div>
        </div>
        {!isNew && content && (
          <span className="text-xs text-white/30 font-mono">{content.slug}</span>
        )}
      </div>

      {/* Form content */}
      <div className="max-w-[900px] mx-auto px-8 py-8">
        {(isNew || content) && (
          <ContentForm
            defaultValues={content}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel={isNew ? 'Create Content' : 'Update Content'}
          />
        )}

        {!isNew && content?.type === 'series' && (
          <div className="mt-8 bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-7">
            <div className="flex items-start gap-3.5 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                5
              </div>
              <div>
                <h3 className="text-[15px] font-display tracking-wider text-white">Seasons & Episodes</h3>
                <p className="text-xs text-white/30 mt-0.5">Manage seasons and episodes for this series</p>
              </div>
            </div>
            <SeasonManager contentId={content.id} />
          </div>
        )}
      </div>
    </div>
  );
}
