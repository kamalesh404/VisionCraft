import { useEffect, useState } from 'react';
import type { GalleryItem } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function Gallery() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE}/api/gallery`);
        if (!response.ok) throw new Error(`Failed to load gallery (${response.status})`);
        setItems(await response.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`bg-gray-800/60 rounded-xl ${i % 3 === 0 ? 'aspect-[3/4]' : 'aspect-square'}`} />
        ))}
      </div>
    );
  }

  if (error) return <p role="alert" className="text-center text-red-400 py-12">{error}</p>;

  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        <p className="text-5xl mb-4" aria-hidden>🖼️</p>
        <p>No images yet — head to the Generate tab to create your first one.</p>
      </div>
    );
  }

  return (
    <section aria-label="Generated image gallery">
      <div style={{ columnCount: 4, columnGap: '1rem' }} className="max-lg:[column-count:3] max-md:[column-count:2] max-sm:[column-count:1]">
        {items.map((item) => (
          <figure key={item.id} className="group relative mb-4 break-inside-avoid rounded-xl overflow-hidden border border-gray-800 bg-gray-900 hover:border-emerald-500/50 transition-colors">
            <img
              src={`${API_BASE}${item.url}`}
              alt={item.prompt}
              loading="lazy"
              className="w-full block group-hover:scale-[1.03] transition duration-300"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 opacity-0 group-hover:opacity-100 transition">
              <p className="text-xs text-gray-200 line-clamp-2">{item.prompt}</p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] uppercase tracking-wider text-emerald-400">{item.style}</span>
                <time className="text-[10px] text-gray-400">{new Date(item.created_at).toLocaleDateString()}</time>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
