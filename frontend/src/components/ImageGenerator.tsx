import { useState } from 'react';
import type { GenerationResult, StylePreset } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const STYLES: { value: StylePreset; label: string }[] = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'anime', label: 'Anime' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'cyberpunk', label: 'Cyberpunk' },
];

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [style, setStyle] = useState<StylePreset>('realistic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GenerationResult[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/generate/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, negative_prompt: negativePrompt, style }),
      });
      if (!response.ok) throw new Error(`Generation failed (${response.status})`);
      const result: GenerationResult = await response.json();
      setImages((prev) => [result, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label="Image generation" className="space-y-6">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-emerald-400">Text to Image</h2>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want to create…"
          rows={3}
          className="w-full rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 focus:ring-emerald-500/30 px-4 py-3 text-sm placeholder-gray-500 outline-none transition resize-none"
        />

        <input
          value={negativePrompt}
          onChange={(e) => setNegativePrompt(e.target.value)}
          placeholder="Negative prompt (optional) — e.g. blurry, low quality"
          className="w-full rounded-lg bg-gray-950 border border-gray-700 focus:border-emerald-500 px-4 py-2.5 text-sm placeholder-gray-500 outline-none transition"
        />

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="style" className="text-sm text-gray-400">Style</label>
          <select
            id="style"
            value={style}
            onChange={(e) => setStyle(e.target.value as StylePreset)}
            className="rounded-lg bg-gray-950 border border-gray-700 px-3 py-2 text-sm outline-none focus:border-emerald-500"
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || loading}
            className="ml-auto px-5 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>

        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((img) => (
            <figure key={img.id} className="group relative rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
              <img src={`data:image/png;base64,${img.image_base64}`} alt={img.prompt} className="w-full aspect-square object-cover group-hover:scale-105 transition duration-300" />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-xs text-gray-200 opacity-0 group-hover:opacity-100 transition">
                <span className="line-clamp-2">{img.prompt}</span>
                <span className="block mt-1 text-emerald-400 uppercase tracking-wide">{img.style}</span>
              </figcaption>
              <a href={`data:image/png;base64,${img.image_base64}`} download={`visioncraft-${img.id}.png`} className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 rounded-md px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition">
                Download
              </a>
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}
