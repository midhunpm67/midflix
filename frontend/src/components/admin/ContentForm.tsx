import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Content, CreateContentPayload } from '@/types/content';

const contentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['movie', 'series']),
  director: z.string().nullable().optional(),
  year: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(1888).max(2100).nullable().optional()
  ),
  rating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-MA', 'TV-14', 'TV-PG', 'TV-G', 'TV-Y', '']).transform((v) => v === '' ? null : v).nullable().optional(),
  poster_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  backdrop_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  trailer_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof contentSchema>;

interface ContentFormProps {
  defaultValues?: Partial<Content>;
  onSubmit: (data: CreateContentPayload) => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

export default function ContentForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  submitLabel = 'Save',
}: ContentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      type: defaultValues?.type ?? 'movie',
      director: defaultValues?.director ?? '',
      year: defaultValues?.year ?? undefined,
      rating: (defaultValues?.rating ?? '') as FormValues['rating'],
      poster_url: defaultValues?.poster_url ?? '',
      backdrop_url: defaultValues?.backdrop_url ?? '',
      trailer_url: defaultValues?.trailer_url ?? '',
    },
  });

  function handleFormSubmit(values: FormValues) {
    onSubmit({
      ...values,
      year: values.year ?? null,
      poster_url: values.poster_url || null,
      backdrop_url: values.backdrop_url || null,
      trailer_url: values.trailer_url || null,
      director: values.director || null,
      rating: values.rating || null,
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 max-w-2xl">
      <div>
        <label htmlFor="title" className="block text-sm text-muted-foreground mb-1">Title *</label>
        <input
          id="title"
          {...register('title')}
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label htmlFor="type" className="block text-sm text-muted-foreground mb-1">Type *</label>
        <select
          id="type"
          {...register('type')}
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="movie">Movie</option>
          <option value="series">Series</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm text-muted-foreground mb-1">Description *</label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        {errors.description && <p className="text-destructive text-xs mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="director" className="block text-sm text-muted-foreground mb-1">Director</label>
          <input
            id="director"
            {...register('director')}
            className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-sm text-muted-foreground mb-1">Year</label>
          <input
            id="year"
            {...register('year')}
            type="number"
            className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {errors.year && <p className="text-destructive text-xs mt-1">{errors.year.message}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="rating" className="block text-sm text-muted-foreground mb-1">Rating</label>
        <select
          id="rating"
          {...register('rating')}
          className="bg-card border border-border text-white rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select rating</option>
          <option value="G">G</option>
          <option value="PG">PG</option>
          <option value="PG-13">PG-13</option>
          <option value="R">R</option>
          <option value="NC-17">NC-17</option>
          <option value="TV-MA">TV-MA</option>
          <option value="TV-14">TV-14</option>
          <option value="TV-PG">TV-PG</option>
          <option value="TV-G">TV-G</option>
          <option value="TV-Y">TV-Y</option>
        </select>
      </div>

      <div>
        <label htmlFor="poster_url" className="block text-sm text-muted-foreground mb-1">Poster URL</label>
        <input
          id="poster_url"
          {...register('poster_url')}
          type="url"
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.poster_url && <p className="text-destructive text-xs mt-1">{errors.poster_url.message}</p>}
      </div>

      <div>
        <label htmlFor="backdrop_url" className="block text-sm text-muted-foreground mb-1">Backdrop URL</label>
        <input
          id="backdrop_url"
          {...register('backdrop_url')}
          type="url"
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.backdrop_url && <p className="text-destructive text-xs mt-1">{errors.backdrop_url.message}</p>}
      </div>

      <div>
        <label htmlFor="trailer_url" className="block text-sm text-muted-foreground mb-1">Trailer URL</label>
        <input
          id="trailer_url"
          {...register('trailer_url')}
          type="url"
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.trailer_url && <p className="text-destructive text-xs mt-1">{errors.trailer_url.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-6 py-2 bg-primary text-white rounded font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
