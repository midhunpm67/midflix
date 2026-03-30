import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getGenres } from '@/api/content';
import { adminUploadImage } from '@/api/admin/content';
import type { Content, CreateContentPayload } from '@/types/content';
import { getMuxThumbnailUrl } from '@/lib/mux';

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

  const [type, setType] = useState(defaultValues?.type ?? 'movie');
  const [title, setTitle] = useState(defaultValues?.title ?? '');
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [director, setDirector] = useState(defaultValues?.director ?? '');
  const [year, setYear] = useState(defaultValues?.year?.toString() ?? '');
  const [rating, setRating] = useState(defaultValues?.rating ?? '');
  const [duration, setDuration] = useState(defaultValues?.duration?.toString() ?? '');
  const [language, setLanguage] = useState(defaultValues?.language ?? '');
  const [imdbRating, setImdbRating] = useState(defaultValues?.imdb_rating?.toString() ?? '');
  const [isFeatured, setIsFeatured] = useState(defaultValues?.is_featured ?? false);
  const [posterUrl, setPosterUrl] = useState(defaultValues?.poster_url ?? '');
  const [backdropUrl, setBackdropUrl] = useState(defaultValues?.backdrop_url ?? '');
  const [trailerUrl, setTrailerUrl] = useState(defaultValues?.trailer_url ?? '');
  const [playbackId, setPlaybackId] = useState(defaultValues?.video?.playback_id ?? '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(defaultValues?.genre_ids ?? []);
  const [castInput, setCastInput] = useState('');
  const [castList, setCastList] = useState<string[]>(defaultValues?.cast ?? []);
  const [posterUploading, setPosterUploading] = useState(false);
  const [backdropUploading, setBackdropUploading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const backdropInputRef = useRef<HTMLInputElement>(null);

  function toggleGenre(genreId: string) {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((id) => id !== genreId) : [...prev, genreId]
    );
  }

  function addCast() {
    const name = castInput.trim();
    if (name && !castList.includes(name)) {
      setCastList((prev) => [...prev, name]);
      setCastInput('');
    }
  }

  function removeCast(name: string) {
    setCastList((prev) => prev.filter((c) => c !== name));
  }

  async function handleImageUpload(file: File, type: 'poster' | 'backdrop') {
    const setUploading = type === 'poster' ? setPosterUploading : setBackdropUploading;
    const setUrl = type === 'poster' ? setPosterUrl : setBackdropUrl;
    setUploading(true);
    try {
      const url = await adminUploadImage(file, type);
      setUrl(url);
    } catch {
      // Upload failed
    } finally {
      setUploading(false);
    }
  }

  function handleSubmit() {
    if (!title.trim() || !description.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      type,
      genre_ids: selectedGenres,
      cast: castList,
      director: director.trim() || null,
      year: year ? parseInt(year) : null,
      rating: rating || null,
      duration: duration ? parseInt(duration) : null,
      language: language || null,
      imdb_rating: imdbRating ? parseFloat(imdbRating) : null,
      is_featured: isFeatured,
      poster_url: posterUrl || null,
      backdrop_url: backdropUrl || null,
      trailer_url: trailerUrl || null,
      video: { playback_id: playbackId.trim() || null },
    });
  }

  return (
    <div className="flex flex-col gap-6 max-w-[900px]">
      {/* Type selector */}
      <div className="flex gap-3">
        {(['movie', 'series'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-3.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all duration-200 ${
              type === t
                ? 'bg-primary/10 border border-primary/40 text-primary'
                : 'bg-[#0e0e0e] border border-[#1f1f1f] text-white/30 hover:text-white/50'
            }`}
          >
            {t === 'movie' ? '🎬 Movie' : '📺 Series'}
          </button>
        ))}
      </div>

      {/* Section 1 — Basic Info */}
      <Section number="1" title="Basic Information" subtitle="Core details about the content">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Title" required>
            <FormInput placeholder="e.g. Interstellar" value={title} onChange={setTitle} />
          </FormField>
          <FormField label="Director">
            <FormInput placeholder="e.g. Christopher Nolan" value={director} onChange={setDirector} />
          </FormField>
        </div>
        <FormField label="Description" required>
          <FormTextarea placeholder="Write a compelling synopsis..." value={description} onChange={setDescription} />
        </FormField>
        <div className="grid grid-cols-4 gap-4">
          <FormField label="Release Year">
            <FormInput placeholder="2024" type="number" value={year} onChange={setYear} />
          </FormField>
          {type === 'movie' && (
            <FormField label="Duration (mins)" required>
              <FormInput placeholder="148" type="number" value={duration} onChange={setDuration} />
            </FormField>
          )}
          <FormField label="Age Rating" required>
            <FormSelect value={rating} onChange={setRating}>
              <option value="">Select rating</option>
              {['G', 'PG', 'PG-13', 'R', 'NC-17', 'TV-MA', 'TV-14', 'TV-PG', 'TV-G', 'TV-Y'].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField label="Language" required>
            <FormSelect value={language} onChange={setLanguage}>
              <option value="">Select language</option>
              {['English', 'Hindi', 'Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali', 'Marathi', 'Spanish', 'French', 'Japanese', 'Korean'].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </FormSelect>
          </FormField>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FormField label="IMDb Rating" hint="0.0 to 10.0">
            <FormInput placeholder="8.6" type="number" value={imdbRating} onChange={setImdbRating} />
          </FormField>
          <FormField label="Trailer URL">
            <FormInput placeholder="https://..." value={trailerUrl} onChange={setTrailerUrl} />
          </FormField>
          <FormField label="Featured">
            <div className="flex items-center gap-3 h-10">
              <button
                type="button"
                onClick={() => setIsFeatured(!isFeatured)}
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${
                  isFeatured ? 'bg-primary' : 'bg-[#2a2a2a]'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-200 ${
                    isFeatured ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
              <span className={`text-xs font-medium ${isFeatured ? 'text-primary' : 'text-white/30'}`}>
                {isFeatured ? 'Featured on homepage' : 'Not featured'}
              </span>
            </div>
          </FormField>
        </div>
      </Section>

      {/* Section 2 — Mux Video */}
      <Section number="2" title="Mux Video" subtitle="Link your Mux Playback ID for streaming">
        <FormField label="Mux Playback ID" hint="Get this from your Mux dashboard → Assets → Playback ID">
          <FormInput
            placeholder="e.g. DS00Spx1CV902MCtPj5WknGlR102V5HFkDe"
            value={playbackId}
            onChange={(v) => { setPlaybackId(v); setThumbnailError(false); }}
          />
        </FormField>
        {playbackId && (
          <div className="rounded-xl overflow-hidden border border-[#1f1f1f] bg-[#0a0a0a]">
            <div className="px-3 py-2 bg-primary/5 border-b border-[#1f1f1f] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Mux Stream Preview</span>
            </div>
            <div className="p-3">
              {!thumbnailError ? (
                <img
                  src={getMuxThumbnailUrl(playbackId)}
                  alt="Video thumbnail"
                  className="w-full max-w-xs rounded-lg border border-[#1f1f1f]"
                  onError={() => setThumbnailError(true)}
                />
              ) : (
                <p className="text-xs text-red-400">Invalid Playback ID — thumbnail could not be loaded</p>
              )}
              <p className="text-[11px] text-white/30 mt-2 font-mono break-all">
                stream.mux.com/<span className="text-primary">{playbackId}</span>.m3u8
              </p>
            </div>
          </div>
        )}
      </Section>

      {/* Section 3 — Genres & Cast */}
      <Section number="3" title="Genres & Cast" subtitle="Helps with search and recommendations">
        <FormField label="Genres">
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              const isSelected = selectedGenres.includes(genre.id);
              return (
                <button
                  key={genre.id}
                  type="button"
                  onClick={() => toggleGenre(genre.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isSelected
                      ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                      : 'bg-[#111] text-white/30 hover:text-white/50 ring-1 ring-[#1f1f1f] hover:ring-[#2a2a2a]'
                  }`}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>
        </FormField>
        <FormField label="Cast Members" hint="Press Enter or click Add">
          <div className="flex gap-2">
            <FormInput
              placeholder="e.g. Matthew McConaughey"
              value={castInput}
              onChange={setCastInput}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCast(); } }}
            />
            <button
              type="button"
              onClick={addCast}
              className="px-5 bg-primary/10 border border-primary/20 rounded-lg text-primary text-xs font-semibold whitespace-nowrap hover:bg-primary/15 transition-colors"
            >
              Add
            </button>
          </div>
          {castList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {castList.map((name) => (
                <Tag key={name} label={name} onRemove={() => removeCast(name)} />
              ))}
            </div>
          )}
        </FormField>
      </Section>

      {/* Section 4 — Media */}
      <Section number="4" title="Media & Images" subtitle="Upload poster and backdrop images">
        <div className="grid grid-cols-2 gap-4">
          {/* Poster */}
          <FormField label="Poster Image" hint="2:3 ratio recommended (600×900)">
            <input
              ref={posterInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, 'poster');
              }}
            />
            {posterUrl ? (
              <div className="relative group/img">
                <img src={posterUrl} alt="Poster" className="w-full aspect-[2/3] object-cover rounded-xl border border-[#1f1f1f]" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                  <button type="button" onClick={() => posterInputRef.current?.click()} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors">Replace</button>
                  <button type="button" onClick={() => setPosterUrl('')} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg transition-colors">Remove</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => posterInputRef.current?.click()}
                disabled={posterUploading}
                className="w-full aspect-[2/3] rounded-xl border-2 border-dashed border-[#1f1f1f] hover:border-primary/30 bg-[#0a0a0a] hover:bg-[#0e0e0e] flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {posterUploading ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-8 h-8 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-white/25 text-xs">Upload poster</span>
                  </>
                )}
              </button>
            )}
          </FormField>

          {/* Backdrop */}
          <FormField label="Backdrop Image" hint="16:9 ratio recommended (1920×1080)">
            <input
              ref={backdropInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file, 'backdrop');
              }}
            />
            {backdropUrl ? (
              <div className="relative group/img">
                <img src={backdropUrl} alt="Backdrop" className="w-full aspect-video object-cover rounded-xl border border-[#1f1f1f]" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                  <button type="button" onClick={() => backdropInputRef.current?.click()} className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg transition-colors">Replace</button>
                  <button type="button" onClick={() => setBackdropUrl('')} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded-lg transition-colors">Remove</button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => backdropInputRef.current?.click()}
                disabled={backdropUploading}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-[#1f1f1f] hover:border-primary/30 bg-[#0a0a0a] hover:bg-[#0e0e0e] flex flex-col items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {backdropUploading ? (
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-8 h-8 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-white/25 text-xs">Upload backdrop</span>
                  </>
                )}
              </button>
            )}
          </FormField>
        </div>
      </Section>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || posterUploading || backdropUploading || !title.trim() || !description.trim()}
          className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary/20"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </button>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function Section({ number, title, subtitle, children }: {
  number: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0e0e0e] border border-[#1a1a1a] rounded-2xl p-7">
      <div className="flex items-start gap-3.5 mb-6">
        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
          {number}
        </div>
        <div>
          <h3 className="text-[15px] font-display tracking-wider text-white">{title}</h3>
          <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-col gap-5">
        {children}
      </div>
    </div>
  );
}

