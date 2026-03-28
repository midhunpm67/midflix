import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
      navigate(`/admin/content/${created.id}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: CreateContentPayload) => adminUpdateContent(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-content'] });
      queryClient.invalidateQueries({ queryKey: ['admin-content-detail', id] });
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
    return <div className="p-6 text-muted-foreground text-sm">Loading…</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/content')}
          className="text-muted-foreground hover:text-white transition-colors text-sm"
        >
          ← Content
        </button>
        <h1 className="text-2xl font-display tracking-widest uppercase text-white">
          {isNew ? 'New Content' : content?.title ?? 'Edit'}
        </h1>
      </div>

      {(createMutation.error || updateMutation.error) && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded text-destructive text-sm">
          Failed to save. Please try again.
        </div>
      )}

      {(isNew || content) && (
        <ContentForm
          defaultValues={content}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={isNew ? 'Create' : 'Update'}
        />
      )}

      {!isNew && content?.type === 'series' && (
        <div className="mt-10">
          <SeasonManager contentId={content.id} />
        </div>
      )}
    </div>
  );
}
