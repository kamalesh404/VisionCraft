import { useState } from 'react';
import ImageGenerator from './components/ImageGenerator';
import ImageAnalyzer from './components/ImageAnalyzer';
import OCREngine from './components/OCREngine';
import Gallery from './components/Gallery';
import type { TabId } from './types';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'generate', label: 'Generate', icon: '🎨' },
  { id: 'analyze', label: 'Analyze', icon: '🔍' },
  { id: 'ocr', label: 'OCR', icon: '📝' },
  { id: 'gallery', label: 'Gallery', icon: '🖼️' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('generate');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white">
              V
            </div>
            <h1 className="text-xl font-semibold tracking-tight">
              Vision<span className="text-emerald-400">Craft</span>
            </h1>
          </div>
          <nav className="flex gap-1" role="tablist" aria-label="Workspace sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                <span className="mr-1.5" aria-hidden>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'generate' && <ImageGenerator />}
        {activeTab === 'analyze' && <ImageAnalyzer />}
        {activeTab === 'ocr' && <OCREngine />}
        {activeTab === 'gallery' && <Gallery />}
      </main>

      <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
        VisionCraft — Multi-modal AI Workspace
      </footer>
    </div>
  );
}
