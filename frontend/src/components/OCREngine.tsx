import { useRef, useState } from 'react';
import type { OcrResult } from '../types';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export default function OCREngine() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const chooseFile = (chosen: File) => {
    if (!chosen.type.startsWith('image/')) return;
    setFile(chosen);
    setResult(null);
    setPreview(URL.createObjectURL(chosen));
  };

  const extract = async () => {
    if (!file || loading) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE}/api/ocr`, { method: 'POST', body: formData });
      if (!response.ok) throw new Error(`OCR failed (${response.status})`);
      setResult(await response.json());
      setCopied(false);
    } finally {
      setLoading(false);
    }
  };

  const copyText = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section aria-label="OCR text extraction" className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); e.dataTransfer.files?.[0] && chooseFile(e.dataTransfer.files[0]); }}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-gray-700 bg-gray-900 hover:border-gray-500 p-10 flex flex-col items-center justify-center text-center transition"
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && chooseFile(e.target.files[0])} />
          {preview ? (
            <img src={preview} alt="Uploaded document preview" className="max-h-72 rounded-lg shadow-lg" />
          ) : (
            <>
              <p className="text-4xl mb-3" aria-hidden>📄</p>
              <p className="text-sm font-medium">Upload an image to extract text</p>
              <p className="text-xs text-gray-500 mt-1">Works best with clear, high-resolution scans</p>
            </>
          )}
        </div>
        <button
          onClick={extract}
          disabled={!file || loading}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Extracting…' : 'Extract Text'}
        </button>
      </div>

      <div>
        {result ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-emerald-400">Extracted Text</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{result.word_count} words · {result.average_confidence}% confidence</span>
                <button onClick={copyText} className="px-3 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 transition">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <pre className="flex-1 whitespace-pre-wrap font-sans text-sm text-gray-200 bg-gray-950 rounded-lg p-4 overflow-auto max-h-96">
              {result.text || 'No text detected in this image.'}
            </pre>
          </div>
        ) : (
          <div className="h-full rounded-2xl border border-gray-800 bg-gray-900/50 p-10 flex items-center justify-center text-sm text-gray-600">
            Results will appear here after extraction.
          </div>
        )}
      </div>
    </section>
  );
}
