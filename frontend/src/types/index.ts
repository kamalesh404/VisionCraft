export type TabId = 'generate' | 'analyze' | 'ocr' | 'gallery';

export interface GenerateRequest {
  prompt: string;
  negative_prompt?: string;
  style: StylePreset;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
}

export type StylePreset = 'realistic' | 'anime' | 'digital-art' | 'watercolor' | 'cyberpunk';

export interface GenerationResult {
  id: string;
  image_base64: string;
  prompt: string;
  style: string;
  created_at: string;
}

export interface Prediction {
  label: string;
  confidence: number;
}

export interface AnalysisResult {
  predictions: Prediction[];
  caption: string;
  dimensions: {
    width: number;
    height: number;
  };
  mode: string;
  format?: string;
}

export interface OcrResult {
  text: string;
  word_count: number;
  character_count: number;
  average_confidence: number;
  language: string;
  lines: string[];
}

export interface GalleryItem {
  id: string;
  url: string;
  prompt: string;
  style: string;
  created_at: string;
}
