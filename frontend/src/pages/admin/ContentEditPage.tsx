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
    onError: () => {
      toast.error('Failed to create content');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateContentPayload) => adminUpdateContent(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['admin-content-detail', id] });
      toast.success('Content updated successfully');
    },
    onError: () => {
      toast.error('Failed to update content');
    },
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
        <div className="space-y-4 max-w-2xl">
          <div className="h-8 w-48 bg-white/[0.04] rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-white/[0.04] rounded animate-pulse" />
          <div className="h-40 bg-white/[0.04] rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/admin/content')}
          className="w-8 h-8 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-white/40 hover:text-white/70 flex items-center justify-center transition-colors"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">
            {isNew ? 'New Content' : content?.title ?? 'Edit'}
          </h1>
          <p className="text-white/40 text-sm mt-0.5">
            {isNew ? 'Create a new movie or series' : 'Edit content details'}
          </p>
        </div>
      </div>

      {/* Form */}
      {(isNew || content) && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
          <ContentForm
            defaultValues={content}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel={isNew ? 'Create' : 'Update'}
          />
        </div>
      )}

      {/* Season Manager */}
      {!isNew && content?.type === 'series' && (
        <div className="mt-8 bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
          <SeasonManager contentId={content.id} />
        </div>
      )}
    </div>
  );
}
