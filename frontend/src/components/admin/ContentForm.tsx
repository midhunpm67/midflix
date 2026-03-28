import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { getGenres } from '@/api/content';
import type { Content, CreateContentPayload } from '@/types/content';
import { getMuxThumbnailUrl } from '@/lib/mux';

const contentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['movie', 'series']),
  genre_ids: z.array(z.string()).optional(),
  cast_text: z.string().optional(),
  director: z.string().nullable().optional(),
  year: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(1888).max(2100).nullable().optional()
  ),
  rating: z.enum(['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-MA', 'TV-14', 'TV-PG', 'TV-G', 'TV-Y', '']).transform((v) => v === '' ? null : v).nullable().optional(),
  poster_url: z.string().nullable().optional(),
  backdrop_url: z.string().nullable().optional(),
  trailer_url: z.string().nullable().optional(),
  playback_id: z.string().nullable().optional(),
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
  const { data: genres = [] } = useQuery({
    queryKey: ['genres'],
    queryFn: getGenres,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      type: defaultValues?.type ?? 'movie',
      genre_ids: defaultValues?.genre_ids ?? [],
      cast_text: defaultValues?.cast?.join(', ') ?? '',
      director: defaultValues?.director ?? '',
      year: defaultValues?.year ?? undefined,
      rating: (defaultValues?.rating ?? '') as FormValues['rating'],
      poster_url: defaultValues?.poster_url ?? '',
      backdrop_url: defaultValues?.backdrop_url ?? '',
      trailer_url: defaultValues?.trailer_url ?? '',
      playback_id: defaultValues?.video?.playback_id ?? '',
    },
  });

  const watchedPlaybackId = watch('playback_id');
  const selectedGenres = watch('genre_ids') ?? [];
  const [thumbnailError, setThumbnailError] = useState(false);

  function toggleGenre(genreId: string) {
    const current = selectedGenres;
    const updated = current.includes(genreId)
      ? current.filter((id) => id !== genreId)
      : [...current, genreId];
    setValue('genre_ids', updated);
  }

  function handleFormSubmit(values: FormValues) {
    const castArray = values.cast_text
      ? values.cast_text.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    onSubmit({
      title: values.title,
      description: values.description,
      type: values.type,
      genre_ids: values.genre_ids ?? [],
      cast: castArray,
      director: values.director || null,
      year: values.year ?? null,
      rating: values.rating || null,
      poster_url: values.poster_url || null,
      backdrop_url: values.backdrop_url || null,
      trailer_url: values.trailer_url || null,
      video: { playback_id: values.playback_id || null },
    });
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-5 max-w-2xl">
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

      {/* Genres */}
      <div>
        <label className="block text-sm text-muted-foreground mb-2">Genres</label>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => {
            const isSelected = selectedGenres.includes(genre.id);
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-muted-foreground hover:text-white'
                }`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
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

      {/* Cast */}
      <div>
        <label htmlFor="cast_text" className="block text-sm text-muted-foreground mb-1">Cast</label>
        <input
          id="cast_text"
          {...register('cast_text')}
          placeholder="e.g. Tom Hanks, Morgan Freeman, Tim Robbins"
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="text-muted-foreground text-xs mt-1">Comma-separated names</p>
      </div>

      <div>
        <label htmlFor="poster_url" className="block text-sm text-muted-foreground mb-1">Poster URL</label>
        <input
          id="poster_url"
          {...register('poster_url')}
          placeholder="https://example.com/poster.jpg"
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.poster_url && <p className="text-destructive text-xs mt-1">{errors.poster_url.message}</p>}
      </div>

      <div>
        <label htmlFor="backdrop_url" className="block text-sm text-muted-foreground mb-1">Backdrop URL</label>
        <input
          id="backdrop_url"
          {...register('backdrop_url')}
          placeholder="https://example.com/backdrop.jpg"
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.backdrop_url && <p className="text-destructive text-xs mt-1">{errors.backdrop_url.message}</p>}
      </div>

      <div>
        <label htmlFor="trailer_url" className="block text-sm text-muted-foreground mb-1">Trailer URL</label>
        <input
          id="trailer_url"
          {...register('trailer_url')}
          placeholder="https://example.com/trailer.mp4"
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.trailer_url && <p className="text-destructive text-xs mt-1">{errors.trailer_url.message}</p>}
      </div>

      <div>
        <label htmlFor="playback_id" className="block text-sm text-muted-foreground mb-1">Mux Playback ID</label>
        <input
          id="playback_id"
          {...register('playback_id', {
            onChange: () => setThumbnailError(false),
          })}
          className="w-full bg-card border border-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="e.g. a1b2c3d4e5f6g7h8"
        />
        {watchedPlaybackId && !thumbnailError && (
          <img
            src={getMuxThumbnailUrl(watchedPlaybackId)}
            alt="Video thumbnail"
            className="mt-2 rounded border border-border max-w-xs"
            onError={() => setThumbnailError(true)}
          />
        )}
        {watchedPlaybackId && thumbnailError && (
          <div className="mt-2 rounded border border-border bg-card px-3 py-2 text-xs text-muted-foreground max-w-xs">
            Invalid Playback ID — thumbnail could not be loaded
          </div>
        )}
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
