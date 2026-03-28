import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { getGenres } from '@/api/content';
import { adminUploadImage } from '@/api/admin/content';
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
  const watchedPosterUrl = watch('poster_url');
  const watchedBackdropUrl = watch('backdrop_url');
  const selectedGenres = watch('genre_ids') ?? [];
  const [thumbnailError, setThumbnailError] = useState(false);
  const [posterUploading, setPosterUploading] = useState(false);
  const [backdropUploading, setBackdropUploading] = useState(false);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  function toggleGenre(genreId: string) {
    const current = selectedGenres;
    const updated = current.includes(genreId)
      ? current.filter((id) => id !== genreId)
      : [...current, genreId];
    setValue('genre_ids', updated);
  }

  async function handleImageUpload(file: File, type: 'poster' | 'backdrop') {
    const setUploading = type === 'poster' ? setPosterUploading : setBackdropUploading;
    const field = type === 'poster' ? 'poster_url' : 'backdrop_url';
    setUploading(true);
    try {
      const url = await adminUploadImage(file, type);
      setValue(field, url);
    } catch {
      // Upload failed — keep current value
    } finally {
      setUploading(false);
    }
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
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-6 max-w-2xl">
      {/* Title & Type */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label htmlFor="title" className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Title *</label>
          <input
            id="title"
            {...register('title')}
            className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-white/20 transition-colors"
          />
          {errors.title && <p className="text-red-400 text-xs mt-1.5">{errors.title.message}</p>}
        </div>
        <div>
          <label htmlFor="type" className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Type *</label>
          <select
            id="type"
            {...register('type')}
            className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          >
            <option value="movie">Movie</option>
            <option value="series">Series</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Description *</label>
        <textarea
          id="description"
          {...register('description')}
          rows={4}
          className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-white/20 resize-none transition-colors"
        />
        {errors.description && <p className="text-red-400 text-xs mt-1.5">{errors.description.message}</p>}
      </div>

      {/* Genres */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Genres</label>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => {
            const isSelected = selectedGenres.includes(genre.id);
            return (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isSelected
                    ? 'bg-primary/20 text-primary ring-1 ring-primary/30'
                    : 'bg-white/[0.04] text-white/40 hover:text-white/70 hover:bg-white/[0.06] ring-1 ring-white/[0.06]'
                }`}
              >
                {genre.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Director, Year, Rating */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="director" className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Director</label>
          <input
            id="director"
            {...register('director')}
            className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-white/20 transition-colors"
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Year</label>
          <input
            id="year"
            {...register('year')}
            type="number"
            className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-white/20 transition-colors"
          />
          {errors.year && <p className="text-red-400 text-xs mt-1.5">{errors.year.message}</p>}
        </div>
        <div>
          <label htmlFor="rating" className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Rating</label>
          <select
            id="rating"
            {...register('rating')}
            className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
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
      </div>

      {/* Cast */}
      <div>
        <label htmlFor="cast_text" className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Cast</label>
        <input
          id="cast_text"
          {...register('cast_text')}
          placeholder="Tom Hanks, Morgan Freeman, Tim Robbins"
          className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-white/20 transition-colors"
        />
        <p className="text-white/25 text-[11px] mt-1">Comma-separated names</p>
      </div>

      {/* Media section header */}
      <div className="pt-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Media</span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
      </div>

      {/* Poster & Backdrop uploads */}
      <div className="grid grid-cols-2 gap-4">
        {/* Poster */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Poster Image</label>
          <input
            ref={posterInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, 'poster');
            }}
          />
          {watchedPosterUrl ? (
            <div className="relative group">
              <img
                src={watchedPosterUrl}
                alt="Poster preview"
                className="w-full aspect-[2/3] object-cover rounded-lg border border-white/[0.08]"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => posterInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setValue('poster_url', '')}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => posterInputRef.current?.click()}
              disabled={posterUploading}
              className="w-full aspect-[2/3] rounded-lg border-2 border-dashed border-white/[0.1] hover:border-primary/30 bg-white/[0.02] hover:bg-white/[0.04] flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {posterUploading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white/30 text-xs">Upload poster</span>
                  <span className="text-white/15 text-[10px]">2:3 ratio recommended</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Backdrop */}
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Backdrop Image</label>
          <input
            ref={backdropInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, 'backdrop');
            }}
          />
          {watchedBackdropUrl ? (
            <div className="relative group">
              <img
                src={watchedBackdropUrl}
                alt="Backdrop preview"
                className="w-full aspect-video object-cover rounded-lg border border-white/[0.08]"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => backdropInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => setValue('backdrop_url', '')}
                  className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => backdropInputRef.current?.click()}
              disabled={backdropUploading}
              className="w-full aspect-video rounded-lg border-2 border-dashed border-white/[0.1] hover:border-primary/30 bg-white/[0.02] hover:bg-white/[0.04] flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {backdropUploading ? (
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-white/30 text-xs">Upload backdrop</span>
                  <span className="text-white/15 text-[10px]">16:9 ratio recommended</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Trailer URL */}
      <div>
        <label htmlFor="trailer_url" className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Trailer URL</label>
        <input
          id="trailer_url"
          {...register('trailer_url')}
          placeholder="https://..."
          className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-white/20 transition-colors"
        />
      </div>

      {/* Mux Playback ID */}
      <div>
        <label htmlFor="playback_id" className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">Mux Playback ID</label>
        <input
          id="playback_id"
          {...register('playback_id', {
            onChange: () => setThumbnailError(false),
          })}
          className="w-full bg-white/[0.04] border border-white/[0.08] text-white rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 placeholder:text-white/20 transition-colors"
          placeholder="e.g. a1b2c3d4e5f6g7h8"
        />
        {watchedPlaybackId && !thumbnailError && (
          <img
            src={getMuxThumbnailUrl(watchedPlaybackId)}
            alt="Video thumbnail"
            className="mt-3 rounded-lg border border-white/[0.08] max-w-xs"
            onError={() => setThumbnailError(true)}
          />
        )}
        {watchedPlaybackId && thumbnailError && (
          <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400 max-w-xs">
            Invalid Playback ID — thumbnail could not be loaded
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting || posterUploading || backdropUploading}
          className="px-8 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20"
        >
          {isSubmitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