function FormField({ label, required, hint, children }: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-white/20">{hint}</p>}
    </div>
  );
}

function FormInput({ placeholder, value, onChange, type = 'text', onKeyDown }: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`w-full bg-[#111] border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none transition-colors ${
        focused ? 'border-primary/50' : 'border-[#1f1f1f]'
      }`}
    />
  );
}

function FormTextarea({ placeholder, value, onChange, rows = 4 }: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`w-full bg-[#111] border rounded-lg px-3.5 py-2.5 text-sm text-white placeholder:text-white/20 outline-none resize-vertical transition-colors ${
        focused ? 'border-primary/50' : 'border-[#1f1f1f]'
      }`}
    />
  );
}

function FormSelect({ value, onChange, children }: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className={`w-full bg-[#111] border rounded-lg px-3.5 py-2.5 text-sm outline-none appearance-none cursor-pointer transition-colors ${
        focused ? 'border-primary/50' : 'border-[#1f1f1f]'
      } ${value ? 'text-white' : 'text-white/30'}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23444' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
      }}
    >
      {children}
    </select>
  );
}

function Tag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-xs px-2.5 py-1 rounded-full font-medium">
      {label}
      <button type="button" onClick={onRemove} className="text-primary/60 hover:text-primary text-sm leading-none">×</button>
    </span>
  );
}
