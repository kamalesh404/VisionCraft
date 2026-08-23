import { useCallback, useRef, useState } from 'react';
import type { AnalysisResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function ImageAnalyzer() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileChosen = (chosen: File) => {
    if (!chosen.type.startsWith('image/')) return;
    setFile(chosen);
    setResult(null);
    setPreview(URL.createObjectURL(chosen));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileChosen(dropped);
  }, []);

  const analyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/api/analyze/image`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`Analysis failed (${response.status})`);
      setResult(await response.json());
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label="Image analysis" className="grid lg:grid-cols-2 gap-6">
      <div
        role="region"
        aria-label="Image upload"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 flex flex-col items-center justify-center text-center transition ${
          dragging ? 'border-emerald-400 bg-emerald-500/10' : 'border-gray-700 bg-gray-900 hover:border-gray-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && onFileChosen(e.target.files[0])}
        />
        {preview ? (
          <img src={preview} alt="Uploaded preview" className="max-h-72 rounded-lg shadow-lg" />
        ) : (
          <>
            <p className="text-4xl mb-3" aria-hidden>📤</p>
            <p className="text-sm font-medium">Drop an image here or click to upload</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP up to 10MB</p>
          </>
        )}
      </div>

      <div className="space-y-4">
        <button
          onClick={analyze}
          disabled={!file || loading}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Analyzing…' : 'Analyze Image'}
        </button>

        {result && (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-emerald-400">Caption:</span> {result.caption}
            </p>
            <div className="space-y-2.5">
              {result.predictions.map((pred) => (
                <div key={pred.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-300">{pred.label}</span>
                    <span className="text-emerald-400 font-mono">{pred.confidence}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                      style={{ width: `${pred.confidence}%` }}
                      role="progressbar"
                      aria-valuenow={pred.confidence}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Dimensions: {result.dimensions.width}×{result.dimensions.height} · Mode: {result.mode}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
